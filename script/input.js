function cycleSelection(dir) {
    selectedIndex = (selectedIndex + dir + hotbar.length) % hotbar.length;
    updateSelected();
}

function eatFood() {
    if (dead) return;
    if (health >= MAX_HEALTH) return;

    const sel = hotbar[selectedIndex];
    if (sel && sel.id === FOOD) {
        sel.count -= 1;
        if (sel.count <= 0) hotbar[selectedIndex] = null;
        health = Math.min(MAX_HEALTH, health + FOOD_HEAL);
        updateSelected();
        return;
    }

    for (const arr of [hotbar, invSlots]) {
        for (let i = 0; i < arr.length; i++) {
            const s = arr[i];
            if (s && s.id === FOOD) {
                s.count -= 1;
                if (s.count <= 0) arr[i] = null;
                health = Math.min(MAX_HEALTH, health + FOOD_HEAL);
                updateSelected();
                return;
            }
        }
    }
}

function currentMiningMultiplier() {
    if (isPickaxe(selectedBlock)) return PICKAXE_MULT[selectedBlock] || 1;
    return 1;
}

function updateMining() {
    if (attackCooldown > 0) attackCooldown--;

    if (dead) { miningProgress = 0; miningTargetX = -1; return; }
    if (inventoryOpen || openFurnace) { miningProgress = 0; miningTargetX = -1; return; }
    if (!mouseDownL) { miningProgress = 0; miningTargetX = -1; return; }
    if (mouseX < 0 || mouseY < 0 || mouseX >= viewW || mouseY >= viewH) {
        miningProgress = 0; miningTargetX = -1; return;
    }

    if (attackCooldown <= 0) {
        const rp = getRemotePlayerAt(mouseX, mouseY, renderCamX, renderCamY);
        if (rp) {
            netSendHit(rp.id, currentAttackDamage());
            attackCooldown = 8;
            miningProgress = 0;
            miningTargetX = -1;
            return;
        }
    } else {
        const rp = getRemotePlayerAt(mouseX, mouseY, renderCamX, renderCamY);
        if (rp) { miningProgress = 0; miningTargetX = -1; return; }
    }

    if (attackCooldown <= 0) {
        if (tryAttackMobAt(mouseX, mouseY)) {
            attackCooldown = 8;
            miningProgress = 0;
            miningTargetX = -1;
            return;
        }
    } else {
        if (tryAttackMobAt(mouseX, mouseY)) {
            miningProgress = 0; miningTargetX = -1; return;
        }
    }

    const screenRow = Math.floor(mouseY / BLOCK_SIZE + renderCamY);
    const worldX = Math.floor(mouseX / BLOCK_SIZE + renderCamX);
    const worldY = (WORLD_HEIGHT - 1) - screenRow;

    if (worldX < 0 || worldX >= WORLD_WIDTH || worldY < 0 || worldY >= WORLD_HEIGHT) {
        miningProgress = 0; miningTargetX = -1; return;
    }
    if (Math.abs(worldX + 0.5 - playerXf) > BREAK_RANGE || Math.abs(worldY + 0.5 - playerYf) > BREAK_RANGE) {
        miningProgress = 0; miningTargetX = -1; return;
    }
    const blockId = getBlock(worldX, worldY);
    if (blockId === 0 || blockId === 11) {
        miningProgress = 0; miningTargetX = -1; return;
    }

    if (miningTargetX !== worldX || miningTargetY !== worldY) {
        miningTargetX = worldX;
        miningTargetY = worldY;
        miningProgress = 0;
    }

    const totalTicks = BLOCK_BREAK_TICKS[blockId] || 40;
    if (totalTicks === Infinity) { miningProgress = 0; return; }

    if (gameMode === 'creative') {
        miningProgress = 1;
    } else {
        const mult = currentMiningMultiplier();
        miningProgress += mult / totalTicks;
    }
    if (miningProgress >= 1) {
        if (blockId === FURNACE) {
            const f = furnaces.get(worldX + ',' + worldY);
            if (f) {
                if (f.input)  spawnFoodDrop(worldX + 0.5, worldY + 1.2, f.input.id,  f.input.count);
                if (f.fuel)   spawnFoodDrop(worldX + 0.5, worldY + 1.2, f.fuel.id,   f.fuel.count);
                if (f.output) spawnFoodDrop(worldX + 0.5, worldY + 1.2, f.output.id, f.output.count);
                furnaces.delete(worldX + ',' + worldY);
                broadcastFurnaceRemove(worldX, worldY);
            }
        }
        const drop = getBlockDrop(blockId);
        addItem(drop.id, drop.count);
        setBlock(worldX, worldY, 0);
        netSendEdit(worldX, worldY, 0);
        blockEdits.set(worldX + ',' + worldY, { x: worldX, y: worldY, id: 0 });
        miningProgress = 0;
        miningTargetX = -1;
    }
}

