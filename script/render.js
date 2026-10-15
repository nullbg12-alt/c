function computeCamera(pxf, pyf) {
    let camX = pxf - VIEW_WIDTH / 2;
    camX = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, camX));

    const playerCenterRow = WORLD_HEIGHT - pyf - 0.5;
    let camY = playerCenterRow - VIEW_HEIGHT / 2;

    const maxCamY = WORLD_HEIGHT - viewH / BLOCK_SIZE;
    camY = Math.min(maxCamY, camY);

    return { camX, camY };
}

function updateViewOffset() {
    const c = computeCamera(playerXf, playerYf);
    viewOffsetX = c.camX;
    viewOffsetY = c.camY;
}

function rebuildSkyGradient() {
    skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
    skyGrad.addColorStop(0, '#4a90d9');
    skyGrad.addColorStop(0.6, '#87CEEB');
    skyGrad.addColorStop(1, '#b8e0f0');
}

function drawSky(camX) {
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#fff7b0';
    ctx.beginPath();
    ctx.arc(viewW - 160, 110, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(viewW - 160, 110, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    const cloudCount = 12;
    const spacing = 480;
    const patternWidth = cloudCount * spacing;
    const parallax = camX * BLOCK_SIZE * 0.35;

    for (let i = 0; i < cloudCount; i++) {
        const worldX = i * spacing + cloudDrift;
        let sx = worldX - parallax;
        sx = ((sx % patternWidth) + patternWidth) % patternWidth;
        sx -= spacing;
        if (sx > viewW + 300 || sx < -400) continue;

        const cy = 50 + ((i * 137) % 3) * 75;
        const s = 1.1 + ((i * 53) % 4) * 0.22;

        ctx.beginPath();
        ctx.ellipse(sx, cy, 85 * s, 30 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(sx + 60 * s, cy + 8, 60 * s, 24 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(sx - 60 * s, cy + 8, 55 * s, 22 * s, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function darkenHex(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const f = 1 - amount;
    const c = (v) => Math.max(0, Math.min(255, Math.floor(v * f))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
}

function drawItemIcon(id, x, y, size) {
    const variants = tileCache[id];
    if (variants && variants[0]) {
        ctx.drawImage(variants[0], x, y, size, size);
        return;
    }

    ctx.fillStyle = itemColor(id) || '#FF00FF';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    const label = (itemShort(id) || '?').slice(0, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold ' + Math.max(9, Math.floor(size * 0.3)) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + size / 2, y + size / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function drawSlotContents(slot, bx, by, slotSize) {
    if (!slot) return;

    drawItemIcon(slot.id, bx, by, slotSize);

    const text = String(slot.count);
    ctx.font = 'bold ' + Math.max(11, Math.floor(slotSize * 0.32)) + 'px Arial';
    const textW = ctx.measureText(text).width;
    const badgeW = Math.max(slotSize * 0.42, textW + 8);
    const badgeH = Math.max(14, Math.floor(slotSize * 0.36));
    const bxR = bx + slotSize - badgeW;
    const byR = by + slotSize - badgeH;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(bxR, byR, badgeW, badgeH);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bxR + badgeW / 2, byR + badgeH / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function drawArmorOverlay(px, py, pw, ph, armorSet) {
    if (!armorSet) return;

    const bodyTop = py;
    const bodyH = ph;

    const pieces = [
        { slice: [0.00, 0.28], piece: 0 },   // helmet — top 28%
        { slice: [0.28, 0.62], piece: 1 },   // chestplate
        { slice: [0.62, 0.86], piece: 2 },   // leggings
        { slice: [0.86, 1.00], piece: 3 }    // boots
    ];

    for (const { slice, piece } of pieces) {
        const slot = armorSet[piece];
        if (!slot) continue;
        const mat = armorMaterial(slot.id);
        if (!mat) continue;

        const y0 = bodyTop + bodyH * slice[0];
        const h  = bodyH * (slice[1] - slice[0]);

        ctx.fillStyle = ARMOR_MATERIAL_COLOR[mat];
        ctx.fillRect(px, y0, pw, h);

        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, y0 + 0.5, pw - 1, h - 1);
    }
}

function drawLocalNameTag(px, py, pw) {
    const label = myName || 'You';
    const padding = 6;
    const swatchSize = 12;

    ctx.font = 'bold 14px Arial';
    const textW = ctx.measureText(label).width;
    const boxW = padding + swatchSize + 6 + textW + padding;
    const boxH = 22;

    const cx = px + pw / 2;
    const bx = cx - boxW / 2;
    const by = py - boxH - 8;

    // Background box
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);

    // Color swatch on the left
    const swX = bx + padding;
    const swY = by + (boxH - swatchSize) / 2;
    ctx.fillStyle = myColor;
    ctx.fillRect(swX, swY, swatchSize, swatchSize);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeRect(swX + 0.5, swY + 0.5, swatchSize - 1, swatchSize - 1);

    // Name text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, swX + swatchSize + 6, by + boxH / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function draw() {
    const alpha = Math.min(1, accumulator / LOGIC_STEP);
    const drawXf = prevPlayerXf + (playerXf - prevPlayerXf) * alpha;
    const drawYf = prevPlayerYf + (playerYf - prevPlayerYf) * alpha;
    const cam = computeCamera(drawXf, drawYf);
    const camX = cam.camX;
    const camY = cam.camY;
    renderCamX = camX;
    renderCamY = camY;

    drawSky(camX);

    const camXi = Math.floor(camX);
    const camYi = Math.floor(camY);

    for (let i = -1; i < VIEW_HEIGHT + 1; i++) {
        const sr = camYi + i;
        const y = (WORLD_HEIGHT - 1) - sr;
        if (y < 0 || y >= WORLD_HEIGHT) continue;
        const sy = (sr - camY) * BLOCK_SIZE;

        for (let j = -1; j < VIEW_WIDTH + 1; j++) {
            const x = camXi + j;
            if (x < 0 || x >= WORLD_WIDTH) continue;
            const block = getBlock(x, y);
            if (block === 0 || block === undefined) continue;

            const variants = tileCache[block];
            if (!variants) continue;

            const v = (blockHash(x, y, block) * variants.length) | 0;
            const sx = (x - camX) * BLOCK_SIZE;
            ctx.drawImage(variants[v], sx, sy);
        }
    }

    // Dropped items
    for (const f of foodDrops) {
        const sz = 0.6 * BLOCK_SIZE;
        const sx = (f.xf - 0.3 - camX) * BLOCK_SIZE;
        const sy = (WORLD_HEIGHT - f.yf - camY) * BLOCK_SIZE - sz;
        const bob = Math.sin(globalTick * 0.15 + f.xf * 2) * 2;

        drawItemIcon(f.id, sx, sy + bob, sz);

        if (f.count > 1) {
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.fillText(String(f.count), sx + sz / 2 + 1, sy + bob + sz - 5 + 1);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(String(f.count), sx + sz / 2, sy + bob + sz - 5);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
    }

    // Mobs
    for (const m of mobs) {
        const feetY = (WORLD_HEIGHT - m.yf - camY) * BLOCK_SIZE;
        const sx = (m.xf - 0.5 - camX) * BLOCK_SIZE;
        const sy = feetY - 0.85 * BLOCK_SIZE;
        const sw = 1.0 * BLOCK_SIZE;
        const sh = 0.85 * BLOCK_SIZE;

        if (sx + sw < 0 || sx > viewW || sy + sh < 0 || sy > viewH) continue;

        let bodyColor, headColor;
        if (m.type === 'cow') { bodyColor = '#5a3a1a'; headColor = '#FFFFFF'; }
        else if (m.type === 'pig') { bodyColor = '#e898a0'; headColor = '#d08090'; }
        else { bodyColor = '#e8e8e0'; headColor = '#c8c8c0'; }

        ctx.fillStyle = bodyColor;
        ctx.fillRect(sx, sy, sw, sh);
        ctx.fillStyle = headColor;
        ctx.fillRect(sx + 0.15 * sw, sy + 0.1 * sh, 0.7 * sw, 0.35 * sh);
        ctx.fillStyle = '#000';
        ctx.fillRect(sx + 0.28 * sw, sy + 0.2 * sh, 0.08 * sw, 0.08 * sh);
        ctx.fillRect(sx + 0.64 * sw, sy + 0.2 * sh, 0.08 * sw, 0.08 * sh);

        if (m.hitFlash > 0) {
            ctx.fillStyle = 'rgba(255,60,60,' + (m.hitFlash / 6) * 0.55 + ')';
            ctx.fillRect(sx, sy, sw, sh);
        }

        if (m.health < m.maxHealth) {
            const barW = sw * 0.9;
            const barH = 4;
            const barX = sx + (sw - barW) / 2;
            const barY = sy - 8;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#e63946';
            ctx.fillRect(barX, barY, barW * (m.health / m.maxHealth), barH);
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
    }

    drawRemotePlayers(camX, camY);

    // Local player
    const feetCanvasY = (WORLD_HEIGHT - drawYf - camY) * BLOCK_SIZE;
    const px = (drawXf - PLAYER_HALF_W - camX) * BLOCK_SIZE;
    const py = feetCanvasY - PLAYER_H * BLOCK_SIZE;
    const pw = PLAYER_HALF_W * 2 * BLOCK_SIZE;
    const ph = PLAYER_H * BLOCK_SIZE;

    if (!dead && px + pw >= 0 && px < viewW && py + ph >= 0 && py < viewH) {
        const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
        grad.addColorStop(0, myColor);
        grad.addColorStop(1, darkenHex(myColor, 0.35));
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, pw, ph);
        drawArmorOverlay(px, py, pw, ph, armorSlots);

        const eyeY = py + ph * 0.34;
        const eye1X = px + pw * 0.31;
        const eye2X = px + pw * 0.69;
        const eyeW = pw * 0.22;
        const eyeH = ph * 0.18;

        let pupilOffX = 0, pupilOffY = 0;
        if (mouseX >= 0 && mouseY >= 0) {
            const dx = mouseX - eye1X;
            const dy = mouseY - eyeY;
            const len = Math.hypot(dx, dy) || 1;
            pupilOffX = (dx / len) * (pw * 0.035);
            pupilOffY = (dy / len) * (ph * 0.04);
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(eye1X - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH);
        ctx.fillRect(eye2X - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH);

        const pupilSize = pw * 0.11;
        ctx.fillStyle = '#000000';
        ctx.fillRect(eye1X - pupilSize / 2 + pupilOffX, eyeY - pupilSize / 2 + pupilOffY, pupilSize, pupilSize);
        ctx.fillRect(eye2X - pupilSize / 2 + pupilOffX, eyeY - pupilSize / 2 + pupilOffY, pupilSize, pupilSize);

        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
    }

    if (!dead && px + pw >= 0 && px < viewW && py + ph >= 0 && py < viewH) {
        drawLocalNameTag(px, py, pw);
    }

    // Mining crack overlay
    if (miningProgress > 0.01 && miningTargetX >= 0) {
        const sx = (miningTargetX - camX) * BLOCK_SIZE;
        const srT = WORLD_HEIGHT - 1 - miningTargetY;
        const sy = (srT - camY) * BLOCK_SIZE;

        ctx.fillStyle = 'rgba(0,0,0,' + (miningProgress * 0.35) + ')';
        ctx.fillRect(sx, sy, BLOCK_SIZE, BLOCK_SIZE);

        const stage = Math.max(1, Math.floor(miningProgress * 8));
        ctx.strokeStyle = 'rgba(0,0,0,' + (0.35 + miningProgress * 0.55) + ')';
        ctx.lineWidth = 2;
        for (let i = 0; i < stage; i++) {
            const a1 = blockHash(miningTargetX, miningTargetY, i * 3);
            const a2 = blockHash(miningTargetY, miningTargetX, i * 5 + 11);
            const a3 = blockHash(miningTargetX + i, miningTargetY - i, i * 7 + 23);
            const a4 = blockHash(miningTargetY + i, miningTargetX - i, i * 9 + 37);
            ctx.beginPath();
            ctx.moveTo(sx + a1 * BLOCK_SIZE, sy + a2 * BLOCK_SIZE);
            ctx.lineTo(sx + a3 * BLOCK_SIZE, sy + a4 * BLOCK_SIZE);
            ctx.stroke();
        }
    }

    // Hover highlight
    if (mouseX >= 0 && mouseY >= 0 && mouseX < viewW && mouseY < viewH && !inventoryOpen && !openFurnace) {
        let hoveredMob = false;
        for (const m of mobs) {
            if (Math.abs(m.xf - playerXf) > PLAYER_ATTACK_RANGE) continue;
            const feetY = (WORLD_HEIGHT - m.yf - camY) * BLOCK_SIZE;
            const sx = (m.xf - 0.5 - camX) * BLOCK_SIZE;
            const sy = feetY - 0.85 * BLOCK_SIZE;
            if (mouseX >= sx && mouseX <= sx + BLOCK_SIZE && mouseY >= sy && mouseY <= sy + 0.85 * BLOCK_SIZE) {
                hoveredMob = true; break;
            }
        }
        if (!hoveredMob) {
            const hs = Math.floor(mouseY / BLOCK_SIZE + camY);
            const hx = Math.floor(mouseX / BLOCK_SIZE + camX);
            const hy = (WORLD_HEIGHT - 1) - hs;
            if (hx >= 0 && hx < WORLD_WIDTH && hy >= 0 && hy < WORLD_HEIGHT) {
                const sx = (hx - camX) * BLOCK_SIZE;
                const sy = (hs - camY) * BLOCK_SIZE;
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(sx + 1, sy + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            }
        }
    }

    // HUD
    if (debugOpen) drawDebugHUD();

    drawHotbar();
    drawHealth();
    drawDamageFlash();
    drawDeathOverlay();
    drawInventory();
    drawFurnace();
    drawHeldItem();
    drawChatLog();
}

function getHotbarLayout() {
    const n = HOTBAR_SIZE;
    const padding = 4;
    const labelHeight = 12;
    const maxWidth = viewW - 80;
    let slot = Math.floor((maxWidth - (n - 1) * padding) / n);
    slot = Math.min(slot, 46);
    slot = Math.max(slot, 22);
    const totalWidth = n * slot + (n - 1) * padding;
    const startX = (viewW - totalWidth) / 2;
    const y = viewH - slot - 14 - labelHeight;
    return { n, padding, labelHeight, slot, startX, y, totalWidth };
}

function drawHotbar() {
    const L = getHotbarLayout();
    const { n, padding, labelHeight, slot, startX, y } = L;

    for (let i = 0; i < n; i++) {
        const bx = startX + i * (slot + padding);
        const slotData = hotbar[i];
        const isSelected = (i === selectedIndex);

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(bx - 2, y - 2, slot + 4, slot + 4);

        if (slotData) {
            drawSlotContents(slotData, bx, y, slot);

            const label = itemShort(slotData.id);
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            const labelFontSize = Math.max(9, Math.min(11, Math.floor(slot * 0.28)));
            ctx.font = 'bold ' + labelFontSize + 'px Arial';
            const labelW = ctx.measureText(label).width;
            ctx.fillRect(bx + slot / 2 - labelW / 2 - 3, y + slot + 2, labelW + 6, labelHeight - 2);
            ctx.fillStyle = isSelected ? '#FFFF66' : '#DDDDDD';
            ctx.textAlign = 'center';
            ctx.fillText(label, bx + slot / 2, y + slot + labelHeight - 3);
            ctx.textAlign = 'left';
        }

        ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(bx + 0.5, y + 0.5, slot - 1, slot - 1);
    }
}

function drawRemotePlayers(camX, camY) {
    for (const [id, rp] of remotePlayers) {
        const feetY = (WORLD_HEIGHT - rp.yf - camY) * BLOCK_SIZE;
        const px = (rp.xf - PLAYER_HALF_W - camX) * BLOCK_SIZE;
        const py = feetY - PLAYER_H * BLOCK_SIZE;
        const pw = PLAYER_HALF_W * 2 * BLOCK_SIZE;
        const ph = PLAYER_H * BLOCK_SIZE;

        if (px + pw < 0 || px > viewW || py + ph < 0 || py > viewH) continue;

        const col = rp.color || '#5c7cff';
        const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
        grad.addColorStop(0, col);
        grad.addColorStop(1, darkenHex(col, 0.35));
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, pw, ph);
        drawArmorOverlay(px, py, pw, ph, rp.armor);

        const eyeY = py + ph * 0.34;
        const eye1X = px + pw * 0.31;
        const eye2X = px + pw * 0.69;
        const eyeW = pw * 0.22;
        const eyeH = ph * 0.18;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(eye1X - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH);
        ctx.fillRect(eye2X - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH);

        const pupilSize = pw * 0.11;
        ctx.fillStyle = '#000000';
        ctx.fillRect(eye1X - pupilSize / 2, eyeY - pupilSize / 2, pupilSize, pupilSize);
        ctx.fillRect(eye2X - pupilSize / 2, eyeY - pupilSize / 2, pupilSize, pupilSize);

        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);

        const label = rp.name;
        const padding = 6;
        const swatchSize = 12;
        ctx.font = 'bold 14px Arial';
        const textW = ctx.measureText(label).width;
        const boxW = padding + swatchSize + 6 + textW + padding;
        const boxH = 20;

        const cx = px + pw / 2;
        const bx = cx - boxW / 2;
        const by = py - boxH - 6;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx, by, boxW, boxH);

        const swX = bx + padding;
        const swY = by + (boxH - swatchSize) / 2;
        ctx.fillStyle = rp.color || '#5c7cff';
        ctx.fillRect(swX, swY, swatchSize, swatchSize);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeRect(swX + 0.5, swY + 0.5, swatchSize - 1, swatchSize - 1);

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, swX + swatchSize + 6, by + boxH / 2 + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        if (rp.chatBubble && globalTick - rp.chatBubbleTick < 120) {
            drawChatBubble(px, py, pw, rp.chatBubble);
        }

    }
}

function drawHeart(x, y, size, hp) {
    const w = size, h = size;
    const cx = x + w / 2;

    function heartPath() {
        ctx.beginPath();
        ctx.moveTo(cx, y + h * 0.9);
        ctx.bezierCurveTo(x - w * 0.05, y + h * 0.55, x + w * 0.05, y + h * 0.05, cx, y + h * 0.3);
        ctx.bezierCurveTo(x + w * 0.95, y + h * 0.05, x + w * 1.05, y + h * 0.55, cx, y + h * 0.9);
        ctx.closePath();
    }

    heartPath();
    ctx.fillStyle = 'rgba(20,20,20,0.8)';
    ctx.fill();

    if (hp > 0) {
        ctx.save();
        heartPath();
        ctx.clip();
        ctx.fillStyle = '#e63946';
        ctx.fillRect(x, y, (hp === 1 ? w / 2 : w), h);
        ctx.restore();
    }

    heartPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawHealth() {
    const heartSize = 18;
    const gap = 2;
    const heartsPerRow = 10;
    const totalWidth = heartsPerRow * heartSize + (heartsPerRow - 1) * gap;

    const L = getHotbarLayout();
    const startX = viewW / 2 - 20 - totalWidth;
    const startY = L.y - heartSize - 8;

    for (let i = 0; i < heartsPerRow; i++) {
        const slotHp = Math.max(0, Math.min(2, health - i * 2));
        drawHeart(startX + i * (heartSize + gap), startY, heartSize, slotHp);
    }
}

function drawDeathOverlay() {
    if (!dead) return;
    ctx.fillStyle = 'rgba(90, 0, 0, 0.55)';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You Died', viewW / 2, viewH / 2 - 20);

    const secs = Math.ceil(respawnTimer / LOGIC_FPS);
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#FFD8D8';
    ctx.fillText('Respawning in ' + secs + '…', viewW / 2, viewH / 2 + 30);
    ctx.textAlign = 'left';
}

function drawDamageFlash() {
    if (damageFlash <= 0) return;
    const a = (damageFlash / 15) * 0.45;
    const grad = ctx.createRadialGradient(viewW / 2, viewH / 2, viewH * 0.3, viewW / 2, viewH / 2, viewH * 0.8);
    grad.addColorStop(0, 'rgba(255,0,0,0)');
    grad.addColorStop(1, 'rgba(255,0,0,' + a + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewW, viewH);
}

function drawInventory() {
    if (!inventoryOpen) return;

    const L = getInventoryLayout();

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.fillStyle = 'rgba(30,30,35,0.95)';
    ctx.fillRect(L.panelX, L.panelY, L.panelW, L.panelH);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(L.panelX + 0.5, L.panelY + 0.5, L.panelW - 1, L.panelH - 1);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
        ctx.fillText('Crafting', L.craftGridX, L.craftGridY - 8);

    // Armor row
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Armor', L.armorX, L.armorY - 4);

    for (let i = 0; i < 4; i++) {
        const sx = L.armorX + i * (L.slot + L.gap);
        const sy = L.armorY;

        ctx.fillStyle = 'rgba(60,60,70,0.9)';
        ctx.fillRect(sx, sy, L.slot, L.slot);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, L.slot - 1, L.slot - 1);

        drawSlotContents(armorSlots[i], sx, sy, L.slot);

        // Ghost preview when holding a matching armor item
        if (!armorSlots[i] && heldItem && isArmor(heldItem.id) && armorPiece(heldItem.id) === i) {
            ctx.globalAlpha = 0.35;
            drawItemIcon(heldItem.id, sx, sy, L.slot);
            ctx.globalAlpha = 1;
        }
    }

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const sx = L.craftGridX + c * (L.slot + L.gap);
            const sy = L.craftGridY + r * (L.slot + L.gap);

            ctx.fillStyle = 'rgba(60,60,70,0.9)';
            ctx.fillRect(sx, sy, L.slot, L.slot);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 0.5, sy + 0.5, L.slot - 1, L.slot - 1);

            drawSlotContents(craftGrid[r*3 + c], sx, sy, L.slot);
        }
    }

    {
        const ax = L.craftGridX + L.craftW + 5;
        const ay = L.craftGridY + Math.floor((L.craftW - L.slot) / 2) + L.slot / 2;
        ctx.strokeStyle = '#DDDDDD';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + ARROW_W - 14, ay);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + ARROW_W - 14, ay - 8);
        ctx.lineTo(ax + ARROW_W - 4, ay);
        ctx.lineTo(ax + ARROW_W - 14, ay + 8);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(60,60,70,0.9)';
    ctx.fillRect(L.resultX, L.resultY, L.slot, L.slot);
    const recipe = findMatchingRecipe();
    ctx.strokeStyle = recipe ? '#88FF88' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = recipe ? 2 : 1;
    ctx.strokeRect(L.resultX + 0.5, L.resultY + 0.5, L.slot - 1, L.slot - 1);
    if (recipe) {
        drawSlotContents(recipe.result, L.resultX, L.resultY, L.slot);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px Arial';
    ctx.fillText('Inventory', L.invGridX, L.invGridY - 8);

    for (let r = 0; r < INV_ROWS; r++) {
        for (let c = 0; c < INV_COLS; c++) {
            const idx = r * INV_COLS + c;
            const sx = L.invGridX + c * (L.slot + L.gap);
            const sy = L.invGridY + r * (L.slot + L.gap);

            ctx.fillStyle = 'rgba(60,60,70,0.9)';
            ctx.fillRect(sx, sy, L.slot, L.slot);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 0.5, sy + 0.5, L.slot - 1, L.slot - 1);

            drawSlotContents(invSlots[idx], sx, sy, L.slot);
        }
    }

    for (let c = 0; c < 10; c++) {
        const sx = L.hotbarX + c * (L.slot + L.gap);
        const sy = L.hotbarY;

        ctx.fillStyle = 'rgba(60,60,70,0.9)';
        ctx.fillRect(sx, sy, L.slot, L.slot);
        ctx.strokeStyle = (c === selectedIndex) ? '#FFFFFF' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = (c === selectedIndex) ? 2 : 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, L.slot - 1, L.slot - 1);

        drawSlotContents(hotbar[c], sx, sy, L.slot);
    }
}

function drawFurnace() {
    if (!openFurnace) return;
    const f = furnaces.get(openFurnace);
    if (!f) return;

    const L = getFurnaceLayout();

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.fillStyle = 'rgba(30,30,35,0.95)';
    ctx.fillRect(L.panelX, L.panelY, L.panelW, L.panelH);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(L.panelX + 0.5, L.panelY + 0.5, L.panelW - 1, L.panelH - 1);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Furnace', L.panelX + L.pad, L.panelY + L.pad + 16);

    ctx.fillStyle = 'rgba(60,60,70,0.9)';
    ctx.fillRect(L.inputX, L.inputY, L.slot, L.slot);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(L.inputX + 0.5, L.inputY + 0.5, L.slot - 1, L.slot - 1);
    drawSlotContents(f.input, L.inputX, L.inputY, L.slot);

    ctx.fillStyle = 'rgba(60,60,70,0.9)';
    ctx.fillRect(L.fuelX, L.fuelY, L.slot, L.slot);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(L.fuelX + 0.5, L.fuelY + 0.5, L.slot - 1, L.slot - 1);
    drawSlotContents(f.fuel, L.fuelX, L.fuelY, L.slot);

    if (f.fuelBurn > 0) {
        const fy = L.fuelY + L.slot + 3;
        ctx.fillStyle = '#ff7b00';
        ctx.beginPath();
        ctx.moveTo(L.fuelX + L.slot / 2, fy);
        ctx.lineTo(L.fuelX + L.slot / 2 - 6, fy + 10);
        ctx.lineTo(L.fuelX + L.slot / 2 + 6, fy + 10);
        ctx.closePath();
        ctx.fill();
    }

    {
        const ax = L.arrowX;
        const ay = L.arrowY;
        const aw = L.arrowW;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + aw, ay);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + aw, ay - 6);
        ctx.lineTo(ax + aw + 8, ay);
        ctx.lineTo(ax + aw, ay + 6);
        ctx.stroke();

        const p = Math.min(1, f.progress / SMELT_TICKS);
        if (p > 0) {
            ctx.strokeStyle = '#ffb84a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + aw * p, ay);
            ctx.stroke();
        }
    }

    ctx.fillStyle = 'rgba(60,60,70,0.9)';
    ctx.fillRect(L.outputX, L.outputY, L.slot, L.slot);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(L.outputX + 0.5, L.outputY + 0.5, L.slot - 1, L.slot - 1);
    drawSlotContents(f.output, L.outputX, L.outputY, L.slot);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px Arial';
    ctx.fillText('Inventory', L.invGridX, L.invGridY - 8);

    for (let r = 0; r < INV_ROWS; r++) {
        for (let c = 0; c < INV_COLS; c++) {
            const idx = r * INV_COLS + c;
            const sx = L.invGridX + c * (L.slot + L.gap);
            const sy = L.invGridY + r * (L.slot + L.gap);
            ctx.fillStyle = 'rgba(60,60,70,0.9)';
            ctx.fillRect(sx, sy, L.slot, L.slot);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 0.5, sy + 0.5, L.slot - 1, L.slot - 1);
            drawSlotContents(invSlots[idx], sx, sy, L.slot);
        }
    }

    for (let c = 0; c < 10; c++) {
        const sx = L.hotbarX + c * (L.slot + L.gap);
        const sy = L.hotbarY;
        ctx.fillStyle = 'rgba(60,60,70,0.9)';
        ctx.fillRect(sx, sy, L.slot, L.slot);
        ctx.strokeStyle = (c === selectedIndex) ? '#FFFFFF' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = (c === selectedIndex) ? 2 : 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, L.slot - 1, L.slot - 1);
        drawSlotContents(hotbar[c], sx, sy, L.slot);
    }
}

