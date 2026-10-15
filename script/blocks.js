const BLOCK_COLORS = {
    1: '#3fa34d', 2: '#7a4a21', 3: '#7d7d7d', 4: '#3a3a3a',
    5: '#4b4b55', 6: '#6b4f2a', 7: '#3f8f3a', 8: '#e0e0e0',
    9: '#a3462b', 10: '#8c9198', 11: '#1a1a1a', 12: '#2e2e2e',
    13: '#c9a06a', 14: '#ffd94a', 15: '#4ff0e0', 16: '#ff3b3b', 17: '#3b5bff',
    18: '#7a4fbf', 19: '#4a4a4a'
};

const BLOCK_NAMES = {
    0: 'Air', 1: 'Grass', 2: 'Dirt', 3: 'Stone', 4: 'Dark Stone',
    5: 'Deepslate', 6: 'Wood', 7: 'Leaves', 8: 'Calcite',
    9: 'Terracotta', 10: 'Andesite', 11: 'Bedrock',
    12: 'Coal Ore', 13: 'Iron Ore', 14: 'Gold Ore',
    15: 'Diamond Ore', 16: 'Redstone Ore', 17: 'Lapis Ore',
    18: 'Mythril Ore', 19: 'Furnace'
};

const BLOCK_SHORT = {
    0: 'Air', 1: 'Grass', 2: 'Dirt', 3: 'Stone', 4: 'DarkSt',
    5: 'Deepsl', 6: 'Wood', 7: 'Leaves', 8: 'Calcite',
    9: 'Terrac', 10: 'Andes', 11: 'Bedrock',
    12: 'Coal', 13: 'Iron', 14: 'Gold',
    15: 'Diam', 16: 'Redst', 17: 'Lapis',
    18: 'Mythril', 19: 'Furnace'
};

const ITEM_NAMES = {
    [PICKAXE_STONE]:    'Stone Pickaxe',                // 100
    [PICKAXE_IRON]:     'Iron Pickaxe',                 // 101
    [PICKAXE_GOLD]:     'Gold Pickaxe',                 // 102
    [PICKAXE_DIAMOND]:  'Diamond Pickaxe',              // 103
    [PICKAXE_MYTHRIL]:  'Mythril Pickaxe',              // 104
    [PICKAXE_REDSTONE]: 'Redstone Pickaxe',             // 105

    [SWORD_STONE]:   'Stone Sword',                     // 110
    [SWORD_IRON]:    'Iron Sword',                      // 111
    [SWORD_GOLD]:    'Gold Sword',                      // 112
    [SWORD_DIAMOND]: 'Diamond Sword',                   // 113
    [SWORD_MYTHRIL]: 'Mythril Sword',                   // 114

    [FOOD]:          'Food',                            // 200
    [STICK]:         'Stick',                           // 201
    [IRON_INGOT]:    'Iron Ingot',                      // 202
    [GOLD_INGOT]:    'Gold Ingot',                      // 203
    [REDSTONE_DUST]: 'Redstone Dust',                   // 204

    [ARMOR_IRON_BASE]:    'Iron Helmet',                // 210
    [ARMOR_IRON_BASE+1]:  'Iron Chestplate',            // 211
    [ARMOR_IRON_BASE+2]:  'Iron Leggings',              // 212
    [ARMOR_IRON_BASE+3]:  'Iron Boots',                 // 213
    [ARMOR_GOLD_BASE]:      'Gold Helmet',              // 214
    [ARMOR_GOLD_BASE+1]:    'Gold Chestplate',          // 215
    [ARMOR_GOLD_BASE+2]:    'Gold Leggings',            // 216
    [ARMOR_GOLD_BASE+3]:    'Gold Boots',               // 217
    [ARMOR_DIAMOND_BASE]:    'Diamond Helmet',          // 218
    [ARMOR_DIAMOND_BASE+1]:  'Diamond Chestplate',      // 219
    [ARMOR_DIAMOND_BASE+2]:  'Diamond Leggings',        // 220
    [ARMOR_DIAMOND_BASE+3]:  'Diamond Boots',           // 221
    [ARMOR_MYTHRIL_BASE]:      'Mythril Helmet',        // 222
    [ARMOR_MYTHRIL_BASE+1]:    'Mythril Chestplate',    // 223
    [ARMOR_MYTHRIL_BASE+2]:    'Mythril Leggings',      // 224
    [ARMOR_MYTHRIL_BASE+3]:    'Mythril Boots'          // 225
};