// ---- Inventory UI hit-testing ----

function getInventoryLayout() {
    const slot = 44;
    const gap = 4;
    const pad = 12;
    const titleH = 24;

    const craftW = 3 * slot + 2 * gap;
    const invW = INV_COLS * slot + (INV_COLS - 1) * gap;
    const topW = craftW + ARROW_W + slot;
    const armorW = 4 * slot + 3 * gap;

    const panelW = Math.max(invW, topW, armorW) + pad * 2;
    const invH = INV_ROWS * slot + (INV_ROWS - 1) * gap;

    const panelH =
        pad +
        titleH + slot +         // armor row
        12 +
        titleH + craftW +       // crafting row (square)
        12 +
        titleH + invH +         // inventory rows
        8 + slot +              // hotbar
        pad;

    const panelX = (viewW - panelW) / 2;
    const panelY = (viewH - panelH) / 2;

    const armorY = panelY + pad + titleH;
    const armorX = panelX + (panelW - armorW) / 2;

    const craftLabelY = armorY + slot + 12;
    const craftGridX = panelX + pad;
    const craftGridY = craftLabelY + titleH;

    const resultX = craftGridX + craftW + ARROW_W;
    const resultY = craftGridY + Math.floor((craftW - slot) / 2);

    const invLabelY = craftGridY + craftW + 12;
    const invGridX = panelX + pad;
    const invGridY = invLabelY + titleH;

    const hotbarX = panelX + pad;
    const hotbarY = invGridY + invH + 8;

    return {
        slot, gap, pad, titleH, panelW, panelH, panelX, panelY,
        armorX, armorY, armorW,
        craftW, craftGridX, craftGridY, resultX, resultY,
        invGridX, invGridY, invH, hotbarX, hotbarY
    };
}

function inventorySlotAt(mx, my) {
    const L = getInventoryLayout();

    if (mx < L.panelX || mx > L.panelX + L.panelW) return null;
    if (my < L.panelY || my > L.panelY + L.panelH) return null;

    for (let i = 0; i < 4; i++) {
        const sx = L.armorX + i * (L.slot + L.gap);
        const sy = L.armorY;
        if (mx >= sx && mx < sx + L.slot && my >= sy && my < sy + L.slot) {
            return { type: 'armor', index: i, sx, sy };
        }
    }
    
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const sx = L.craftGridX + c * (L.slot + L.gap);
            const sy = L.craftGridY + r * (L.slot + L.gap);
            if (mx >= sx && mx < sx + L.slot && my >= sy && my < sy + L.slot) {
                return { type: 'craft', index: r * 3 + c, sx, sy };
            }
        }
    }

    if (mx >= L.resultX && mx < L.resultX + L.slot &&
        my >= L.resultY && my < L.resultY + L.slot) {
        return { type: 'result', sx: L.resultX, sy: L.resultY };
    }

    for (let r = 0; r < INV_ROWS; r++) {
        for (let c = 0; c < INV_COLS; c++) {
            const sx = L.invGridX + c * (L.slot + L.gap);
            const sy = L.invGridY + r * (L.slot + L.gap);
            if (mx >= sx && mx < sx + L.slot && my >= sy && my < sy + L.slot) {
                return { type: 'inv', index: r * INV_COLS + c, sx, sy };
            }
        }
    }

    for (let c = 0; c < 10; c++) {
        const sx = L.hotbarX + c * (L.slot + L.gap);
        const sy = L.hotbarY;
        if (mx >= sx && mx < sx + L.slot && my >= sy && my < sy + L.slot) {
            return { type: 'hotbar', index: c, sx, sy };
        }
    }

    return null;
}

