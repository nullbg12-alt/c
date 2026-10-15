const WebSocket = require('ws');
const os = require('os');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

const DEFAULT_COLORS = [
    '#5c7cff', '#5cff7c', '#ff5c7c', '#ffb84a',
    '#b85cff', '#5cffff', '#ff8c5c', '#8cff5c',
    '#ff5cff', '#dcdc50', '#ff4040', '#40ff40'
];

let seed;
const argSeed = process.argv[2];
if (argSeed !== undefined) {
    seed = Number(argSeed);
    if (!Number.isFinite(seed)) { console.error(`Bad seed: ${argSeed}`); process.exit(1); }
} else if (process.env.SEED !== undefined) {
    seed = Number(process.env.SEED);
    if (!Number.isFinite(seed)) { console.error(`Bad SEED env: ${process.env.SEED}`); process.exit(1); }
} else {
    seed = Math.floor(Math.random() * 0xFFFFFFFF);
}
seed = seed >>> 0;

const blockEdits = new Map();
const drops = new Map();
const furnaces = new Map();
let nextDropId = 1;
const players = new Map();
let nextId = 1;
const ipToId = new Map();   // "192.168.1.42" -> playerId

function isValidBlockEditId(id) {
    return id === 0 || (Number.isInteger(id) && id >= 1 && id <= 19);
}
function isValidItemId(id) {
    if (!Number.isInteger(id)) return false;
    if (id >= 1 && id <= 99) return true; // blocks + reserved
    if (id >= 100 && id <= 109) return true; // pickaxes + reserved
    if (id >= 110 && id <= 120) return true; // swords + reserved
    if (id >= 200 && id <= 225) return true;   // misc + armor
    return false;
}