const ITEM_SHORT = {
    [PICKAXE_STONE]:    'StonePk',
    [PICKAXE_IRON]:     'IronPk',
    [PICKAXE_GOLD]:     'GoldPk',
    [PICKAXE_DIAMOND]:  'DiaPk',
    [PICKAXE_MYTHRIL]:  'MythPk',
    [PICKAXE_REDSTONE]: 'RedPk',

    [SWORD_STONE]:   'StoneSw',
    [SWORD_IRON]:    'IronSw',
    [SWORD_GOLD]:    'GoldSw',
    [SWORD_DIAMOND]: 'DiaSw',
    [SWORD_MYTHRIL]: 'MythSw',

    [STICK]:            'Stick',
    [FOOD]:             'Food',
    [IRON_INGOT]:       'IronIng',
    [GOLD_INGOT]:       'GoldIng',
    [REDSTONE_DUST]:    'RedDust',

    [ARMOR_IRON_BASE]:    'FeHelm', [ARMOR_IRON_BASE+1]:  'FeChest',
    [ARMOR_IRON_BASE+2]:  'FeLegs', [ARMOR_IRON_BASE+3]:  'FeBoots',

    [ARMOR_GOLD_BASE]:    'AuHelm', [ARMOR_GOLD_BASE+1]:  'AuChest',
    [ARMOR_GOLD_BASE+2]:  'AuLegs', [ARMOR_GOLD_BASE+3]:  'AuBoots',

    [ARMOR_DIAMOND_BASE]:    'DiHelm', [ARMOR_DIAMOND_BASE+1]:  'DiChest',
    [ARMOR_DIAMOND_BASE+2]:  'DiLegs', [ARMOR_DIAMOND_BASE+3]:  'DiBoots',

    [ARMOR_MYTHRIL_BASE]:    'MyHelm', [ARMOR_MYTHRIL_BASE+1]:  'MyChest',
    [ARMOR_MYTHRIL_BASE+2]:  'MyLegs', [ARMOR_MYTHRIL_BASE+3]:  'MyBoots'
};

const PICKAXE_HEAD_COLOR = {
    [PICKAXE_STONE]:   '#8a8a8a',
    [PICKAXE_IRON]:    '#d8d8d8',
    [PICKAXE_GOLD]:    '#ffd94a',
    [PICKAXE_DIAMOND]: '#4ff0e0',
    [PICKAXE_MYTHRIL]: '#c8a0ff',
    [PICKAXE_REDSTONE]: '#ff3b3b',
};

const SWORD_BLADE_COLOR = {
    [SWORD_STONE]:   '#8a8a8a',
    [SWORD_IRON]:    '#d8d8d8',
    [SWORD_GOLD]:    '#ffd94a',
    [SWORD_DIAMOND]: '#4ff0e0',
    [SWORD_MYTHRIL]: '#c8a0ff'
};

function isPickaxe(id) {
    return id === PICKAXE_STONE || id === PICKAXE_IRON || id === PICKAXE_GOLD ||
           id === PICKAXE_REDSTONE ||
           id === PICKAXE_DIAMOND || id === PICKAXE_MYTHRIL;
}

function isSword(id) {
    return id === SWORD_STONE || id === SWORD_IRON || id === SWORD_GOLD ||
           id === SWORD_DIAMOND || id === SWORD_MYTHRIL;
}

function isPlaceableBlock(id) {
    return id >= 1 && id <= 19;
}

