function connectToServer(url, playerName) {
    if (ws) try { ws.close(); } catch {}
    ws = new WebSocket(url);

    ws.onopen = () => {
        connected = true;
        console.log('Connected to', url);
        if (playerName) ws.send(JSON.stringify({ type: 'name', name: playerName }));
        // Always send our chosen color so the server uses it instead of its random default
        ws.send(JSON.stringify({ type: 'color', color: myColor }));
    };

    ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        handleNetMessage(msg);
    };

    ws.onclose = () => {
        connected = false;
        console.log('Disconnected from server');
    };

    ws.onerror = (err) => {
        console.error('WebSocket error', err);
    };
}

function handleNetMessage(msg) {
    switch (msg.type) {
        case 'init': {
            myNetId = msg.id;
            // NOTE: do NOT touch myColor here — we keep our own local choice.
            console.log('Assigned id', myNetId, 'seed', msg.seed);

            generateWorld('normal', msg.seed);

            // Restore server-side drops
            if (Array.isArray(msg.drops)) {
                for (const d of msg.drops) {
                    foodDrops.push({
                        netId: d.netId,
                        xf: d.xf, yf: d.yf,
                        vx: 0, vy: 0,
                        id: d.id, count: d.count,
                        spawnTick: globalTick
                    });
                }
            }
            if (msg.furnaces) {
                for (const [key, state] of Object.entries(msg.furnaces)) {
                    furnaces.set(key, state);
                }
            }
            remotePlayers.clear();
            for (const p of msg.players) {
                remotePlayers.set(p.id, {
                    xf: p.xf, yf: p.yf,
                    prevXf: p.xf, prevYf: p.yf,
                    targetXf: p.xf, targetYf: p.yf,
                    name: p.name,
                    color: p.color || '#5c7cff'
                });
            }
            updateViewOffset();
            break;
        }
        case 'editBatch': {
            for (const e of msg.edits) {
                if (!Number.isInteger(e.x) || !Number.isInteger(e.y)) continue;
                if (!Number.isInteger(e.id)) continue;
                if (e.id !== 0 && (e.id < 1 || e.id > 19)) continue;
                blockEdits.set(e.x + ',' + e.y, { x: e.x, y: e.y, id: e.id });
                setBlock(e.x, e.y, e.id);
            }
            break;
        }
        case 'join':
            remotePlayers.set(msg.id, {
                xf: msg.xf ?? 10.5, yf: msg.yf ?? 200,
                prevXf: msg.xf ?? 10.5, prevYf: msg.yf ?? 200,
                targetXf: msg.xf ?? 10.5, targetYf: msg.yf ?? 200,
                name: msg.name || ('Player ' + msg.id),
                color: msg.color || '#5c7cff',
                armor: [null, null, null, null]
            });
            break;
        case 'leave':
            remotePlayers.delete(msg.id);
            break;
        case 'pos': {
            const rp = remotePlayers.get(msg.id);
            if (rp) {
                rp.targetXf = msg.xf;
                rp.targetYf = msg.yf;
                if (msg.armor) {
                    rp.armor = msg.armor.map(id => id ? { id, count: 1 } : null);
                }
            }
            break;
        }
        case 'name': {
            const rp = remotePlayers.get(msg.id);
            if (rp) rp.name = msg.name;
            break;
        }
        case 'color': {
            const rp = remotePlayers.get(msg.id);
            if (rp) rp.color = msg.color;
            break;
        }
        case 'edit':
            if (typeof msg.x !== 'number' || typeof msg.y !== 'number') break;
            if (!Number.isInteger(msg.id)) break;
            if (msg.id !== 0 && (msg.id < 1 || msg.id > 19)) break;
            blockEdits.set(msg.x + ',' + msg.y, { x: msg.x, y: msg.y, id: msg.id });
            setBlock(msg.x, msg.y, msg.id);
            break;
        case 'hit':
            damagePlayer(msg.damage);
            break;
        case 'dropSpawn':
            foodDrops.push({
                netId: msg.netId,
                xf: msg.xf, yf: msg.yf,
                vx: 0, vy: 0,
                id: msg.id, count: msg.count
            });
            break;
        case 'dropRemove':
            for (let i = foodDrops.length - 1; i >= 0; i--) {
                if (foodDrops[i].netId === msg.netId) foodDrops.splice(i, 1);
            }
            break;
        case 'dropGrant':
            addItem(msg.id, msg.count);
            break;
        case 'furnaceUpdate': {
            const key = msg.x + ',' + msg.y;
            furnaces.set(key, msg.state);
            break;
        }
        case 'furnaceRemove': {
            furnaces.delete(msg.x + ',' + msg.y);
            break;
        }
        case 'chat': {
            chatMessages.push({
                text: (msg.name || 'Player') + ': ' + msg.text,
                tick: globalTick,
                color: '#FFFFFF'
            });
            if (chatMessages.length > 30) chatMessages.shift();
            // Bubble for the speaking remote player
            const rp = remotePlayers.get(msg.id);
            if (rp) { rp.chatBubble = msg.text; rp.chatBubbleTick = globalTick; }
            break;
        }
        case 'system': {
            chatMessages.push({
                text: msg.text,
                tick: globalTick,
                color: '#FFFF88'
            });
            if (chatMessages.length > 30) chatMessages.shift();
            break;
        }
        case 'tpTo': {
            playerXf = msg.xf;
            playerYf = msg.yf;
            prevPlayerXf = playerXf;
            prevPlayerYf = playerYf;
            velocityX = 0;
            velocityY = 0;
            updateViewOffset();
            break;
        }
    }
}

function netSendPosition() {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
            type: 'pos',
            xf: playerXf, yf: playerYf,
            armor: armorSlots.map(s => s ? s.id : 0)
        }));
    }
}

function netSendEdit(x, y, id) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'edit', x, y, id }));
    }
}

function netSendHit(targetId, damage) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'hit', target: targetId, damage }));
    }
}

function updateRemotePlayers() {
    for (const rp of remotePlayers.values()) {
        rp.prevXf = rp.xf;
        rp.prevYf = rp.yf;
        rp.xf += (rp.targetXf - rp.xf) * 0.75;
        rp.yf += (rp.targetYf - rp.yf) * 0.75;
    }
}

function getRemotePlayerAt(mx, my, camX, camY) {
    for (const [id, rp] of remotePlayers) {
        const feetY = (WORLD_HEIGHT - rp.yf - camY) * BLOCK_SIZE;
        const sx = (rp.xf - PLAYER_HALF_W - camX) * BLOCK_SIZE;
        const sy = feetY - PLAYER_H * BLOCK_SIZE;
        const sw = PLAYER_HALF_W * 2 * BLOCK_SIZE;
        const sh = PLAYER_H * BLOCK_SIZE;
        if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) {
            return { id, ...rp };
        }
    }
    return null;
}

function netSendChat(text) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'chat', text }));
    }
}

function netSendTp(from, to) {
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'tp', from, to }));
    }
}