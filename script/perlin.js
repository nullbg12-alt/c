const Perlin = {
    u: new Uint8Array(256),
    init() {
        for (let i = 0; i < 256; i++) this.u[i] = Math.floor(Math.random() * 256);
    },
    noise(x) {
        if (!this._seeded && this.u[0] === 0) this.init();
        let X = Math.floor(x) & 255;
        x -= Math.floor(x);
        let u = x * x * x * (x * (x * 6 - 15) + 10);
        return (this.u[X] * (1 - u) + this.u[(X + 1) & 255] * u) / 255;
    }
};

function noise2D(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const a = Perlin.noise(xi * 0.71 + yi * 17.13);
    const b = Perlin.noise((xi + 1) * 0.71 + yi * 17.13);
    const c = Perlin.noise(xi * 0.71 + (yi + 1) * 17.13);
    const d = Perlin.noise((xi + 1) * 0.71 + (yi + 1) * 17.13);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}(function () {
    const Perlin = {
        u: new Uint8Array(256),
        init() {
            for (let i = 0; i < 256; i++) this.u[i] = Math.floor(Math.random() * 256);
        },
        noise(x) {
            if (this.u[0] === 0) this.init();
            let X = Math.floor(x) & 255;
            x -= Math.floor(x);
            let u = x * x * x * (x * (x * 6 - 15) + 10);
            return (this.u[X] * (1 - u) + this.u[(X + 1) & 255] * u) / 255;
        }
    };

    function noise2D(x, y) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;

        const a = Perlin.noise(xi * 0.71 + yi * 17.13);
        const b = Perlin.noise((xi + 1) * 0.71 + yi * 17.13);
        const c = Perlin.noise(xi * 0.71 + (yi + 1) * 17.13);
        const d = Perlin.noise((xi + 1) * 0.71 + (yi + 1) * 17.13);

        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);
        return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    }

    window.PerlinNoise = { Perlin, noise2D };
})();