function armorMaterial(id) {
    if (id >= ARMOR_IRON_BASE    && id <= ARMOR_IRON_BASE + 3)    return 'iron';
    if (id >= ARMOR_GOLD_BASE    && id <= ARMOR_GOLD_BASE + 3)    return 'gold';
    if (id >= ARMOR_DIAMOND_BASE && id <= ARMOR_DIAMOND_BASE + 3) return 'diamond';
    if (id >= ARMOR_MYTHRIL_BASE && id <= ARMOR_MYTHRIL_BASE + 3) return 'mythril';
    return null;
}

function armorPiece(id) {
    if (id >= ARMOR_IRON_BASE    && id <= ARMOR_IRON_BASE + 3)    return id - ARMOR_IRON_BASE;
    if (id >= ARMOR_GOLD_BASE    && id <= ARMOR_GOLD_BASE + 3)    return id - ARMOR_GOLD_BASE;
    if (id >= ARMOR_DIAMOND_BASE && id <= ARMOR_DIAMOND_BASE + 3) return id - ARMOR_DIAMOND_BASE;
    if (id >= ARMOR_MYTHRIL_BASE && id <= ARMOR_MYTHRIL_BASE + 3) return id - ARMOR_MYTHRIL_BASE;
    return -1;
}

function isArmor(id) {
    return armorMaterial(id) !== null;
}

function itemName(id) {
    return BLOCK_NAMES[id] || ITEM_NAMES[id] || '?';
}

function itemShort(id) {
    return BLOCK_SHORT[id] || ITEM_SHORT[id] || '?';
}

function itemColor(id) {
    if (BLOCK_COLORS[id]) return BLOCK_COLORS[id];
    if (PICKAXE_HEAD_COLOR[id]) return PICKAXE_HEAD_COLOR[id];
    if (SWORD_BLADE_COLOR[id]) return SWORD_BLADE_COLOR[id];
    const mat = armorMaterial(id);
    if (mat) return ARMOR_MATERIAL_COLOR[mat];
    if (id === IRON_INGOT) return '#d8d8d8';
    if (id === GOLD_INGOT) return '#ffd94a';
    if (id === STICK) return '#6b4f2a';
    if (id === FOOD)  return '#8B4513';
    if (id === REDSTONE_DUST) return '#ff3b3b';
    return '#FF00FF';
}

let selectedBlock = 0;

const tileCache = {};

function blockHash(x, y, seed = 0) {
    let h = (x * 374761393 + y * 668265263 + seed * 982451653) ^ 0x9e3779b9;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}


