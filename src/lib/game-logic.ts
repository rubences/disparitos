// --- CONFIG ---
export const INITIAL_LIVES = 3;
export const RESPAWN_TIME_MS = 2000;
const PLAYER_COLOR = 'hsl(231, 48%, 54%)'; // Primary
const OPPONENT_COLOR = 'hsl(4, 90%, 58%)'; // Red
const BOSS_COLOR = 'hsl(291, 64%, 42%)'; // Purple
const SHOT_COLOR_PLAYER = 'hsl(187, 100%, 42%)'; // Accent
const SHOT_COLOR_OPPONENT = 'hsl(53, 98%, 50%)'; // Yellow

// --- BASE CLASS ---
export class Entity {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    gameWidth: number;
    gameHeight: number;

    constructor(gameWidth: number, gameHeight: number, x: number, y: number, width: number, height: number, color: string) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    isCollidingWith(other: Entity): boolean {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }
}

// --- SHOT ---
export class Shot extends Entity {
    speed: number;

    constructor(gameWidth: number, gameHeight: number, x: number, y: number, speed: number, color: string) {
        super(gameWidth, gameHeight, x, y, 5, 15, color);
        this.speed = speed;
    }
    
    update() {
        this.y += this.speed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// --- CHARACTER ---
export class Character extends Entity {
    dead: boolean = false;
    speed: number;
    lastShot: number = 0;

    constructor(gameWidth: number, gameHeight: number, x: number, y: number, width: number, height: number, speed: number, color: string) {
        super(gameWidth, gameHeight, x, y, width, height, color);
        this.speed = speed;
    }

    collide() {
        this.dead = true;
    }
    
    drawAsStar(ctx: CanvasRenderingContext2D) {
        const spikes = 5;
        const outerRadius = this.width / 2;
        const innerRadius = this.width / 4;
        let rot = Math.PI / 2 * 3;
        let x = this.x + this.width / 2;
        let y = this.y + this.height / 2;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(x, y - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = this.x + this.width / 2 + Math.cos(rot) * outerRadius;
            y = this.y + this.height / 2 + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = this.x + this.width / 2 + Math.cos(rot) * innerRadius;
            y = this.y + this.height / 2 + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2 - outerRadius);
        ctx.closePath();
        ctx.lineWidth=2;
        ctx.strokeStyle=this.color;
        ctx.stroke();
        ctx.fillStyle=SHOT_COLOR_PLAYER;
        ctx.fill();
    }
}

// --- PLAYER ---
export class Player extends Character {
    lives: number;

    constructor(gameWidth: number, gameHeight: number) {
        const width = 50;
        const height = 50;
        super(gameWidth, gameHeight, gameWidth / 2 - width / 2, gameHeight - height - 10, width, height, 10, PLAYER_COLOR);
        this.lives = INITIAL_LIVES;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.dead) {
            this.drawAsStar(ctx);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    loseLife(): boolean { // Returns true if game over
        if(this.lives > 0) {
            this.lives--;
        }
        this.collide();
        return this.lives <= 0;
    }
    
    respawn() {
        this.dead = false;
        this.x = this.gameWidth / 2 - this.width / 2;
        this.y = this.gameHeight - this.height - 10;
    }
    
    shoot(): Shot {
      this.lastShot = Date.now();
      return new Shot(this.gameWidth, this.gameHeight, this.x + this.width / 2 - 2.5, this.y, -7, SHOT_COLOR_PLAYER);
    }
}

// --- OPPONENT ---
export class Opponent extends Character {
    direction: number = 1;

    constructor(gameWidth: number, gameHeight: number) {
        const width = 50;
        const height = 50;
        super(gameWidth, gameHeight, Math.random() * (gameWidth - width), 50, width, height, 2, OPPONENT_COLOR);
    }
    
    update() {
        this.x += this.speed * this.direction;
        if (this.x <= 0 || this.x + this.width >= this.gameWidth) {
            this.direction *= -1;
            this.y += 20;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.dead) {
            this.drawAsStar(ctx);
        } else {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    shoot(): Shot {
      this.lastShot = Date.now();
      return new Shot(this.gameWidth, this.gameHeight, this.x + this.width / 2 - 2.5, this.y + this.height, 5, SHOT_COLOR_OPPONENT);
    }
}


// --- BOSS ---
export class Boss extends Opponent {
    constructor(gameWidth: number, gameHeight: number) {
        super(gameWidth, gameHeight);
        this.speed *= 2; // double speed
        this.color = BOSS_COLOR;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.dead) {
            this.drawAsStar(ctx);
        } else {
            const numberOfSides = 5;
            const size = this.width / 2;
            const Xcenter = this.x + this.width / 2;
            const Ycenter = this.y + this.height / 2;
            ctx.beginPath();
            ctx.moveTo (Xcenter +  size * Math.cos(0), Ycenter +  size *  Math.sin(0));          
            for (let i = 1; i <= numberOfSides;i += 1) {
                ctx.lineTo (Xcenter + size * Math.cos(i * 2 * Math.PI / numberOfSides), Ycenter + size * Math.sin(i * 2 * Math.PI / numberOfSides));
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
}
