# BlockyWorld

A 2D block-based sandbox game with survival, crafting, mobs, and LAN multiplayer. Built in vanilla JavaScript on a single HTML5 canvas.

**Version:** b1.10.2

---

## Running

### Single player
1. Clone or copy the project folder anywhere.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. Play.

The game runs entirely offline. Refreshing regenerates the world unless you're connected to a server.

# HUGE NOTE: 9007199254740478 is the last safe coordinate you can be at, anything past that freezes the game

### Multiplayer (LAN)
1. Install [Node.js](https://nodejs.org) (any recent LTS).
2. In the project folder:
npm install ws
node server.js
3. The server prints its LAN IP, e.g. `Connect: ws://192.168.1.42:8080`.
4. On every client, open `index.html` and either:
- Add `?server=192.168.1.42:8080` to the URL, or
- Type `192.168.1.42:8080` into the input at the top and click **Connect**.

Optional: pass a fixed seed with `node server.js 12345` so every restart regenerates the same world. Without a seed, one is picked randomly and printed on startup.

---

## Controls

| Key | Action |
|---|---|
| **A / D** or **← / →** | Move left / right |
| **W**, **Space**, or **↑** | Jump |
| **Left Click** | Break block / attack mob or player |
| **Right Click** | Place block / open furnace / eat food |
| **Mouse Wheel** | Cycle hotbar slot |
| **1 – 0** | Select hotbar slot directly |
| **Q** | Cycle hotbar backwards |
| **E** | Open / close inventory & crafting |
| **Escape** | Close open UI |
| **T** | Open chat |
| **F4** | Toggle debug info |

---

## Gameplay

### Mining
Blocks break over time. Bare hands are slow; pickaxes speed it up

### Crafting
Open inventory with **E**. Combine items in the 3×3 grid to the top-left. Match the pattern; the result shows in the slot on the right.

Recipes:

- **Sticks** — 1 log alone
- **Pickaxes** — 3 material in top row, 2 sticks down the middle column
- **Swords** — 2 material stacked, 1 stick below
- **Furnace** — 8 stone in a ring
- **Iron / Gold armor** — standard helmet / chest / legs / boots patterns using ingots
- **Diamond / Mythril armor** — same patterns using ore blocks

### Smelting
Place a furnace, right-click to open. Put ore in the top slot, fuel (coal or logs) in the bottom slot. Iron ore → iron ingot, gold ore → gold ingot. Smelt time is 2 seconds per item.

### Armor
Four slots (helmet / chest / legs / boots). Damage reduction is `(total defense) / 30`.

### Survival
- 20 HP, ten hearts.
- Fall damage above 6 blocks.
- Natural regeneration after 5 seconds without taking damage.
- On death: everything drops where you died, and you respawn within 5 blocks of the spawn point.
- Eat food (drops from mobs) to heal 6 HP.

### Mobs
Cows, pigs, and sheep wander the surface. Three hits to kill, drop food on death. Attack them by left-clicking within 5 blocks.

---

## Multiplayer

- **Synchronized world.** The server sends a seed; every client generates the identical terrain, ores, caves, and trees.
- **Synchronized edits.** Breaking or placing is broadcast instantly. New players receive the full edit history.
- **Synchronized drops.** Death drops and mob drops are visible to everyone.
- **Synchronized furnaces.** Furnace contents and progress are shared.
- **Chat.** Press **T**. Everyone on the server sees it.
- **Random colors.** Every player gets a unique color, shown as a tag above their sprite.

### Chat commands

| Command | Effect |
|---|---|
| `/give <id> <count>` | Add items to your inventory. Example: `/give 1 10` gives 10 Grass |
| `/tp <fromId> <toId>` | Teleport player `<fromId>` to player `<toId>`. Example: `/tp 2 1` |
| `/goto <xCoord> <yCoord>` | Teleport to the specified `<xCoord>` and `<yCoord>`. Example: `/goto 255 127` |

Player IDs appear in the debug menu (**F4**).

---

## Debug menu

Press **F4** to toggle an overlay showing:

- Game version
- FPS
- Current X / Y position
- Selected block name and ID
- Health, food, armor summary
- World seed
- Connection status and your player ID
- Mob and drop counts

---

## Project layout
index.html
server.js
package.json
README.md
terrain.png (optional custom texture atlas)
script/
    perlin.js # Perlin + 2D value noise
    rng.js # Seeded PRNG
    config.js # All constants (sizes, speeds, recipes, ranges)
    state.js # Global mutable state (player, world, chat, UI)
    blocks.js # Block/item data tables, tile cache, crafting recipes
    textures.js # Loads terrain.png into the tile cache
    inventory.js # Inventory helpers, crafting evaluation
    world.js # World generation
    player.js # Physics, damage, death, respawn
    mobs.js # Passive mob AI and drops
    network.js # WebSocket client and message handlers
    render.js # Camera, drawing, HUD
    input.js # Mouse + keyboard + UI hit-testing + commands
    a.js # Game loop and initialization