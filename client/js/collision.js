class CollisionDetector {
    static rectRect(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    }

    static circleCircle(c1, c2) {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < c1.radius + c2.radius;
    }

    static pointRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    }

    static checkBulletPlayer(bullet, player) {
        const playerRadius = player.width / 2 * 0.7;
        const bulletRadius = bullet.radius || bullet.width / 2;
        const dx = bullet.x - (player.x + player.width / 2);
        const dy = bullet.y - (player.y + player.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < playerRadius + bulletRadius;
    }

    static checkPlayerPlayer(p1, p2) {
        const r1 = p1.width / 2 * 0.7;
        const r2 = p2.width / 2 * 0.7;
        const dx = (p1.x + p1.width / 2) - (p2.x + p2.width / 2);
        const dy = (p1.y + p1.height / 2) - (p2.y + p2.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < r1 + r2;
    }
}
