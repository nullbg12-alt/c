function chunkKey(cx, cy) { return cx + ',' + cy; }

function getChunk(cx, cy) {
    return chunks.get(chunkKey(cx, cy)) || null;
}

function ensureChunk(cx, cy) {
    const key = chunkKey(cx, cy);
    let c = chunks.get(key);
    if (c) return c;
    c = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    chunks.set(key, c);
    generateChunk(cx, cy, c);
    return c;
}

function getBlock(x, y) {
    if (x < 0 || x >= WORLD_WIDTH) return 0;
    if (y < 0 || y >= WORLD_HEIGHT) return 0;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    let c = chunks.get(chunkKey(cx, cy));
    if (!c) c = ensureChunk(cx, cy);
    return c[(y - cy * CHUNK_SIZE) * CHUNK_SIZE + (x - cx * CHUNK_SIZE)];
}

function setBlock(x, y, id) {
    if (x < 0 || x >= WORLD_WIDTH) return;
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    let c = chunks.get(chunkKey(cx, cy));
    if (!c) c = ensureChunk(cx, cy);
    c[(y - cy * CHUNK_SIZE) * CHUNK_SIZE + (x - cx * CHUNK_SIZE)] = id;
}

// ---- Pure column info (no block reads) ----

function computeColumnInfo(x) {
    const sampleX = x + 100;
    const FAR_START = 12550821;

    const baseHills = Perlin.noise(sampleX * 0.005) * 8;
    const mountainNoise = Perlin.noise(sampleX * 0.015);
    const mountains = Math.pow(mountainNoise, 3.0) * 65;
    const surfaceDetail = Perlin.noise(sampleX * 0.15) * 2;
    const randomRoughness = (Perlin.noise(sampleX * 0.7) * 2) - 1;
    let totalOffset = baseHills + mountains + surfaceDetail + randomRoughness;
    let surfaceY = GROUND_LEVEL + Math.floor(totalOffset);
    let isMountain = mountains > 18;
    let dirtDepth = 4 + Math.floor(Perlin.noise(sampleX * 0.5) * 3);

    const FAR_TRANSITION = 2000;
    const ax = Math.abs(sampleX);
    if (ax >= FAR_START) {
        const t = Math.min(1, (ax - FAR_START) / FAR_TRANSITION);

        const x2 = Math.imul(sampleX | 0, sampleX | 0);
        const x3 = Math.imul(x2, 40503);
        const chaosA = x2 / 2147483647;
        const chaosB = x3 / 2147483647;

        const brokenOffset = chaosA * 80 + chaosB * 20;
        totalOffset = totalOffset * (1 - t) + brokenOffset * t;
    }

    surfaceY = GROUND_LEVEL + Math.floor(totalOffset);
    isMountain = mountains > 18;
    dirtDepth = 4 + Math.floor(Perlin.noise(sampleX * 0.5) * 3);

    return { surfaceY, isMountain, dirtDepth };
}

function columnRng(x) {
    const key = x + ':' + serverSeed;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i++) {
        h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
    }
    return mulberry32(h);
}

// ---- Chunk generation ----

