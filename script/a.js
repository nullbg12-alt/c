function gameLoop(now) {
    const dt = now - lastTime;
    lastTime = now;

    accumulator += Math.min(dt, 250);

    let ticks = 0;
    while (accumulator >= LOGIC_STEP && ticks < 5) {
        ensureChunksAround(playerXf, playerYf);
        updatePlayer();
        updateMining();
        updateMobs();
        updateFoodDrops();
        tickFurnaces();
        accumulator -= LOGIC_STEP;
        ticks++;
    }

    updateRemotePlayers();
    draw();
    updateFPS();
    requestAnimationFrame(gameLoop);
}

resizeCanvas();
buildTileCache();
loadTextureAtlas();
generateWorld('normal');
updateViewOffset();
setupInput();
createUI();

canvas.setAttribute('tabindex', '0');
canvas.focus();

const params = new URLSearchParams(location.search);
const autoServer = params.get('server');
if (autoServer) {
    const addr = autoServer.startsWith('ws://') || autoServer.startsWith('wss://')
        ? autoServer : 'ws://' + autoServer;
    connectToServer(addr, 'Player');
}

requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(gameLoop);
});