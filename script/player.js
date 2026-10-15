let risingOut = false;

function boxOverlap(xf, yf, halfW, height) {
    const lc = Math.floor(xf - halfW + 0.0001);
    const rc = Math.floor(xf + halfW - 0.0001);
    const br = Math.floor(yf + 0.0001);
    const tr = Math.floor(yf + height - 0.0001);
    for (let y = br; y <= tr; y++) {
        if (y < 0) return true;
        if (y >= WORLD_HEIGHT) continue;
        for (let c = lc; c <= rc; c++) {
            if (c < 0 || c >= WORLD_WIDTH) return true;
            if (getBlock(c, y) !== 0) return true;
        }
    }
    return false;
}

function overlapCount(xf, yf) {
    let count = 0;
    const lc = Math.floor(xf - PLAYER_COLLIDE_HALF_W + 0.0001);
    const rc = Math.floor(xf + PLAYER_COLLIDE_HALF_W - 0.0001);
    const br = Math.floor(yf + 0.0001);
    const tr = Math.floor(yf + PLAYER_COLLIDE_H - 0.0001);
    for (let y = br; y <= tr; y++) {
        if (y < 0 || y >= WORLD_HEIGHT) continue;
        for (let c = lc; c <= rc; c++) {
            if (c < 0 || c >= WORLD_WIDTH) continue;
            if (getBlock(c, y) !== 0) count++;
        }
    }
    return count;
}

const RISE_SPEED = 0.15;

function moveHorizontal(dx) {
    if (dx === 0) return;
    const STEPS = 40;
    const stepX = dx / STEPS;
    for (let i = 0; i < STEPS; i++) {
        const nextXf = playerXf + stepX;
        const cur = overlapCount(playerXf, playerYf);
        const nxt = overlapCount(nextXf, playerYf);
        if (nxt > cur) { velocityX = 0; return; }
        playerXf = nextXf;
    }
}

function moveVertical(dy) {
    if (dy === 0) return;
    const STEPS = 40;
    const stepY = dy / STEPS;
    const phasing = risingOut && dy > 0;
    for (let i = 0; i < STEPS; i++) {
        const nextYf = playerYf + stepY;
        if (!phasing) {
            const cur = overlapCount(playerXf, playerYf);
            const nxt = overlapCount(playerXf, nextYf);
            if (nxt > cur) {
                velocityY = 0;
                if (dy < 0) playerYf = Math.floor(playerYf + 0.0001);
                return;
            }
        }
        playerYf = nextYf;
    }
}

function getArmorReduction() {
    let total = 0;
    for (let i = 0; i < 4; i++) {
        const slot = armorSlots[i];
        if (!slot) continue;
        const mat = armorMaterial(slot.id);
        if (!mat) continue;
        const piece = armorPiece(slot.id);
        total += ARMOR_DEFENSE[mat][piece];
    }
    return Math.min(ARMOR_REDUCTION_CAP, total / ARMOR_REDUCTION_DIVISOR);
}

function damagePlayer(amount) {
    if (dead || amount <= 0) return;
    if (gameMode === 'creative') return;
    const reduction = getArmorReduction();
    const effective = amount * (1 - reduction);
    const rounded = Math.max(1, Math.round(effective));
    health = Math.max(0, health - rounded);
    lastDamageTick = globalTick;
    damageFlash = 15;
    if (health <= 0) die();
}

function currentAttackDamage() {
    if (isSword(selectedBlock)) return SWORD_DAMAGE[selectedBlock] || 1;
    return PLAYER_ATTACK_DAMAGE;
}

function die() {
    dead = true;
    health = 0;
    respawnTimer = RESPAWN_DELAY_FRAMES;
    velocityX = 0;
    velocityY = 0;

    // Drop everything: hotbar, inventory, and armor.
    for (const arr of [hotbar, invSlots]) {
        for (const slot of arr) {
            if (!slot) continue;
            const jx = (Math.random() - 0.5) * 1.5;
            spawnFoodDrop(playerXf + jx, playerYf + 0.5, slot.id, slot.count);
        }
    }
    for (const slot of armorSlots) {
        if (!slot) continue;
        const jx = (Math.random() - 0.5) * 1.5;
        spawnFoodDrop(playerXf + jx, playerYf + 0.5, slot.id, 1);
    }

    // Clear everything (KeepInventory is off for armor).
    hotbar = new Array(10).fill(null);
    invSlots = new Array(INV_SIZE).fill(null);
    armorSlots = [null, null, null, null];
    craftGrid = new Array(CRAFT_GRID_SIZE * CRAFT_GRID_SIZE).fill(null);
    heldItem = null;
    inventoryOpen = false;
    updateSelected();
}