function generateChunk(cx, cy, data) {
    const x0 = cx * CHUNK_SIZE;
    const y0 = cy * CHUNK_SIZE;

    const key = cx + ':' + cy + ':' + serverSeed;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i++) {
        h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
    }
    const chunkRng = mulberry32(h);

    // --- Terrain ---
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = x0 + lx;
        if (x < 0 || x >= WORLD_WIDTH) continue;

        const info = computeColumnInfo(x);
        const surfaceY = info.surfaceY;
        const isMountain = info.isMountain;
        const dirtDepth = info.dirtDepth;

        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            const y = y0 + ly;
            let id = 0;

            if (y < BEDROCK_LAYERS) id = 11;
            else if (y > surfaceY) id = 0;
            else if (y === surfaceY) id = isMountain ? 8 : 1;
            else if (y > surfaceY - dirtDepth) id = isMountain ? 10 : 2;
            else if (y > surfaceY - 56) id = 3;
            else if (y > surfaceY - 120) id = 5;
            else id = 4;

            data[ly * CHUNK_SIZE + lx] = id;
        }
    }

    // --- Caves ---
    const SAMPLE = 0.028;
    const SAMPLE_Y = 0.055;

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = x0 + lx;
        if (x < 0 || x >= WORLD_WIDTH) continue;

        const surfaceY = computeColumnInfo(x).surfaceY;

        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            const y = y0 + ly;
            if (y < BEDROCK_LAYERS || y > surfaceY) continue;

            const cur = data[ly * CHUNK_SIZE + lx];
            if (cur === 0 || cur === 11) continue;

            const depth = surfaceY - y;
            if (depth < 4) continue;

            const region = noise2D(x * 0.006 + 700, y * 0.012 + 700);
            if (region < 0.70) continue;

            if (depth < 9) {
                const gate = noise2D(x * 0.011 + 300, y * 0.022 + 300);
                if (gate < 0.78) continue;
            }

            const n1 = noise2D(x * SAMPLE, y * SAMPLE_Y);
            const n2 = noise2D(x * SAMPLE + 1000, y * SAMPLE_Y + 1000);
            const tunnel1 = Math.abs(n1 - 0.5) < 0.035;
            const tunnel2 = Math.abs(n2 - 0.5) < 0.030;

            let cavern = false;
            if (y < surfaceY - 20) {
                const n3 = noise2D(x * 0.012 + 500, y * 0.03 + 500);
                if (n3 > 0.80) cavern = true;
            }

            if (tunnel1 || tunnel2 || cavern) {
                data[ly * CHUNK_SIZE + lx] = 0;
            }
        }
    }

    // --- Ores ---
    function placeVein(cxw, cyw, size, blockId) {
        for (let i = 0; i < size; i++) {
            const ox = cxw + Math.floor((chunkRng() - 0.5) * 5);
            const oy = cyw + Math.floor((chunkRng() - 0.5) * 5);
            if (ox < x0 || ox >= x0 + CHUNK_SIZE) continue;
            if (oy < y0 || oy >= y0 + CHUNK_SIZE) continue;
            const lx = ox - x0;
            const ly = oy - y0;
            const cur = data[ly * CHUNK_SIZE + lx];
            if (cur === 3 || cur === 4 || cur === 5 || cur === 10) {
                data[ly * CHUNK_SIZE + lx] = blockId;
            }
        }
    }

    const oresPerChunk = (CHUNK_SIZE * CHUNK_SIZE) / 4096;
    const G = GROUND_LEVEL;

    for (let i = 0; i < oresPerChunk * 4; i++)
        placeVein(x0 + Math.floor(chunkRng() * CHUNK_SIZE),
                  G - 60 + Math.floor(chunkRng() * 60), 12, 12);
    for (let i = 0; i < oresPerChunk * 3; i++)
        placeVein(x0 + Math.floor(chunkRng() * CHUNK_SIZE),
                  G - 100 + Math.floor(chunkRng() * 95), 10, 13);
    for (let i = 0; i < oresPerChunk * 1.2; i++)
        placeVein(x0 + Math.floor(chunkRng() * CHUNK_SIZE),
                  G - 150 + Math.floor(chunkRng() * 90), 7, 14);
    for (let i = 0; i < oresPerChunk * 1.4; i++)
        placeVein(x0 + Math.floor(chunkRng() * CHUNK_SIZE),
                  G - 170 + Math.floor(chunkRng() * 80), 7, 16);
    for (let i = 0; i < oresPerChunk * 1.0; i++)
        placeVein(x0 + Math.floor(chunkRng() * CHUNK_SIZE),
                  G - 180 + Math.floor(chunkRng() * 80), 6, 17);
    for (let i = 0; i < oresPerChunk * 1.0; i++)
        placeVein(x0 + Math.floor(chunkRng() * CHUNK_SIZE),
                  G - 190 + Math.floor(chunkRng() * 65), 5, 15);
    for (let i = 0; i < oresPerChunk * 0.25; i++)
        placeVein(x0 + Math.floor(chunkRng() * CHUNK_SIZE),
                  G - 195 + Math.floor(chunkRng() * 40), 4, 18);

    // --- Trees (extend x range so canopy from neighbors still lands here) ---
    for (let x = x0 - 3; x < x0 + CHUNK_SIZE + 3; x++) {
        if (x < 0 || x >= WORLD_WIDTH) continue;
        if (x % 6 !== 0) continue;

        const rng = columnRng(x);
        if (rng() > 0.5) continue;

        const info = computeColumnInfo(x);
        if (info.isMountain) continue;
        const surfY = info.surfaceY;
        if (surfY < 5 || surfY >= WORLD_HEIGHT) continue;

        const treeHeight = 4 + Math.floor(rng() * 3);

        // Trunk
        if (x >= x0 && x < x0 + CHUNK_SIZE) {
            for (let y = surfY + 1; y <= surfY + treeHeight; y++) {
                if (y < y0 || y >= y0 + CHUNK_SIZE) continue;
                data[(y - y0) * CHUNK_SIZE + (x - x0)] = 6;
            }
        }

        // Canopy
        const canopyBase = surfY + treeHeight - 1;
        for (let ly = canopyBase; ly <= canopyBase + 2; ly++) {
            const radius = (ly === canopyBase + 2) ? 1 : 2;
            for (let lx = x - radius; lx <= x + radius; lx++) {
                if (lx < x0 || lx >= x0 + CHUNK_SIZE) continue;
                if (ly < y0 || ly >= y0 + CHUNK_SIZE) continue;
                const cur = data[(ly - y0) * CHUNK_SIZE + (lx - x0)];
                if (cur === 0) data[(ly - y0) * CHUNK_SIZE + (lx - x0)] = 7;
            }
        }
    }

    // --- Apply player edits on top ---
    for (const edit of blockEdits.values()) {
        if (edit.x < x0 || edit.x >= x0 + CHUNK_SIZE) continue;
        if (edit.y < y0 || edit.y >= y0 + CHUNK_SIZE) continue;
        data[(edit.y - y0) * CHUNK_SIZE + (edit.x - x0)] = edit.id;
    }
}

