function trySpawnMob() {
    for (let attempt = 0; attempt < 30; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 40;
        const xf = Math.floor(playerXf + Math.cos(angle) * dist) + 0.5;
        if (xf < 2 || xf >= WORLD_WIDTH - 2) continue;
        const x = Math.floor(xf);
        const surfY = findSurfaceY(x);
        if (surfY < 2 || surfY >= WORLD_HEIGHT - 3) continue;
        if (getBlock(x, surfY) !== 1) continue;
        if (getBlock(x, surfY + 1) !== 0 || getBlock(x, surfY + 2) !== 0) continue;

        const roll = Math.random();
        const type = roll < 0.34 ? 'cow' : (roll < 0.67 ? 'pig' : 'sheep');

        mobs.push({
            xf: xf,
            yf: surfY + 1,
            vx: 0,
            vy: 0,
            health: MOB_HEALTH,
            maxHealth: MOB_HEALTH,
            dir: Math.random() < 0.5 ? -1 : 1,
            wanderTimer: 30 + Math.floor(Math.random() * 60),
            walkTimer: 0,
            onGround: true,
            hitFlash: 0,
            type: type
        });
        return true;
    }
    return false;
}

function updateMobs() {
    if (globalTick % 90 === 0 && mobs.length < MAX_MOBS) {
        trySpawnMob();
    }

    for (let i = mobs.length - 1; i >= 0; i--) {
        const m = mobs[i];

        if (Math.abs(m.xf - playerXf) > 200) {
            mobs.splice(i, 1);
            continue;
        }

        if (m.hitFlash > 0) m.hitFlash--;

        // --- Rising out of solids (elevator) ---
        if (boxOverlap(m.xf, m.yf, 0.4, 0.85)) {
            m.yf += 0.12;
            m.vy = 0;
            m.onGround = false;
            continue;
        }

        m.wanderTimer--;
        if (m.wanderTimer <= 0) {
            if (Math.random() < 0.6) {
                m.dir = Math.random() < 0.5 ? -1 : 1;
                m.walkTimer = 25 + Math.floor(Math.random() * 40);
            } else {
                m.walkTimer = 0;
            }
            m.wanderTimer = 30 + Math.floor(Math.random() * 40);
        }

        let walkVx = 0;
        if (m.walkTimer > 0) {
            m.walkTimer--;
            walkVx = m.dir * MOB_WANDER_SPEED;
        }

        m.vx *= 0.85;
        if (Math.abs(m.vx) < 0.005) m.vx = 0;

        const totalVx = walkVx + m.vx;

        m.vy -= GRAVITY;
        if (m.vy < -2) m.vy = -2;

        const newYf = m.yf + m.vy;
        if (!boxOverlap(m.xf, newYf, 0.4, 0.85)) {
            m.yf = newYf;
            m.onGround = false;
        } else {
            if (m.vy < 0) m.yf = Math.floor(m.yf + 0.0001);
            m.vy = 0;
            m.onGround = true;
        }

        if (totalVx !== 0) {
            const newXf = m.xf + totalVx;
            if (!boxOverlap(newXf, m.yf, 0.4, 0.85)) {
                m.xf = newXf;
            } else {
                m.dir = -m.dir;
                m.walkTimer = 20 + Math.floor(Math.random() * 30);
                m.vx = 0;
            }
        }

        if (m.xf < 1) m.xf = 1;
        if (m.xf > WORLD_WIDTH - 1) m.xf = WORLD_WIDTH - 1;
        if (m.yf < 0) m.yf = 0;
    }
}

function spawnFoodDrop(xf, yf, id, count = 1) {
    if (connected && ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'dropSpawn', xf, yf, id, count }));
    } else {
        foodDrops.push({
            netId: 'L' + (nextLocalDropId++),
            xf, yf,
            vx: (Math.random() - 0.5) * 0.12,
            vy: 0.25,
            id, count,
            spawnTick: globalTick
        });
    }
}

function updateFoodDrops() {
    for (let i = foodDrops.length - 1; i >= 0; i--) {
        const f = foodDrops[i];

        // Backward-compat for drops that were created without a spawnTick
        if (typeof f.spawnTick !== 'number') f.spawnTick = globalTick;

        // Elevator out of solids
        if (boxOverlap(f.xf, f.yf, 0.25, 0.5)) {
            f.yf += 0.12;
            f.vy = 0;
            continue;
        }

        // Horizontal drift
        if (f.vx && Math.abs(f.vx) > 0.001) {
            const newXf = f.xf + f.vx;
            if (!boxOverlap(newXf, f.yf, 0.25, 0.5)) f.xf = newXf;
            f.vx *= 0.9;
        }

        // Gravity
        f.vy -= GRAVITY * 0.8;
        if (f.vy < -1.5) f.vy = -1.5;

        const newYf = f.yf + f.vy;
        if (!boxOverlap(f.xf, newYf, 0.25, 0.5)) {
            f.yf = newYf;
        } else {
            if (f.vy < 0) f.yf = Math.floor(f.yf + 0.0001);
            f.vy = 0;
        }

        // Don't pick up while dead — the corpse is standing on its own drops.
        if (dead) continue;

        // Don't pick up for ~half a second after spawning
        if (globalTick - f.spawnTick < 15) continue;

        const dx = Math.abs(f.xf - playerXf);
        const dy = Math.abs(f.yf - playerYf);
        if (dx < FOOD_PICKUP_RANGE && dy < FOOD_PICKUP_RANGE) {
            if (connected && typeof f.netId === 'number' && ws && ws.readyState === 1) {
                ws.send(JSON.stringify({ type: 'dropPickup', netId: f.netId }));
                foodDrops.splice(i, 1);
            } else {
                addItem(f.id, f.count);
                foodDrops.splice(i, 1);
            }
        }
    }
}

function tryAttackMobAt(mx, my) {
    // mx, my are canvas coords. Find topmost mob under cursor in range.
    for (let i = mobs.length - 1; i >= 0; i--) {
        const m = mobs[i];
        if (Math.abs(m.xf - playerXf) > PLAYER_ATTACK_RANGE) continue;

        const feetY = (WORLD_HEIGHT - m.yf - renderCamY) * BLOCK_SIZE;
        const sx = (m.xf - 0.5 - renderCamX) * BLOCK_SIZE;
        const sy = feetY - 0.85 * BLOCK_SIZE;
        const sw = 1.0 * BLOCK_SIZE;
        const sh = 0.85 * BLOCK_SIZE;

        if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) {
            m.health -= currentAttackDamage();
            m.hitFlash = 6;
            m.vx = (m.xf > playerXf ? 1 : -1) * MOB_KNOCKBACK;
            m.walkTimer = 30;
            if (m.health <= 0) {
                spawnFoodDrop(m.xf, m.yf + 0.3, FOOD);
                mobs.splice(i, 1);
            }
            return true;
        }
    }
    return false;
}

function spawnInitialMobs() {
    mobs.length = 0;
    for (let i = 0; i < 5; i++) trySpawnMob();
}