function buildTileCache() {
    // --- Blocks ---
    for (const idStr in BLOCK_COLORS) {
        const id = parseInt(idStr, 10);
        const variants = [];

        for (let v = 0; v < 4; v++) {
            const c = document.createElement('canvas');
            c.width = BLOCK_SIZE;
            c.height = BLOCK_SIZE;
            const g = c.getContext('2d');

            g.fillStyle = BLOCK_COLORS[id];
            g.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);

            for (let i = 0; i < 10; i++) {
                const n1 = blockHash(i * 13 + v * 7, i * 29 + v * 3, id);
                const n2 = blockHash(i * 17 + v * 11, i * 23 + v * 5, id * 3);
                g.fillStyle = (i % 2 === 0) ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)';
                const size = 4 + Math.floor(n1 * 6);
                g.fillRect(n2 * (BLOCK_SIZE - size), n1 * (BLOCK_SIZE - size), size, size);
            }

            if (id >= 12 && id <= 18) {
                const oreColors = {
                    12: '#111111', 13: '#e0b075', 14: '#fff176',
                    15: '#7ff7ee', 16: '#ff6b6b', 17: '#6b8bff',
                    18: '#e0c0ff'
                };
                g.fillStyle = oreColors[id];
                for (let i = 0; i < 5; i++) {
                    const hx = blockHash(i * 11 + v * 5, i * 23 + v * 9, id * 13);
                    const hy = blockHash(i * 7 + v * 3, i * 19 + v * 11, id * 17);
                    const r = 3 + (i % 2);
                    g.beginPath();
                    g.arc(hx * BLOCK_SIZE, hy * BLOCK_SIZE, r, 0, Math.PI * 2);
                    g.fill();
                }
            }

            g.strokeStyle = 'rgba(0,0,0,0.25)';
            g.lineWidth = 1;
            g.strokeRect(0.5, 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);

            variants.push(c);
        }

        tileCache[id] = variants;
    }

    // --- Helper for icon canvases ---
    function iconCanvas(drawFn) {
        const c = document.createElement('canvas');
        c.width = BLOCK_SIZE;
        c.height = BLOCK_SIZE;
        const g = c.getContext('2d');
        g.fillStyle = '#2b2b2b';
        g.fillRect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
        drawFn(g, BLOCK_SIZE);
        g.strokeStyle = 'rgba(0,0,0,0.35)';
        g.lineWidth = 1;
        g.strokeRect(0.5, 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        return c;
    }

    // --- Pickaxes ---
    for (const pid of [PICKAXE_STONE, PICKAXE_IRON, PICKAXE_GOLD, PICKAXE_REDSTONE, PICKAXE_DIAMOND, PICKAXE_MYTHRIL]) {
        const color = PICKAXE_HEAD_COLOR[pid];
        tileCache[pid] = [iconCanvas((g, S) => {
            g.strokeStyle = '#6b4f2a';
            g.lineWidth = S * 0.13;
            g.lineCap = 'round';
            g.beginPath(); g.moveTo(S * 0.5, S * 0.4); g.lineTo(S * 0.5, S * 0.88); g.stroke();

            g.strokeStyle = color;
            g.lineWidth = S * 0.14;
            g.beginPath();
            g.moveTo(S * 0.16, S * 0.40);
            g.quadraticCurveTo(S * 0.5, S * 0.10, S * 0.84, S * 0.40);
            g.stroke();
        })];
    }

    // --- Swords ---
    for (const sid of [SWORD_STONE, SWORD_IRON, SWORD_GOLD, SWORD_DIAMOND, SWORD_MYTHRIL]) {
        const color = SWORD_BLADE_COLOR[sid];
        tileCache[sid] = [iconCanvas((g, S) => {
            // Handle
            g.strokeStyle = '#6b4f2a';
            g.lineWidth = S * 0.13;
            g.lineCap = 'round';
            g.beginPath();
            g.moveTo(S * 0.22, S * 0.78);
            g.lineTo(S * 0.38, S * 0.62);
            g.stroke();

            // Pommel
            g.fillStyle = '#3a2a1a';
            g.beginPath();
            g.arc(S * 0.19, S * 0.81, S * 0.07, 0, Math.PI * 2);
            g.fill();

            // Guard
            g.strokeStyle = '#3a2a1a';
            g.lineWidth = S * 0.09;
            g.lineCap = 'butt';
            g.beginPath();
            g.moveTo(S * 0.28, S * 0.56);
            g.lineTo(S * 0.50, S * 0.78);
            g.stroke();

            // Blade
            g.strokeStyle = color;
            g.lineWidth = S * 0.11;
            g.beginPath();
            g.moveTo(S * 0.42, S * 0.56);
            g.lineTo(S * 0.80, S * 0.18);
            g.stroke();

            // Tip
            g.fillStyle = color;
            g.beginPath();
            g.moveTo(S * 0.72, S * 0.20);
            g.lineTo(S * 0.88, S * 0.08);
            g.lineTo(S * 0.78, S * 0.28);
            g.closePath();
            g.fill();

            // Highlight
            g.strokeStyle = 'rgba(255,255,255,0.5)';
            g.lineWidth = S * 0.035;
            g.beginPath();
            g.moveTo(S * 0.44, S * 0.54);
            g.lineTo(S * 0.78, S * 0.20);
            g.stroke();
        })];
    }

    // --- Stick ---
    tileCache[STICK] = [iconCanvas((g, S) => {
        g.strokeStyle = '#6b4f2a';
        g.lineWidth = S * 0.16;
        g.lineCap = 'round';
        g.beginPath(); g.moveTo(S * 0.5, S * 0.15); g.lineTo(S * 0.5, S * 0.85); g.stroke();

        g.strokeStyle = 'rgba(140,100,60,0.7)';
        g.lineWidth = S * 0.04;
        g.beginPath(); g.moveTo(S * 0.46, S * 0.2); g.lineTo(S * 0.46, S * 0.8); g.stroke();
    })];

    // --- Food ---
    tileCache[FOOD] = [iconCanvas((g, S) => {
        g.fillStyle = '#8B4513';
        g.beginPath();
        g.ellipse(S * 0.42, S * 0.42, S * 0.24, S * 0.20, -0.4, 0, Math.PI * 2);
        g.fill();

        g.strokeStyle = '#F5DEB3';
        g.lineWidth = S * 0.11;
        g.lineCap = 'round';
        g.beginPath(); g.moveTo(S * 0.52, S * 0.50); g.lineTo(S * 0.80, S * 0.78); g.stroke();

        g.fillStyle = '#F5DEB3';
        g.beginPath(); g.arc(S * 0.82, S * 0.80, S * 0.075, 0, Math.PI * 2); g.fill();
    })];

    // --- Ingots ---
    tileCache[IRON_INGOT] = [iconCanvas((g, S) => {
        g.fillStyle = '#d8d8d8';
        g.beginPath();
        g.moveTo(S * 0.20, S * 0.65);
        g.lineTo(S * 0.80, S * 0.65);
        g.lineTo(S * 0.72, S * 0.40);
        g.lineTo(S * 0.28, S * 0.40);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.4)';
        g.lineWidth = 1.5;
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.6)';
        g.fillRect(S * 0.32, S * 0.43, S * 0.36, S * 0.04);
    })];

    tileCache[GOLD_INGOT] = [iconCanvas((g, S) => {
        g.fillStyle = '#ffd94a';
        g.beginPath();
        g.moveTo(S * 0.20, S * 0.65);
        g.lineTo(S * 0.80, S * 0.65);
        g.lineTo(S * 0.72, S * 0.40);
        g.lineTo(S * 0.28, S * 0.40);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(120,80,0,0.5)';
        g.lineWidth = 1.5;
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.fillRect(S * 0.32, S * 0.43, S * 0.36, S * 0.04);
    })];

    // Redstone dust
    tileCache[REDSTONE_DUST] = [iconCanvas((g, S) => {
        const dots = [
            [0.5, 0.55, 0.14],
            [0.35, 0.62, 0.09],
            [0.65, 0.62, 0.09],
            [0.42, 0.45, 0.08],
            [0.58, 0.45, 0.08],
            [0.28, 0.52, 0.07],
            [0.72, 0.52, 0.07],
            [0.5, 0.72, 0.07]
        ];
        for (const [dx, dy, r] of dots) {
            g.fillStyle = '#ff3b3b';
            g.beginPath();
            g.arc(S * dx, S * dy, S * r, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = 'rgba(255,120,120,0.7)';
            g.beginPath();
            g.arc(S * dx - S * r * 0.3, S * dy - S * r * 0.3, S * r * 0.4, 0, Math.PI * 2);
            g.fill();
        }
    })];

    // --- Armor ---
    function drawArmorIcon(g, S, piece, color) {
        g.fillStyle = color;
        g.strokeStyle = 'rgba(0,0,0,0.5)';
        g.lineWidth = 1.5;

        if (piece === 0) {
            g.beginPath();
            g.moveTo(S * 0.25, S * 0.65);
            g.lineTo(S * 0.25, S * 0.42);
            g.quadraticCurveTo(S * 0.50, S * 0.15, S * 0.75, S * 0.42);
            g.lineTo(S * 0.75, S * 0.65);
            g.closePath();
            g.fill();
            g.stroke();
            g.fillStyle = 'rgba(0,0,0,0.7)';
            g.fillRect(S * 0.32, S * 0.50, S * 0.36, S * 0.08);
        } else if (piece === 1) {
            g.beginPath();
            g.moveTo(S * 0.22, S * 0.25);
            g.lineTo(S * 0.78, S * 0.25);
            g.lineTo(S * 0.82, S * 0.60);
            g.lineTo(S * 0.70, S * 0.85);
            g.lineTo(S * 0.30, S * 0.85);
            g.lineTo(S * 0.18, S * 0.60);
            g.closePath();
            g.fill();
            g.stroke();
            g.fillStyle = 'rgba(0,0,0,0.5)';
            g.beginPath();
            g.arc(S * 0.50, S * 0.30, S * 0.08, 0, Math.PI);
            g.fill();
        } else if (piece === 2) {
            g.fillRect(S * 0.22, S * 0.20, S * 0.24, S * 0.70);
            g.fillRect(S * 0.54, S * 0.20, S * 0.24, S * 0.70);
            g.fillRect(S * 0.20, S * 0.20, S * 0.60, S * 0.20);
            g.strokeRect(S * 0.22, S * 0.20, S * 0.24, S * 0.70);
            g.strokeRect(S * 0.54, S * 0.20, S * 0.24, S * 0.70);
        } else {
            g.fillRect(S * 0.20, S * 0.30, S * 0.24, S * 0.45);
            g.fillRect(S * 0.56, S * 0.30, S * 0.24, S * 0.45);
            g.fillRect(S * 0.20, S * 0.70, S * 0.30, S * 0.14);
            g.fillRect(S * 0.50, S * 0.70, S * 0.30, S * 0.14);
            g.strokeRect(S * 0.20, S * 0.30, S * 0.24, S * 0.45);
            g.strokeRect(S * 0.56, S * 0.30, S * 0.24, S * 0.45);
            g.strokeRect(S * 0.20, S * 0.70, S * 0.30, S * 0.14);
            g.strokeRect(S * 0.50, S * 0.70, S * 0.30, S * 0.14);
        }
    }

    for (const [base, mat] of [
        [ARMOR_IRON_BASE, 'iron'],
        [ARMOR_GOLD_BASE, 'gold'],
        [ARMOR_DIAMOND_BASE, 'diamond'],
        [ARMOR_MYTHRIL_BASE, 'mythril']
    ]) {
        const color = ARMOR_MATERIAL_COLOR[mat];
        for (let piece = 0; piece < 4; piece++) {
            tileCache[base + piece] = [iconCanvas((g, S) => {
                drawArmorIcon(g, S, piece, color);
            })];
        }
    }
}