function clickInventorySlot(slotInfo, rightClick) {
    let arr, idx;
    if (slotInfo.type === 'armor') {
        clickArmorSlot(slotInfo.index, rightClick);
        return;
    }
    if (slotInfo.type === 'hotbar') { arr = hotbar; idx = slotInfo.index; }
    else if (slotInfo.type === 'inv') { arr = invSlots; idx = slotInfo.index; }
    else if (slotInfo.type === 'craft') { arr = craftGrid; idx = slotInfo.index; }
    else if (slotInfo.type === 'result') {
        if (rightClick) return;
        const result = tryTakeCraftResult();
        if (!result) return;
        if (heldItem === null) {
            heldItem = { id: result.id, count: result.count };
        } else if (heldItem.id === result.id && heldItem.count + result.count <= MAX_STACK) {
            heldItem.count += result.count;
        } else {
            const leftover = addItem(result.id, result.count);
            if (leftover > 0) {
                spawnFoodDrop(playerXf + (Math.random() - 0.5) * 0.6, playerYf + 0.5,
                              result.id, leftover);
            }
        }
        return;
    } else {
        return;
    }

    const target = arr[idx];

    if (heldItem === null) {
        if (target) {
            if (rightClick && target.count > 1) {
                const take = Math.ceil(target.count / 2);
                heldItem = { id: target.id, count: take };
                target.count -= take;
                if (target.count <= 0) arr[idx] = null;
            } else {
                heldItem = target;
                arr[idx] = null;
            }
        }
        return;
    }

    if (target === null) {
        if (rightClick) {
            arr[idx] = { id: heldItem.id, count: 1 };
            heldItem.count -= 1;
            if (heldItem.count <= 0) heldItem = null;
        } else {
            arr[idx] = heldItem;
            heldItem = null;
        }
        return;
    }

    if (target.id === heldItem.id && target.count < MAX_STACK) {
        const space = MAX_STACK - target.count;
        if (rightClick) {
            target.count += 1;
            heldItem.count -= 1;
            if (heldItem.count <= 0) heldItem = null;
        } else {
            const move = Math.min(space, heldItem.count);
            target.count += move;
            heldItem.count -= move;
            if (heldItem.count <= 0) heldItem = null;
        }
        return;
    }

    if (!rightClick) {
        arr[idx] = heldItem;
        heldItem = target;
    }
}

// ---- Furnace UI hit-testing ----

function getFurnaceLayout() {
    const slot = 44;
    const gap = 4;
    const pad = 12;
    const titleH = 24;
    const arrowW = 50;

    const invW = INV_COLS * slot + (INV_COLS - 1) * gap;
    const topW = 2 * slot + arrowW + 24;
    const panelW = Math.max(invW, topW) + pad * 2;

    const invH = INV_ROWS * slot + (INV_ROWS - 1) * gap;
    const panelH = pad + titleH + 2 * slot + gap + 20 + titleH + invH + 8 + slot + pad;

    const panelX = (viewW - panelW) / 2;
    const panelY = (viewH - panelH) / 2;

    const colX = panelX + pad;
    const inputY = panelY + pad + titleH;
    const fuelY = inputY + slot + gap;

    const arrowX = colX + slot + 8;
    const arrowY = inputY + slot / 2 - 10;

    const outputX = arrowX + arrowW + 8;
    const outputY = inputY;

    const invLabelY = fuelY + slot + 16;
    const invGridX = panelX + pad;
    const invGridY = invLabelY + titleH;
    const hotbarX = panelX + pad;
    const hotbarY = invGridY + invH + 8;

    return {
        slot, gap, pad, titleH, panelW, panelH, panelX, panelY,
        inputX: colX, inputY, fuelX: colX, fuelY,
        outputX, outputY, arrowX, arrowY, arrowW,
        invGridX, invGridY, invH, hotbarX, hotbarY
    };
}