function respawn() {
    dead = false;
    health = MAX_HEALTH;
    damageFlash = 0;
    velocityX = 0;
    velocityY = 0;

    const SPAWN_X = 10.5;
    const RADIUS = 5;
    let xf = SPAWN_X + (Math.random() * 2 - 1) * RADIUS;
    xf = Math.max(PLAYER_HALF_W, Math.min(WORLD_WIDTH - PLAYER_HALF_W, xf));
    playerXf = xf;

    let surf = findSurfaceY(Math.floor(playerXf));
    let yf = surf + 1;

    // If the surface has a solid block right at the player's spawn (tree trunk,
    // overhang, etc.), keep going up until we find clear air. Cap the search.
    let safety = 0;
    while (safety < 40 && overlapCount(playerXf, yf) > 0) {
        yf += 1;
        safety++;
    }

    playerYf = yf;
    prevPlayerXf = playerXf;
    prevPlayerYf = playerYf;
    onGround = true;
    peakYf = playerYf;
    fallDistance = 0;
    lastDamageTick = globalTick;
}

function applyFallDamage() {
    if (gameMode === 'creative') return;
    const dist = peakYf - playerYf;
    if (dist <= FALL_DAMAGE_THRESHOLD) return;
    const dmg = Math.floor(dist - FALL_DAMAGE_THRESHOLD);
    if (dmg > 0) damagePlayer(dmg);
}

function updateRegen() {
    if (dead) return;
    if (health <= 0 || health >= MAX_HEALTH) return;
    if (globalTick - lastDamageTick < REGEN_DELAY) return;
    if ((globalTick - lastDamageTick) % REGEN_INTERVAL !== 0) return;
    health = Math.min(MAX_HEALTH, health + 1);
}

function updatePlayer() {
    prevPlayerXf = playerXf;
    prevPlayerYf = playerYf;

    globalTick++;

    if (damageFlash > 0) damageFlash--;

    if (dead) {
        respawnTimer--;
        if (respawnTimer <= 0) respawn();
        updateViewOffset();
        return;
    }

    const wasOnGround = onGround;

    cloudDrift += 0.3;

    let inputDir = 0;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) inputDir -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) inputDir += 1;
    velocityX = inputDir * MAX_SPEED * speedMultiplier;

    if (velocityX !== 0) moveHorizontal(velocityX);

    playerXf = Math.max(PLAYER_HALF_W, Math.min(WORLD_WIDTH - PLAYER_HALF_W, playerXf));

    if (jumpCooldown > 0) jumpCooldown--;
    if ((keys['w'] || keys['W'] || keys['ArrowUp'] || keys[' ']) &&
        onGround && jumpCooldown === 0) {
        velocityY = JUMP_FORCE * Math.min(speedMultiplier, 2.5);
        onGround = false;
        jumpCooldown = JUMP_COOLDOWN_FRAMES;
    }

    velocityY -= GRAVITY;
    if (velocityY < -2) velocityY = -2;
    onGround = false;

    if (overlapCount(playerXf, playerYf) > 0) risingOut = true;
    if (risingOut) {
        velocityY = RISE_SPEED;
        onGround = false;
    }

    if (velocityY !== 0) moveVertical(velocityY);

    if (risingOut && overlapCount(playerXf, playerYf) === 0) risingOut = false;

    if (!onGround && !risingOut && playerYf > 0) {
        const testY = playerYf - 0.01;
        const lc = Math.floor(playerXf - PLAYER_COLLIDE_HALF_W + 0.0001);
        const rc = Math.floor(playerXf + PLAYER_COLLIDE_HALF_W - 0.0001);
        const row = Math.floor(testY + 0.0001);
        for (let c = lc; c <= rc; c++) {
            if (c >= 0 && c < WORLD_WIDTH && row >= 0 && row < WORLD_HEIGHT) {
                if (getBlock(c, row) !== 0) { onGround = true; break; }
            }
        }
    }

    if (playerYf < 0) { playerYf = 0; velocityY = 0; onGround = true; }

    if (onGround) {
        if (!wasOnGround) applyFallDamage();
        peakYf = playerYf;
    } else {
        if (playerYf > peakYf) peakYf = playerYf;
    }

    updateRegen();

    updateViewOffset();
    if (connected) {
        netSendPosition();
    }
}