const CRAFTING_RECIPES = [
    { grid: [[6]], result: { id: STICK, count: 4 } },
    { grid: [[3,3,3],[null,STICK,null],[null,STICK,null]], result: { id: PICKAXE_STONE,   count: 1 } },
    { grid: [[IRON_INGOT,IRON_INGOT,IRON_INGOT],[null,STICK,null],[null,STICK,null]], result: { id: PICKAXE_IRON, count: 1 } },
    { grid: [[GOLD_INGOT,GOLD_INGOT,GOLD_INGOT],[null,STICK,null],[null,STICK,null]], result: { id: PICKAXE_GOLD, count: 1 } },
    { grid: [[15,15,15],[null,STICK,null],[null,STICK,null]], result: { id: PICKAXE_DIAMOND, count: 1 } },
    { grid: [[18,18,18],[null,STICK,null],[null,STICK,null]], result: { id: PICKAXE_MYTHRIL, count: 1 } },
    { grid: [[REDSTONE_DUST, 9, REDSTONE_DUST], [null, STICK, null], [null, STICK, null]], result: { id: PICKAXE_REDSTONE, count: 1 } },
    { grid: [[null,3,null],[null,3,null],[null,STICK,null]], result: { id: SWORD_STONE,   count: 1 } },
    { grid: [[null,IRON_INGOT,null],[null,IRON_INGOT,null],[null,STICK,null]], result: { id: SWORD_IRON, count: 1 } },
    { grid: [[null,GOLD_INGOT,null],[null,GOLD_INGOT,null],[null,STICK,null]], result: { id: SWORD_GOLD, count: 1 } },
    { grid: [[null,15,null],[null,15,null],[null,STICK,null]], result: { id: SWORD_DIAMOND, count: 1 } },
    { grid: [[null,18,null],[null,18,null],[null,STICK,null]], result: { id: SWORD_MYTHRIL, count: 1 } },
    { grid: [[3,3,3],[3,null,3],[3,3,3]], result: { id: FURNACE, count: 1 } },

    // Iron armor
    { grid: [[IRON_INGOT,IRON_INGOT,IRON_INGOT],[IRON_INGOT,null,IRON_INGOT]],                                    result: { id: ARMOR_IRON_BASE,   count: 1 } },
    { grid: [[IRON_INGOT,null,IRON_INGOT],[IRON_INGOT,IRON_INGOT,IRON_INGOT],[IRON_INGOT,IRON_INGOT,IRON_INGOT]], result: { id: ARMOR_IRON_BASE+1, count: 1 } },
    { grid: [[IRON_INGOT,IRON_INGOT,IRON_INGOT],[IRON_INGOT,null,IRON_INGOT],[IRON_INGOT,null,IRON_INGOT]],       result: { id: ARMOR_IRON_BASE+2, count: 1 } },
    { grid: [[null,null,null],[IRON_INGOT,null,IRON_INGOT],[IRON_INGOT,null,IRON_INGOT]],                         result: { id: ARMOR_IRON_BASE+3, count: 1 } },

    // Gold armor
    { grid: [[GOLD_INGOT,GOLD_INGOT,GOLD_INGOT],[GOLD_INGOT,null,GOLD_INGOT]],                                    result: { id: ARMOR_GOLD_BASE,   count: 1 } },
    { grid: [[GOLD_INGOT,null,GOLD_INGOT],[GOLD_INGOT,GOLD_INGOT,GOLD_INGOT],[GOLD_INGOT,GOLD_INGOT,GOLD_INGOT]], result: { id: ARMOR_GOLD_BASE+1, count: 1 } },
    { grid: [[GOLD_INGOT,GOLD_INGOT,GOLD_INGOT],[GOLD_INGOT,null,GOLD_INGOT],[GOLD_INGOT,null,GOLD_INGOT]],       result: { id: ARMOR_GOLD_BASE+2, count: 1 } },
    { grid: [[null,null,null],[GOLD_INGOT,null,GOLD_INGOT],[GOLD_INGOT,null,GOLD_INGOT]],                         result: { id: ARMOR_GOLD_BASE+3, count: 1 } },

    // Diamond armor
    { grid: [[15,15,15],[15,null,15]],                    result: { id: ARMOR_DIAMOND_BASE,   count: 1 } },
    { grid: [[15,null,15],[15,15,15],[15,15,15]],         result: { id: ARMOR_DIAMOND_BASE+1, count: 1 } },
    { grid: [[15,15,15],[15,null,15],[15,null,15]],       result: { id: ARMOR_DIAMOND_BASE+2, count: 1 } },
    { grid: [[null,null,null],[15,null,15],[15,null,15]], result: { id: ARMOR_DIAMOND_BASE+3, count: 1 } },

    // Mythril armor
    { grid: [[18,18,18],[18,null,18]],                    result: { id: ARMOR_MYTHRIL_BASE,   count: 1 } },
    { grid: [[18,null,18],[18,18,18],[18,18,18]],         result: { id: ARMOR_MYTHRIL_BASE+1, count: 1 } },
    { grid: [[18,18,18],[18,null,18],[18,null,18]],       result: { id: ARMOR_MYTHRIL_BASE+2, count: 1 } },
    { grid: [[null,null,null],[18,null,18],[18,null,18]], result: { id: ARMOR_MYTHRIL_BASE+3, count: 1 } }
];

const BLOCK_DROPS = {
    16: { id: REDSTONE_DUST, count: 1 }
};

function getBlockDrop(blockId) {
    return BLOCK_DROPS[blockId] || { id: blockId, count: 1 };
}