function furnaceSlotAt(mx, my) {
    const L = getFurnaceLayout();
    if (mx < L.panelX || mx > L.panelX + L.panelW) return null;
    if (my < L.panelY || my > L.panelY + L.panelH) return null;

    if (mx >= L.inputX && mx < L.inputX + L.slot &&
        my >= L.inputY && my < L.inputY + L.slot) return { type: 'input' };

    if (mx >= L.fuelX && mx < L.fuelX + L.slot &&
        my >= L.fuelY && my < L.fuelY + L.slot) return { type: 'fuel' };

    if (mx >= L.outputX && mx < L.outputX + L.slot &&
        my >= L.outputY && my < L.outputY + L.slot) return { type: 'output' };

    for (let r = 0; r < INV_ROWS; r++) {
        for (let c = 0; c < INV_COLS; c++) {
            const sx = L.invGridX + c * (L.slot + L.gap);
            const sy = L.invGridY + r * (L.slot + L.gap);
            if (mx >= sx && mx < sx + L.slot && my >= sy && my < sy + L.slot) {
                return { type: 'inv', index: r * INV_COLS + c };
            }
        }
    }
    for (let c = 0; c < 10; c++) {
        const sx = L.hotbarX + c * (L.slot + L.gap);
        const sy = L.hotbarY;
        if (mx >= sx && mx < sx + L.slot && my >= sy && my < sy + L.slot) {
            return { type: 'hotbar', index: c };
        }
    }
    return null;
}

function clickFurnaceSlot(hit, rightClick) {
    if (!openFurnace) return;
    const f = furnaces.get(openFurnace);
    if (!f) return;
    const [fx, fy] = openFurnace.split(',').map(Number);

    if (hit.type === 'output') {
        if (!f.output) return;
        if (rightClick) return;
        if (heldItem === null) {
            heldItem = f.output;
            f.output = null;
        } else if (heldItem.id === f.output.id && heldItem.count + f.output.count <= MAX_STACK) {
            heldItem.count += f.output.count;
            f.output = null;
        }
        broadcastFurnaceState(fx, fy);
        return;
    }

    const slotKey = hit.type;
    if (slotKey !== 'input' && slotKey !== 'fuel') {
        clickInventorySlot(hit, rightClick);
        return;
    }

    const target = f[slotKey];

    if (heldItem === null) {
        if (target) {
            if (rightClick && target.count > 1) {
                const take = Math.ceil(target.count / 2);
                heldItem = { id: target.id, count: take };
                target.count -= take;
                if (target.count <= 0) f[slotKey] = null;
            } else {
                heldItem = target;
                f[slotKey] = null;
            }
        }
    } else if (target === null) {
        if (rightClick) {
            f[slotKey] = { id: heldItem.id, count: 1 };
            heldItem.count--;
            if (heldItem.count <= 0) heldItem = null;
        } else {
            f[slotKey] = heldItem;
            heldItem = null;
        }
    } else if (target.id === heldItem.id && target.count < MAX_STACK) {
        const space = MAX_STACK - target.count;
        const move = rightClick ? Math.min(1, heldItem.count) : Math.min(space, heldItem.count);
        target.count += move;
        heldItem.count -= move;
        if (heldItem.count <= 0) heldItem = null;
    } else if (!rightClick) {
        f[slotKey] = heldItem;
        heldItem = target;
    }

    broadcastFurnaceState(fx, fy);
}

// ---- Input wiring ----