wss.on('connection', (ws, req) => {
    // ---- Reconnect-by-IP logic ----
    const ip = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
    let id;
    const prevId = ipToId.get(ip);
    if (prevId !== undefined && !players.has(prevId)) {
        id = prevId;
        console.log(`Player ${id} RECONNECTED from ${ip}`);
    } else {
        id = nextId++;
        ipToId.set(ip, id);
        console.log(`Player ${id} connected from ${ip}`);
    }

    const color = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
    const name = `Player ${id}`;

    ws.send(JSON.stringify({
        type: 'init',
        id, color, seed,
        drops: [...drops.values()],
        furnaces: Object.fromEntries(furnaces),
        players: [...players.entries()].map(([pid, p]) => ({
            id: pid, xf: p.xf, yf: p.yf, name: p.name, color: p.color
        }))
    }));

    const allEdits = [...blockEdits.values()];
    const CHUNK = 2000;
    if (allEdits.length === 0) {
        ws.send(JSON.stringify({ type: 'editBatch', edits: [], done: true }));
    } else {
        for (let i = 0; i < allEdits.length; i += CHUNK) {
            ws.send(JSON.stringify({
                type: 'editBatch',
                edits: allEdits.slice(i, i + CHUNK),
                done: i + CHUNK >= allEdits.length
            }));
        }
    }

    broadcast({ type: 'join', id, color, name, xf: 10.5, yf: 200 }, id);

    ws.on('message', (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch { return; }

        if (msg.type === 'pos') {
            const p = players.get(id);
            if (p) { p.xf = msg.xf; p.yf = msg.yf; }
            broadcast({ type: 'pos', id, xf: msg.xf, yf: msg.yf, armor: msg.armor }, id);

        } else if (msg.type === 'name') {
            const p = players.get(id);
            if (p) p.name = String(msg.name || '') || p.name;
            broadcast({ type: 'name', id, name: p.name }, id);

        } else if (msg.type === 'color') {
            const p = players.get(id);
            if (p && typeof msg.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(msg.color)) {
                p.color = msg.color;
                broadcast({ type: 'color', id, color: msg.color }, id);
            }

        } else if (msg.type === 'edit') {
            if (!Number.isInteger(msg.x) || !Number.isInteger(msg.y)) return;
            if (!isValidBlockEditId(msg.id)) return;
            blockEdits.set(msg.x + ',' + msg.y, { x: msg.x, y: msg.y, id: msg.id });
            broadcast({ type: 'edit', x: msg.x, y: msg.y, id: msg.id }, id);

        } else if (msg.type === 'hit') {
            const target = players.get(msg.target);
            if (target && target.ws.readyState === 1) {
                target.ws.send(JSON.stringify({ type: 'hit', from: id, damage: msg.damage }));
            }

        } else if (msg.type === 'dropSpawn') {
            if (typeof msg.xf !== 'number' || typeof msg.yf !== 'number') return;
            if (!isValidItemId(msg.id)) return;
            if (!Number.isInteger(msg.count) || msg.count <= 0 || msg.count > 1000) return;
            const netId = nextDropId++;
            const drop = { netId, xf: msg.xf, yf: msg.yf, id: msg.id, count: msg.count };
            drops.set(netId, drop);
            const s = JSON.stringify({ type: 'dropSpawn', ...drop });
            for (const [, p] of players) {
                if (p.ws.readyState === 1) p.ws.send(s);
            }

        } else if (msg.type === 'dropPickup') {
            if (drops.has(msg.netId)) {
                const drop = drops.get(msg.netId);
                drops.delete(msg.netId);
                broadcast({ type: 'dropRemove', netId: msg.netId });
                const picker = players.get(id);
                if (picker && picker.ws.readyState === 1) {
                    picker.ws.send(JSON.stringify({
                        type: 'dropGrant', id: drop.id, count: drop.count
                    }));
                }
            }

        } else if (msg.type === 'furnaceUpdate') {
            if (!Number.isInteger(msg.x) || !Number.isInteger(msg.y)) return;
            if (!msg.state || typeof msg.state !== 'object') return;
            furnaces.set(msg.x + ',' + msg.y, msg.state);
            broadcast({ type: 'furnaceUpdate', x: msg.x, y: msg.y, state: msg.state }, id);

        } else if (msg.type === 'furnaceRemove') {
            if (!Number.isInteger(msg.x) || !Number.isInteger(msg.y)) return;
            furnaces.delete(msg.x + ',' + msg.y);
            broadcast({ type: 'furnaceRemove', x: msg.x, y: msg.y }, id);

        } else if (msg.type === 'chat') {
            const text = String(msg.text || '').slice(0, 200);
            if (!text) return;
            const p = players.get(id);
            const senderName = p ? p.name : ('Player ' + id);
            broadcast({ type: 'chat', id, name: senderName, text });
            console.log(`[chat] ${senderName} (#${id}): ${text}`);

        } else if (msg.type === 'tp') {
            const fromP = players.get(msg.from);
            const toP = players.get(msg.to);
            if (!fromP || !toP) {
                const requester = players.get(id);
                if (requester && requester.ws.readyState === 1) {
                    requester.ws.send(JSON.stringify({
                        type: 'system', text: `tp failed: player not found`
                    }));
                }
                return;
            }
            fromP.ws.send(JSON.stringify({
                type: 'tpTo',
                xf: toP.xf, yf: toP.yf
            }));
            broadcast({
                type: 'system',
                text: `Player #${msg.from} teleported to Player #${msg.to}`
            });
        }
    });

    ws.on('close', () => {
        players.delete(id);
        broadcast({ type: 'leave', id }, id);
        console.log(`Player ${id} disconnected`);
    });

    players.set(id, { ws, xf: 10.5, yf: 200, name, color });
});

function broadcast(msg, excludeId) {
    const s = JSON.stringify(msg);
    for (const [pid, p] of players) {
        if (pid === excludeId) continue;
        if (p.ws.readyState === 1) p.ws.send(s);
    }
}

console.log(`World seed: ${seed}`);
const nets = os.networkInterfaces();
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            console.log(`  Connect: ws://${net.address}:${PORT}`);
        }
    }
}
console.log(`Server running on port ${PORT}`);