function drawChatLog() {
    const padding = 8;
    const lineHeight = 20;
    const maxLines = 10;
    const cutoff = globalTick - CHAT_TTL;

    const visible = chatMessages.filter(m => m.tick >= cutoff).slice(-maxLines);
    if (visible.length === 0) return;

    const baseY = viewH - 220;
    const startY = baseY - visible.length * lineHeight;

    for (let i = 0; i < visible.length; i++) {
        const m = visible[i];
        const age = globalTick - m.tick;
        const alpha = age > CHAT_TTL - 60 ? Math.max(0, (CHAT_TTL - age) / 60) : 1;

        ctx.globalAlpha = alpha;

        ctx.font = 'bold 14px Arial';
        const textW = ctx.measureText(m.text).width;
        const boxW = Math.min(viewW - 40, textW + padding * 2);
        const x = 20;
        const y = startY + i * lineHeight;

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x, y, boxW, lineHeight - 2);

        ctx.fillStyle = m.color || '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.text, x + padding, y + lineHeight / 2 - 1);
        ctx.textBaseline = 'alphabetic';

        ctx.globalAlpha = 1;
    }
}

function drawChatBubble(px, py, pw, text) {
    ctx.font = 'bold 13px Arial';
    const textW = ctx.measureText(text).width;
    const padX = 8;
    const bw = Math.min(260, textW + padX * 2);
    const bh = 22;
    const bx = px + pw / 2 - bw / 2;
    const by = py - 30;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

    // Little tail
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2 - 5, by + bh);
    ctx.lineTo(bx + bw / 2 + 5, by + bh);
    ctx.lineTo(bx + bw / 2, by + bh + 6);
    ctx.closePath();
    ctx.fill();

    // Text (truncate if too long)
    let label = text;
    if (ctx.measureText(label).width > bw - padX * 2) {
        while (label.length > 3 && ctx.measureText(label + '…').width > bw - padX * 2) {
            label = label.slice(0, -1);
        }
        label = label + '…';
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bw / 2, by + bh / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function drawHeldItem() {
    if ((!inventoryOpen && !openFurnace) || !heldItem) return;
    const size = 44;
    const x = mouseX - size / 2;
    const y = mouseY - size / 2;

    ctx.globalAlpha = 0.9;
    drawItemIcon(heldItem.id, x, y, size);
    ctx.globalAlpha = 1;

    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(String(heldItem.count), x + size - 10, y + size - 10);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function drawDebugHUD() {
    const lines = [
        'BlockyWorld ' + VERSION,
        'FPS: ' + currentFPS,
        'XYZ: ' + playerXf.toFixed(2) + ' / ' + playerYf.toFixed(2),
        'Selected: ' + (selectedBlock ? itemName(selectedBlock) + ' (#' + selectedBlock + ')' : '—'),
        'Health: ' + health + ' / ' + MAX_HEALTH,
        'Food: ' + (typeof foodCount !== 'undefined' ? foodCount : countItem(FOOD)),
        'Seed: ' + serverSeed,
        'Net: ' + (connected ? ('online #' + myNetId) : 'offline'),
        'Mobs: ' + mobs.length,
        'Drops: ' + foodDrops.length,
        'Armor: ' + armorSlots.map(s => s ? itemShort(s.id) : '—').join(' / ')
    ];

    const pad = 10;
    const lineH = 18;
    const boxW = 340;
    const boxH = lines.length * lineH + pad * 2;

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(8, 8, boxW, boxH);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8.5, 8.5, boxW - 1, boxH - 1);

    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
        ctx.fillStyle = i === 0 ? '#7CFF7C' : '#FFFFFF';
        ctx.fillText(lines[i], 8 + pad, 8 + pad + i * lineH);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function resizeCanvas() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    canvas.style.width = viewW + 'px';
    canvas.style.height = viewH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    VIEW_WIDTH = Math.ceil(viewW / BLOCK_SIZE) + 2;
    VIEW_HEIGHT = Math.ceil(viewH / BLOCK_SIZE) + 2;

    rebuildSkyGradient();
    updateViewOffset();
}

function updateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastFPSCheck >= 1000) {
        currentFPS = frameCount;
        frameCount = 0;
        lastFPSCheck = now;
    }
}