// ---- Chunk loading around the player ----

function ensureChunksAround(xf, yf) {
    const pcx = Math.floor(xf / CHUNK_SIZE);
    const pcy = Math.floor(yf / CHUNK_SIZE);
    let generated = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const cx = pcx + dx;
            const cy = pcy + dy;
            if (cx < 0 || cy < 0) continue;
            if (cx * CHUNK_SIZE >= WORLD_WIDTH) continue;
            if (cy * CHUNK_SIZE >= WORLD_HEIGHT) continue;
            if (chunks.has(chunkKey(cx, cy))) continue;
            ensureChunk(cx, cy);
            generated++;
            if (generated >= 1) return;   // one per tick, no stutter
        }
    }
}

function findSurfaceY(x) {
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
        if (getBlock(x, y) !== 0) return y;
    }
    return GROUND_LEVEL;
}

// ---- World reset ----

function generateWorld(mode = 'normal', seed) {
    if (typeof seed !== 'number') {
        seed = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    serverSeed = seed >>> 0;
    seedPerlin(serverSeed);

    chunks.clear();
    blockEdits.clear();

    playerXf = 10.5;
    let surf = findSurfaceY(Math.floor(playerXf));
    playerYf = surf + 1;
    prevPlayerXf = playerXf;
    prevPlayerYf = playerYf;
    velocityX = 0;
    velocityY = 0;
    onGround = true;
    peakYf = playerYf;
    fallDistance = 0;

    hotbar = new Array(10).fill(null);
    invSlots = new Array(INV_SIZE).fill(null);
    armorSlots = [null, null, null, null];
    craftGrid = new Array(CRAFT_GRID_SIZE * CRAFT_GRID_SIZE).fill(null);
    inventoryOpen = false;
    heldItem = null;
    selectedIndex = 0;
    selectedBlock = 0;
    foodDrops.length = 0;

    health = MAX_HEALTH;
    dead = false;
    damageFlash = 0;
    lastDamageTick = globalTick;
    respawnTimer = 0;

    mouseDownL = false;
    miningTargetX = -1;
    miningTargetY = -1;
    miningProgress = 0;
    attackCooldown = 0;

    furnaces.clear();
    openFurnace = null;

    mobs.length = 0;

    // Force chunks around spawn to generate now so we don't spawn in the void.
    const pcx = Math.floor(playerXf / CHUNK_SIZE);
    const pcy = Math.floor(playerYf / CHUNK_SIZE);
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const cx = pcx + dx;
            const cy = pcy + dy;
            if (cx < 0 || cy < 0) continue;
            if (cx * CHUNK_SIZE >= WORLD_WIDTH) continue;
            if (cy * CHUNK_SIZE >= WORLD_HEIGHT) continue;
            ensureChunk(cx, cy);
        }
    }

    // Now that spawn chunks exist, find the real surface and put the player there.
    surf = findSurfaceY(Math.floor(playerXf));
    playerYf = surf + 1;
    prevPlayerYf = playerYf;
    peakYf = playerYf;

    spawnInitialMobs();
}