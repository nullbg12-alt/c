const ATLAS_FILE = 'terrain.png';
const ATLAS_TILE_SIZE = 32;
const ATLAS_COLS = 16;

// blockId → slot index in the atlas (0 = top-left, reading left→right, then top→bottom)
const ATLAS_SLOTS = {
    1:  0,   // Grass
    2:  1,   // Dirt
    3:  2,   // Stone
    4:  3,   // Dark Stone
    5:  4,   // Deepslate
    6:  5,   // Wood
    7:  6,   // Leaves
    8:  7,   // Calcite
    9:  8,   // Terracotta
    10: 9,   // Andesite
    11: 10,  // Bedrock
    12: 11,  // Coal Ore
    13: 12,  // Iron Ore
    14: 13,  // Gold Ore
    15: 14,  // Diamond Ore
    16: 15,  // Redstone Ore
    17: 16,  // Lapis Ore
    18: 17,  // Mythril Ore
    19: 18,  // Furnace
};

function loadTextureAtlas() {
    const img = new Image();
    img.onload = () => {
        applyAtlasToTileCache(img);
        console.log(`Texture atlas loaded: ${img.width}×${img.height}`);
    };
    img.onerror = () => {
        console.warn('terrain.png not found or failed to load — sticking with procedural tiles');
    };
    img.src = ATLAS_FILE;
}

function applyAtlasToTileCache(img) {
    for (const idStr in ATLAS_SLOTS) {
        const id = parseInt(idStr, 10);
        const slot = ATLAS_SLOTS[id];
        const col = slot % ATLAS_COLS;
        const row = Math.floor(slot / ATLAS_COLS);

        const sx = col * ATLAS_TILE_SIZE;
        const sy = row * ATLAS_TILE_SIZE;

        // Bounds check so a bad slot value doesn't throw
        if (sx + ATLAS_TILE_SIZE > img.width || sy + ATLAS_TILE_SIZE > img.height) {
            console.warn(`Atlas slot ${slot} for id ${id} is outside terrain.png bounds`);
            continue;
        }

        const c = document.createElement('canvas');
        c.width = BLOCK_SIZE;
        c.height = BLOCK_SIZE;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;

        g.drawImage(
            img,
            sx, sy, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE,
            0, 0, BLOCK_SIZE, BLOCK_SIZE
        );

        tileCache[id] = [c];
    }
}