function setupInput() {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (viewW / rect.width);
        mouseY = (e.clientY - rect.top) * (viewH / rect.height);
    });

    canvas.addEventListener('mouseleave', () => {
        mouseX = -1;
        mouseY = -1;
        mouseDownL = false;
        miningProgress = 0;
        miningTargetX = -1;
    });

    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        // Clicking the game blurs any focused input field
        if (document.activeElement && document.activeElement !== canvas) {
            document.activeElement.blur();
        }
        canvas.focus();
        if (dead) return;

        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (viewW / rect.width);
        const my = (e.clientY - rect.top) * (viewH / rect.height);

        // ---- Furnace UI open ----
        if (openFurnace) {
            const hit = furnaceSlotAt(mx, my);
            if (hit) clickFurnaceSlot(hit, e.button === 2);
            return;  // clicks outside the panel are ignored
        }

        // ---- Inventory open ----
        if (inventoryOpen) {
            const slotInfo = inventorySlotAt(mx, my);
            if (slotInfo) clickInventorySlot(slotInfo, e.button === 2);
            return;  // clicks outside the panel are ignored
        }

        // ---- World interaction ----
        const screenRow = Math.floor(my / BLOCK_SIZE + renderCamY);
        const worldX = Math.floor(mx / BLOCK_SIZE + renderCamX);
        const worldY = (WORLD_HEIGHT - 1) - screenRow;

        if (e.button === 0) {
            mouseDownL = true;

            const targetPlayer = getRemotePlayerAt(mx, my, renderCamX, renderCamY);
            if (targetPlayer && attackCooldown <= 0) {
                netSendHit(targetPlayer.id, currentAttackDamage());
                attackCooldown = 8;
                return;
            }
            if (targetPlayer) return;

            if (tryAttackMobAt(mx, my)) {
                attackCooldown = 8;
                return;
            }

            miningTargetX = -1;
            miningProgress = 0;
        } else if (e.button === 2) {
            if (worldX < 0 || worldX >= WORLD_WIDTH || worldY < 0 || worldY >= WORLD_HEIGHT) return;

            // ---- Furnace interaction (short range) ----
            const nearFurnace =
                Math.abs(worldX + 0.5 - playerXf) <= FURNACE_INTERACT_RANGE &&
                Math.abs(worldY + 0.5 - playerYf) <= FURNACE_INTERACT_RANGE;
            if (nearFurnace && getBlock(worldX, worldY) === FURNACE) {
                ensureFurnaceAt(worldX, worldY);
                broadcastFurnaceState(worldX, worldY);
                openFurnace = worldX + ',' + worldY;
                if (inventoryOpen) closeInventory();
                return;
            }

            // ---- Eating ----
            if (selectedBlock === FOOD) {
                eatFood();
                return;
            }

            // ---- Placing (long range) ----
            if (Math.abs(worldX + 0.5 - playerXf) > PLACE_RANGE ||
                Math.abs(worldY + 0.5 - playerYf) > PLACE_RANGE) return;
            if (!isPlaceableBlock(selectedBlock)) return;
            const slot = hotbar[selectedIndex];
            if (!slot || slot.count <= 0) return;
            if (getBlock(worldX, worldY) !== 0) return;

            setBlock(worldX, worldY, selectedBlock);
            if (gameMode !== 'creative') consumeSelectedBlock();
            netSendEdit(worldX, worldY, selectedBlock);
            blockEdits.set(worldX + ',' + worldY, { x: worldX, y: worldY, id: selectedBlock });
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            mouseDownL = false;
            miningProgress = 0;
            miningTargetX = -1;
        }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (dead) return;
        if (inventoryOpen || openFurnace) return;
        cycleSelection(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
        // Let the chat box handle its own keys
        if (chatOpen) return;
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea') return;

        keys[e.key] = true;

        switch (e.code) {
            case 'KeyT':
                if (!inventoryOpen && !openFurnace && !dead) {
                    openChatInput();
                    e.preventDefault();
                }
                return;

            case 'KeyE':
                if (openFurnace) { closeFurnace(); return; }
                if (inventoryOpen) closeInventory();
                else inventoryOpen = true;
                return;

            case 'Escape':
                if (openFurnace) { closeFurnace(); return; }
                if (inventoryOpen) { closeInventory(); return; }
                return;

            case 'KeyF':
                if (!inventoryOpen && !openFurnace) eatFood();
                return;

            case 'KeyQ':
                if (!inventoryOpen && !openFurnace) cycleSelection(-1);
                return;

            case 'F4':
                debugOpen = !debugOpen;
                e.preventDefault();
                return;

            case 'Digit1': case 'Digit2': case 'Digit3':
            case 'Digit4': case 'Digit5': case 'Digit6':
            case 'Digit7': case 'Digit8': case 'Digit9': {
                const n = parseInt(e.code.slice(5), 10);
                selectedIndex = n - 1;
                updateSelected();
                return;
            }

            case 'Digit0':
                selectedIndex = 9;
                updateSelected();
                return;

            case 'Space':
            case 'ArrowUp':
                e.preventDefault();
                return;   // keys[...] already set above; movement reads it
        }

        // Arrow keys still need preventDefault so the page doesn't scroll
        if (e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    window.addEventListener('resize', resizeCanvas);
}

function createUI() {
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        z-index: 100;
        font-family: Arial, sans-serif;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
        max-width: calc(100vw - 20px);
    `;

    function makeBtn(label, fn) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            padding: 8px 14px;
            font-size: 14px;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            background: rgba(0,0,0,0.6);
            color: white;
            cursor: pointer;
            font-family: inherit;
        `;
        btn.onmouseover = () => { if (!btn.disabled) btn.style.background = 'rgba(0,0,0,0.8)'; };
        btn.onmouseout = () => { if (!btn.disabled) btn.style.background = 'rgba(0,0,0,0.6)'; };
        btn.onclick = () => { fn(); btn.blur(); };
        return btn;
    }

    panel.appendChild(makeBtn('New Normal World', () => {
        if (connected) return;
        generateWorld('normal');
        updateViewOffset();
        canvas.focus();
    }));
    panel.appendChild(makeBtn('New Flat World', () => {
        if (connected) return;
        generateWorld('flat');
        updateViewOffset();
        canvas.focus();
    }));

    // Name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Name';
    nameInput.maxLength = 2147483647;
    nameInput.value = myName;
    nameInput.style.cssText = `
        padding: 7px 10px;
        font-size: 13px;
        border: none;
        border-radius: 4px;
        background: rgba(0,0,0,0.6);
        color: white;
        font-family: inherit;
        width: 110px;
        outline: none;
    `;

    let nameDebounce = null;
    nameInput.oninput = () => {
        clearTimeout(nameDebounce);
        nameDebounce = setTimeout(() => {
            const trimmed = nameInput.value.trim() || 'Player';
            myName = trimmed;
            try { localStorage.setItem('playerName', trimmed); } catch {}
            if (connected && ws && ws.readyState === 1) {
                ws.send(JSON.stringify({ type: 'name', name: trimmed }));
            }
        }, 300);
    };
    panel.appendChild(nameInput);

    // Color picker
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = myColor;
    colorInput.title = 'Your color';
    colorInput.style.cssText = `
        width: 36px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: rgba(0,0,0,0.6);
        cursor: pointer;
    `;
    colorInput.oninput = () => {
        myColor = colorInput.value;
        try { localStorage.setItem('playerColor', myColor); } catch {}
        if (connected && ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'color', color: myColor }));
        }
    };
    panel.appendChild(colorInput);

    // IP input
    const ipInput = document.createElement('input');
    ipInput.type = 'text';
    ipInput.placeholder = 'IP:PORT (blank = local)';
    ipInput.style.cssText = `
        padding: 7px 10px;
        font-size: 13px;
        border: none;
        border-radius: 4px;
        background: rgba(0,0,0,0.6);
        color: white;
        font-family: inherit;
        width: 180px;
        outline: none;
    `;
    panel.appendChild(ipInput);

    const statusLabel = document.createElement('span');
    statusLabel.style.cssText = `
        color: white;
        font-size: 13px;
        font-weight: bold;
        padding: 0 4px;
        text-shadow: 0 1px 2px black;
    `;
    statusLabel.textContent = 'offline';

    const connectBtn = makeBtn('Connect', () => {});
    connectBtn.onclick = () => {
        if (connected && ws) {
            try { ws.close(); } catch {}
            connected = false;
        } else {
            let addr = ipInput.value.trim();
            if (!addr) addr = location.hostname + ':8080';
            if (!addr.startsWith('ws://') && !addr.startsWith('wss://')) addr = 'ws://' + addr;
            const trimmed = nameInput.value.trim() || 'Player';
            myName = trimmed;
            try { localStorage.setItem('playerName', trimmed); } catch {}
            connectToServer(addr, myName);
        }
        connectBtn.blur();
    };
    panel.appendChild(connectBtn);
    panel.appendChild(statusLabel);

        // Chat input (hidden until T is pressed)
    chatInputEl = document.createElement('input');
    chatInputEl.type = 'text';
    chatInputEl.maxLength = 256;
    chatInputEl.placeholder = 'Message or /command (Enter to send, Esc to cancel)';
    chatInputEl.style.cssText = `
        position: fixed;
        bottom: 110px;
        left: 20px;
        width: 520px;
        padding: 9px 12px;
        font-size: 14px;
        font-family: Arial, sans-serif;
        border: 2px solid rgba(255,255,255,0.5);
        border-radius: 4px;
        background: rgba(0,0,0,0.85);
        color: white;
        outline: none;
        display: none;
        z-index: 200;
    `;
    chatInputEl.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') {
            sendChatOrCommand(chatInputEl.value);
            closeChatInput();
        } else if (ev.key === 'Escape') {
            closeChatInput();
        }
    });
    document.body.appendChild(chatInputEl);

    setInterval(() => {
        if (connected) {
            statusLabel.textContent = 'online #' + myNetId;
            statusLabel.style.color = '#7CFF7C';
            connectBtn.textContent = 'Disconnect';
        } else {
            statusLabel.textContent = 'offline';
            statusLabel.style.color = '#FFA8A8';
            connectBtn.textContent = 'Connect';
        }
    }, 250);

    document.body.appendChild(panel);
}

