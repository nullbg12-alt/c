function countItem(id) {
    let n = 0;
    for (const s of hotbar) if (s && s.id === id) n += s.count;
    for (const s of invSlots) if (s && s.id === id) n += s.count;
    return n;
}

function addItem(id, count = 1) {
    let remaining = count;

    // Merge into existing partial stacks first
    for (const arr of [hotbar, invSlots]) {
        for (let i = 0; i < arr.length && remaining > 0; i++) {
            const s = arr[i];
            if (s && s.id === id && s.count < MAX_STACK) {
                const add = Math.min(MAX_STACK - s.count, remaining);
                s.count += add;
                remaining -= add;
            }
        }
    }

    // Then empty slots — hotbar first
    for (const arr of [hotbar, invSlots]) {
        for (let i = 0; i < arr.length && remaining > 0; i++) {
            if (arr[i] === null) {
                const add = Math.min(MAX_STACK, remaining);
                arr[i] = { id, count: add };
                remaining -= add;
            }
        }
    }

    updateSelected();
    return remaining;
}

function consumeItem(id, count) {
    let remaining = count;
    for (const arr of [hotbar, invSlots]) {
        for (let i = 0; i < arr.length && remaining > 0; i++) {
            const s = arr[i];
            if (s && s.id === id) {
                const take = Math.min(s.count, remaining);
                s.count -= take;
                remaining -= take;
                if (s.count <= 0) arr[i] = null;
            }
        }
    }
    updateSelected();
    return count - remaining;
}

function updateSelected() {
    if (selectedIndex < 0) selectedIndex = 0;
    if (selectedIndex >= hotbar.length) selectedIndex = hotbar.length - 1;
    const slot = hotbar[selectedIndex];
    selectedBlock = slot ? slot.id : 0;
}

function selectedSlot() {
    return hotbar[selectedIndex] || null;
}

function consumeSelectedBlock() {
    const slot = hotbar[selectedIndex];
    if (!slot) return;
    slot.count -= 1;
    if (slot.count <= 0) hotbar[selectedIndex] = null;
    updateSelected();
}

function findMatchingRecipe() {
    // Build 3x3 of {id, count}
    const g = [];
    for (let r = 0; r < 3; r++) {
        g.push([craftGrid[r*3], craftGrid[r*3+1], craftGrid[r*3+2]]);
    }

    // Bounding box of items in the player's craft grid
    let minR = 3, maxR = -1, minC = 3, maxC = -1;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (g[r][c]) {
                if (r < minR) minR = r;
                if (r > maxR) maxR = r;
                if (c < minC) minC = c;
                if (c > maxC) maxC = c;
            }
        }
    }
    if (maxR < 0) return null;

    const bW = maxC - minC + 1;
    const bH = maxR - minR + 1;

    for (const recipe of CRAFTING_RECIPES) {
        // Bounding box of the recipe
        let rMinR = 99, rMaxR = -1, rMinC = 99, rMaxC = -1;
        for (let r = 0; r < recipe.grid.length; r++) {
            for (let c = 0; c < recipe.grid[r].length; c++) {
                const v = recipe.grid[r][c];
                if (v !== null && v !== undefined) {
                    if (r < rMinR) rMinR = r;
                    if (r > rMaxR) rMaxR = r;
                    if (c < rMinC) rMinC = c;
                    if (c > rMaxC) rMaxC = c;
                }
            }
        }
        if (rMaxR < 0) continue;

        const rW = rMaxC - rMinC + 1;
        const rH = rMaxR - rMinR + 1;
        if (rW !== bW || rH !== bH) continue;

        let match = true;
        for (let r = 0; r < bH && match; r++) {
            for (let c = 0; c < bW; c++) {
                const cell = g[minR + r][minC + c];
                const rr = rMinR + r;
                const cc = rMinC + c;
                const req = (recipe.grid[rr] && recipe.grid[rr][cc] !== undefined)
                    ? recipe.grid[rr][cc] : null;
                if (req === null) {
                    if (cell) { match = false; break; }
                } else {
                    if (!cell || cell.id !== req) { match = false; break; }
                }
            }
        }
        if (match) return recipe;
    }
    return null;
}

