function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
        t = (t + 0x6D2B79F5) >>> 0;
        let r = t;
        r = Math.imul(r ^ (r >>> 15), r | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function seedPerlin(seed) {
    const rng = mulberry32(seed >>> 0);
    for (let i = 0; i < 256; i++) {
        Perlin.u[i] = Math.floor(rng() * 256);
    }
    if (Perlin.u[0] === 0) Perlin.u[0] = 1;
    Perlin._seeded = true;
}