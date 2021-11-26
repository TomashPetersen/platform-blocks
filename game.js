const KEYS = {
  LEFT: 37,
  RIGHT: 39,
  SPACE: 32,
}

let game =  {
  ctx: null,
  running: true,
  platform: null,
  ball: null,
  blocks: [],
  rows: 4,
  cols: 8,
  score: 0,
  width: 640,
  height: 360,
  sprites: {
    background: null,
    ball: null,
    platform: null,
    block: null
  },

  sounds: {
    bump: null
  },
  
  init() {
    this.ctx = document.getElementById("mycanvas").getContext("2d");
    this.setTextFont();
    this.setEvents();
  },
  setTextFont() {
    this.ctx.font = "20px Arial";
    this.ctx.fillStyle = "#FFFFFF";
  },

  setEvents() {
    window.addEventListener("keydown", e => {
      
      if (e.keyCode === KEYS.SPACE) {
        game.platform.fire();
      }
      if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.RIGHT) {
        this.platform.start(e.keyCode);
      } 
    });

    window.addEventListener("keyup", e => {
      this.platform.stop();
    });
  },

  preload(callback) {
    let loaded = 0;
    let required = Object.keys(this.sprites).length;
        required += Object.keys(this.sounds).length;
    let onResourceLoad = () => {
      ++loaded;
      if (loaded >= required) {
        callback();
      }
    };

    this.preloadSprites(onResourceLoad);
    this.preloadAudio(onResourceLoad);
  },

  preloadSprites(onResourceLoad) {
    for (let key in this.sprites) {
      this.sprites[key] = new Image();
      this.sprites[key].src = `img/${key}.png`;
      this.sprites[key].addEventListener("load", onResourceLoad);
    }
  },

  preloadAudio(onResourceLoad) {
    for (let key in this.sounds) {
      this.sounds[key] = new Audio("sounds/" + key + ".mp3");
      this.sounds[key].addEventListener("canplaythrough", onResourceLoad, { once: true });
    }
  },

  renderBlocks() {
    for (let block of this.blocks) {
      if (block.active) {
        this.ctx.drawImage(this.sprites.block, block.x, block.y);
      }
    }
  },

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(this.sprites.background, 0, 0);
    this.ctx.drawImage(this.sprites.ball, this.ball.frame * 20, 0, this.ball.width, this.ball.height, this.ball.x, this.ball.y, this.ball.width, this.ball.height);
    this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
    this.renderBlocks ();
    this.ctx.fillText(`Score: ${this.score}`, 15, 20)
  },

  create() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.blocks.push({
          active: true,
          width: 60,
          height: 20,
          x: 64 * col + 65,
          y: 24 * row + 30,
        });
      }
    }
  },

  update() {
    this.collideBlocks();
    this.collidePlatform();
    this.ball.collideWorldBounds();
    this.platform.collideWorldBounds();
    this.platform.move();
    this.ball.move();
  },

  addScore() {
    ++this.score;

    if (this.score >= this.blocks.length) {
      this.end("You are win!");
    }
  },

  collideBlocks() {
    for (let block of this.blocks) {
      if (block.active && this.ball.collide(block)) {
          this.ball.bumpBlock(block);
          this.addScore();
          this.sounds.bump.play();
      }
    }
  },

  collidePlatform() {
    if (this.ball.collide(this.platform)) {
      this.ball.bumpPlatform(this.platform);
      this.sounds.bump.play();
    }
  },

  start() {
    this.init();
    this.preload(() => {
      this.create();
      this.run();
    });
  },

  end(message) {
    this.running = false;
    alert(message);
    window.location.reload();
  },

  run() {
    if (this.running) {
        window.requestAnimationFrame(() => {
          this.update();
          this.render();
          this.run();
        });
    }
  },

  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
};

game.ball = {
  x: 320,
  y: 280,
  width: 20,
  height: 20,
  frame: 0,
  velocity: 3,
  dy: 0,
  dx: 0,
  start() {
    this.dy = -this.velocity;
    this.dx = game.random(-this.velocity, this.velocity);
    this.animate();
  },
  animate() {
    setInterval(() => {
      ++this.frame;
      if (this.frame > 3) {
        this.frame = 0;
      }
    }, 100);
  },
  move() {
    if (this.dy) {
      this.y += this.dy;
    }
    if (this.dx) {
      this.x += this.dx;
    }
  }, 
  collideWorldBounds() {
    let x = this.x + this.dx;
    let y = this.y + this.dy;

    let ballLeftSide = x;
    let ballRightSide = ballLeftSide + this.width;
    let ballTopSide = y;
    let ballBottomSide = ballTopSide + this.height;

    let worldLeftSide = 0;
    let worldRightSide = game.width;
    let worldTopSide = 0;
    let worldBottomSide = game.height;

    if (ballLeftSide < worldLeftSide) {
      this.x = 0;
      this.dx = this.velocity;
      game.sounds.bump.play();
    } else if (ballRightSide > worldRightSide) {
      this.x = worldRightSide - this.width;
      this.dx = -this.velocity;
      game.sounds.bump.play();
    } else if (ballTopSide <  worldTopSide) {
      this.y = 0;
      this.dy = this.velocity;
      game.sounds.bump.play();
    } else if (ballBottomSide > worldBottomSide) {
      game.end("You are lose");
    }
  },
  collide(elem) {
    let x = this.x + this.dx;
    let y = this.y + this.dy;
    if (x + this.width > elem.x &&
        x < elem.x + elem.width &&
        y + this.height > elem.y &&
        y < elem.y + elem.height) {
          return true;
    }
    return false;
  },
  bumpBlock(block) {
    this.dy *= -1;
    block.active = false;
  },
  bumpPlatform(platform) {
    if (platform.dx) {
      this.x += platform.dx;
    }
    if (this.dy > 0) {
      this.dy = -this.velocity;
      let touchX = this.x + this.width / 2;
      this.dx = this.velocity * platform.getTouchOffset(touchX);
    }
  }
};

game.platform = {
  x: 280,
  y: 300,
  width: 100,
  height: 14,
  velocity: 6,
  dx: 0,
  ball: game.ball,
  fire() {  
    if (this.ball) {
      this.ball.start();
      this.ball = null;
    }
  },
  start(direction) {
    if (direction === KEYS.LEFT) {
      this.dx = - this.velocity;
    } else if (direction === KEYS.RIGHT) {
      this.dx = this.velocity;
    }
  },
  stop() {
    this.dx = 0;
  },
  move() {
    if (this.dx) {
      this.x += this.dx;
      if (this.ball) {
        this.ball.x += this.dx;
      }
    }
  },
  getTouchOffset(x) {
   let diff = (this.x + this.width) - x;
   let offset = this.width - diff;
   let res = 2 * offset / this.width;
    return res - 1;
  },
  collideWorldBounds() {
    let platformLeft = this.x + this.dx;
    let platformRight = platformLeft + this.width;
    let worldLeftSide = 0;
    let worldRightSide = game.width;
    if (platformLeft < worldLeftSide || platformRight > worldRightSide)  {
      this.dx = 0;
    }
  }
};

window.addEventListener("load", () => {
  game.start();
});