function tryTakeCraftResult() {
    const recipe = findMatchingRecipe();
    if (!recipe) return null;

    // Consume 1 from each non-empty craft grid slot.
    for (let i = 0; i < craftGrid.length; i++) {
        if (craftGrid[i]) {
            craftGrid[i].count -= 1;
            if (craftGrid[i].count <= 0) craftGrid[i] = null;
        }
    }
    return recipe.result;
}

function closeInventory() {
    inventoryOpen = false;
    if (heldItem) {
        const leftover = addItem(heldItem.id, heldItem.count);
        if (leftover > 0) {
            spawnFoodDrop(playerXf + (Math.random() - 0.5) * 0.6, playerYf + 0.5,
                          heldItem.id, leftover);
        }
        heldItem = null;
    }
    for (let i = 0; i < craftGrid.length; i++) {
        if (craftGrid[i]) {
            const leftover = addItem(craftGrid[i].id, craftGrid[i].count);
            if (leftover > 0) {
                spawnFoodDrop(playerXf + (Math.random() - 0.5) * 0.6, playerYf + 0.5,
                              craftGrid[i].id, leftover);
            }
            craftGrid[i] = null;
        }
    }
}

function clickArmorSlot(index, rightClick) {
    const target = armorSlots[index];

    if (heldItem === null) {
        if (target) {
            heldItem = target;
            armorSlots[index] = null;
        }
        return;
    }

    if (!isArmor(heldItem.id)) return;
    if (armorPiece(heldItem.id) !== index) return;

    if (target === null) {
        armorSlots[index] = heldItem;
        heldItem = null;
    } else {
        armorSlots[index] = heldItem;
        heldItem = target;
    }
}

function getFurnaceAt(x, y) {
    return furnaces.get(x + ',' + y) || null;
}

function ensureFurnaceAt(x, y) {
    const key = x + ',' + y;
    if (!furnaces.has(key)) {
        furnaces.set(key, {
            input: null, fuel: null, output: null,
            progress: 0, fuelBurn: 0
        });
    }
    return furnaces.get(key);
}

function broadcastFurnaceState(x, y) {
    if (!connected || !ws || ws.readyState !== 1) return;
    const f = furnaces.get(x + ',' + y);
    if (!f) return;
    ws.send(JSON.stringify({ type: 'furnaceUpdate', x, y, state: f }));
}

function broadcastFurnaceRemove(x, y) {
    if (!connected || !ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type: 'furnaceRemove', x, y }));
}

function tickFurnaces() {
    for (const [key, f] of furnaces) {
        const recipe = (f.input && SMELT_RECIPES[f.input.id]) ? SMELT_RECIPES[f.input.id] : null;
        const outputHasRoom = !f.output || (recipe && f.output.id === recipe && f.output.count < MAX_STACK);

        if (f.fuelBurn > 0 && recipe && outputHasRoom) {
            f.progress++;
            if (f.progress >= SMELT_TICKS) {
                f.progress = 0;
                f.input.count--;
                if (f.input.count <= 0) f.input = null;

                if (!f.output) f.output = { id: recipe, count: 1 };
                else f.output.count++;

                f.fuelBurn--;
                const [fx, fy] = key.split(',').map(Number);
                broadcastFurnaceState(fx, fy);
            }
        } else {
            f.progress = 0;
            if (f.fuelBurn === 0 && f.fuel && recipe && outputHasRoom) {
                const burn = FUEL_VALUES[f.fuel.id] || 0;
                if (burn > 0) {
                    f.fuelBurn = burn;
                    f.fuel.count--;
                    if (f.fuel.count <= 0) f.fuel = null;
                    const [fx, fy] = key.split(',').map(Number);
                    broadcastFurnaceState(fx, fy);
                }
            }
        }
    }
}

function grantCreativeInventory() {
    const everything = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, FOOD
    ];

    for (const id of everything) {
        addItem(id, MAX_STACK);
    }
    updateSelected();
}

function closeFurnace() {
    openFurnace = null;
    if (heldItem) {
        const leftover = addItem(heldItem.id, heldItem.count);
        if (leftover > 0) {
            spawnFoodDrop(playerXf + (Math.random() - 0.5) * 0.6, playerYf + 0.5, heldItem.id, leftover);
        }
        heldItem = null;
    }
}