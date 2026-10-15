const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

let VIEW_WIDTH = 32;
let VIEW_HEIGHT = 18;
let viewW = 0;
let viewH = 0;

const chunks = new Map();
const blockEdits = new Map();

let playerXf = 10.5;
let playerYf = GROUND_LEVEL;
let prevPlayerXf = playerXf;
let prevPlayerYf = playerYf;
let velocityX = 0;
let velocityY = 0;
let onGround = true;
function pickRandomColor() {
    const colors = ['#5c7cff', '#5cff7c', '#ff5c7c', '#ffb84a', '#b85cff', '#5cffff', '#ff8c5c', '#8cff5c', '#ff5cff', '#dcdc50', '#ff4040', '#40ff40'];
    return colors[Math.floor(Math.random() * colors.length)];
}
let myColor = (typeof localStorage !== 'undefined' && localStorage.getItem('playerColor')) || pickRandomColor();
try { if (typeof localStorage !== 'undefined') localStorage.setItem('playerColor', myColor); } catch {}
let nextLocalDropId = 1;

let health = MAX_HEALTH;
let peakYf = playerYf;
let fallDistance = 0;
let damageFlash = 0;
let dead = false;
let respawnTimer = 0;

let viewOffsetX = 0;
let viewOffsetY = 0;

const keys = {};
let jumpCooldown = 0;

let mouseX = -1;
let mouseY = -1;

let selectedIndex = 0;

let cloudDrift = 0;

let currentFPS = 0;
let lastFPSCheck = performance.now();
let frameCount = 0;

let renderCamX = 0;
let renderCamY = 0;

let skyGrad = null;

let lastTime = performance.now();
let accumulator = 0;

let hotbar = new Array(10).fill(null);
let invSlots = new Array(INV_SIZE).fill(null);
let inventoryOpen = false;
let heldItem = null;
let armorSlots = [null, null, null, null];   // helmet, chest, legs, boots

const foodDrops = [];
const mobs = [];
let globalTick = 0;
let lastDamageTick = -99999;

let mouseDownL = false;
let miningTargetX = -1;
let miningTargetY = -1;
let miningProgress = 0;
let attackCooldown = 0;

let ws = null;
let myNetId = 0;
let connected = false;
let serverSeed = 0;
let sendPosTick = 0;
const remotePlayers = new Map();
let myName = (typeof localStorage !== 'undefined' && localStorage.getItem('playerName')) || 'Player';

let craftGrid = new Array(CRAFT_GRID_SIZE * CRAFT_GRID_SIZE).fill(null);
const furnaces = new Map();     // "x,y" -> { input, fuel, output, progress, fuelBurn }
let openFurnace = null;         // "x,y" | null

const chatMessages = [];       // { text, tick, color }
let chatOpen = false;
let chatInputEl = null;
const CHAT_TTL = 400;          // ~13 sec

let gameMode = 'survival';
let speedMultiplier = 1;