function openChatInput() {
    if (!chatInputEl) return;
    chatOpen = true;
    chatInputEl.style.display = 'block';
    chatInputEl.value = '';
    chatInputEl.focus();
}

function closeChatInput() {
    chatOpen = false;
    if (chatInputEl) {
        chatInputEl.style.display = 'none';
        chatInputEl.blur();
    }
    canvas.focus();
}

function sendChatOrCommand(raw) {
    const text = raw.trim();
    if (!text) return;

    if (text.startsWith('/')) {
        const parts = text.slice(1).split(/\s+/);
        const cmd = parts[0].toLowerCase();

        if (cmd === 'give') {
            const id = parseInt(parts[1], 10);
            const count = parseInt(parts[2], 10);
            if (!Number.isInteger(id) || !Number.isInteger(count) || count <= 0) {
                chatMessages.push({ text: 'Usage: /give <id> <count>', tick: globalTick, color: '#FFA8A8' });
                return;
            }
            if (!itemName(id) || itemName(id) === '?') {
                chatMessages.push({ text: 'Unknown item id ' + id, tick: globalTick, color: '#FFA8A8' });
                return;
            }
            addItem(id, count);
            chatMessages.push({ text: `Gave ${count}× ${itemName(id)}`, tick: globalTick, color: '#88FF88' });
            return;
        }

        if (cmd === 'tp') {
            const a = parseInt((parts[1] || '').replace('#', ''), 10);
            const b = parseInt((parts[2] || '').replace('#', ''), 10);
            if (!Number.isInteger(a) || !Number.isInteger(b)) {
                chatMessages.push({ text: 'Usage: /tp <fromId> <toId>', tick: globalTick, color: '#FFA8A8' });
                return;
            }
            if (!connected) {
                chatMessages.push({ text: 'Not connected.', tick: globalTick, color: '#FFA8A8' });
                return;
            }
            netSendTp(a, b);
            return;
        }


        if (cmd === 'creative') {
            gameMode = 'creative';
            grantCreativeInventory();
            chatMessages.push({ text: 'Set gamemode to creative', tick: globalTick, color: '#88FF88' });
            return;
        }

        if (cmd === 'survival') {
            gameMode = 'survival';
            chatMessages.push({ text: 'Set gamemode to survival', tick: globalTick, color: '#88FF88' });
            return;
        }

        if (cmd === 'speed') {
            const mult = parseFloat(parts[1]);
            if (!Number.isFinite(mult) || mult <= 0) {
                chatMessages.push({ text: 'Usage: /speed <multiplier> (e.g. /speed 3)', tick: globalTick, color: '#FFA8A8' });
                return;
            }
            speedMultiplier = mult;
            chatMessages.push({ text: 'Speed ×' + speedMultiplier, tick: globalTick, color: '#88FF88' });
            return;
        }
        if (cmd === 'goto') {
            const x = parseFloat(parts[1]);
            const y = parts[2] !== undefined ? parseFloat(parts[2]) : null;
            if (!Number.isFinite(x)) {
                chatMessages.push({ text: 'Usage: /goto <x> [y]', tick: globalTick, color: '#FFA8A8' });
                return;
            }
            playerXf = Math.max(PLAYER_HALF_W, Math.min(WORLD_WIDTH - PLAYER_HALF_W, x));
            if (y !== null && Number.isFinite(y)) {
                playerYf = Math.max(0, Math.min(WORLD_HEIGHT - 1, y));
            } else {
                playerYf = findSurfaceY(Math.floor(playerXf)) + 1;
            }
            prevPlayerXf = playerXf;
            prevPlayerYf = playerYf;
            velocityX = 0;
            velocityY = 0;
            onGround = true;
            peakYf = playerYf;
            updateViewOffset();
            chatMessages.push({
                text: `Teleported to ${playerXf.toFixed(0)}, ${playerYf.toFixed(0)}`,
                tick: globalTick, color: '#88FF88'
            });
            return;
        }

        chatMessages.push({ text: 'Unknown command: /' + cmd, tick: globalTick, color: '#FFA8A8' });
        return;
    }

    if (!connected) {
        chatMessages.push({ text: 'Not connected.', tick: globalTick, color: '#FFA8A8' });
        return;
    }
    netSendChat(text);
}