const BLOCK_SIZE = 80;
const WORLD_WIDTH = 9_007_199_254_740_990;
const WORLD_HEIGHT = 400;
const GROUND_LEVEL = 175;
const CHUNK_SIZE = 256;
const MESA_BIOME_THRESHOLD = 0.72;

const VERSION = 'b1.10.2';
let debugOpen = false;

const GRAVITY = 0.045;
const JUMP_FORCE = 0.5;
const JUMP_COOLDOWN_FRAMES = 15;
const MAX_SPEED = 0.2;

const PLAYER_HALF_W = 0.5;
const PLAYER_H = 1.0;
const PLAYER_COLLIDE_HALF_W = 0.48;
const PLAYER_COLLIDE_H = 0.9;

const BEDROCK_LAYERS = 1;

const CAVE_BG = '#181820';

const LOGIC_FPS = 30;
const LOGIC_STEP = 1000 / LOGIC_FPS;

const MAX_HEALTH = 20;
const FALL_DAMAGE_THRESHOLD = 6;
const RESPAWN_DELAY_FRAMES = 40;

const REGEN_DELAY = 150;
const REGEN_INTERVAL = 90;

const MAX_MOBS = 8;
const MOB_HEALTH = 5;
const MOB_WANDER_SPEED = 0.045;
const MOB_KNOCKBACK = 0.18;
const PLAYER_ATTACK_DAMAGE = 1;
const PLAYER_ATTACK_RANGE = 5;
const BREAK_RANGE = 10;
const PLACE_RANGE = 20;

const FOOD_HEAL = 6;
const FOOD_PICKUP_RANGE = 1.2;

const BLOCK_BREAK_TICKS = {
    1: 18, 2: 12, 3: 45, 4: 90, 5: 75, 6: 36, 7: 6,
    8: 45, 9: 36, 10: 45, 11: -1,
    12: 60, 13: 60, 14: 60, 15: 60, 16: 60, 17: 60, 18: 100
};

const HOTBAR_SIZE = 10;
const INV_COLS = 10;
const INV_ROWS = 3;
const INV_SIZE = INV_COLS * INV_ROWS;
const MAX_STACK = 255;

const PICKAXE_STONE = 100;
const PICKAXE_IRON = 101;
const PICKAXE_DIAMOND = 102;
const PICKAXE_MYTHRIL = 103;
const PICKAXE_GOLD = 104;
const PICKAXE_REDSTONE = 105;

const SWORD_STONE = 110;
const SWORD_IRON = 111;
const SWORD_DIAMOND = 112;
const SWORD_MYTHRIL = 113;
const SWORD_GOLD = 114;

const FOOD = 200;
const STICK = 201;
const IRON_INGOT = 202;
const GOLD_INGOT = 203;
const REDSTONE_DUST = 204;

const ARMOR_IRON_BASE    = 210;
const ARMOR_GOLD_BASE    = 214;
const ARMOR_DIAMOND_BASE = 218;
const ARMOR_MYTHRIL_BASE = 222;

const PICKAXE_MULT = {
    [PICKAXE_STONE]:   1.5,
    [PICKAXE_IRON]:    2.25,
    [PICKAXE_GOLD]:    3.5,
    [PICKAXE_DIAMOND]: 5.0,
    [PICKAXE_MYTHRIL]: 8.0,
    [PICKAXE_REDSTONE]: 100.0
};

const SWORD_DAMAGE = {
    [SWORD_STONE]:   2,
    [SWORD_IRON]:    3,
    [SWORD_GOLD]:    3,
    [SWORD_DIAMOND]: 4,
    [SWORD_MYTHRIL]: 6
};

const CRAFT_GRID_SIZE = 3;
const ARROW_W = 30;

const FURNACE = 19;

const SMELT_TICKS = 60;      // 2 s @30Hz per smelt
const FURNACE_INTERACT_RANGE = 6;

const SMELT_RECIPES = {
    13: IRON_INGOT,
    14: GOLD_INGOT
};

const FUEL_VALUES = {
    12: 8,   // coal ore → 8 smelts
    6:  3    // log → 3 smelts
};

// Defense values per piece (helmet, chest, legs, boots) — sum/30 = reduction
const ARMOR_DEFENSE = {
    iron:    [2, 6, 5, 2],   // 15 → 50%
    gold:    [2, 5, 3, 1],   // 11 → 37%
    diamond: [3, 8, 6, 3],   // 20 → 67%
    mythril: [7, 9, 7, 6]   // 29 → 97%
};
const ARMOR_REDUCTION_CAP = 1;
const ARMOR_REDUCTION_DIVISOR = 30;

const ARMOR_MATERIAL_COLOR = {
    iron:    '#d8d8d8',
    gold:    '#ffd94a',
    diamond: '#4ff0e0',
    mythril: '#a855ff'
};