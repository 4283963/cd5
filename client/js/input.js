class InputHandler {
    constructor() {
        this.keys = {};
        this.keyPressed = {};
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keyPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    isDown(code) {
        return this.keys[code] === true;
    }

    wasPressed(code) {
        if (this.keyPressed[code]) {
            this.keyPressed[code] = false;
            return true;
        }
        return false;
    }

    getMovementVector() {
        let dx = 0;
        let dy = 0;

        if (this.isDown('ArrowUp') || this.isDown('KeyW')) dy -= 1;
        if (this.isDown('ArrowDown') || this.isDown('KeyS')) dy += 1;
        if (this.isDown('ArrowLeft') || this.isDown('KeyA')) dx -= 1;
        if (this.isDown('ArrowRight') || this.isDown('KeyD')) dx += 1;

        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        return { dx, dy };
    }

    isShooting() {
        return this.isDown('Space') || this.isDown('KeyJ');
    }

    isBoosting() {
        return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
    }

    clearFrame() {
        this.keyPressed = {};
    }
}
