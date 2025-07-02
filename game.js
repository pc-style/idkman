// Initialize Kaboom
kaboom({
    canvas: document.querySelector("#game-canvas"),
    width: 800,
    height: 600,
    background: [135, 206, 235], // Sky blue
});

// Game state
let score = 0;
let gameSpeed = 100;
let isGameOver = false;

// Load simple pixel art style sprites using colored rectangles and text
loadSprite("cat", "data:image/svg+xml;base64," + btoa(`
<svg width="40" height="30" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="30" fill="#ff8c42" rx="5"/>
    <circle cx="10" cy="10" r="3" fill="#000"/>
    <circle cx="30" cy="10" r="3" fill="#000"/>
    <polygon points="5,5 10,0 15,5" fill="#ff8c42"/>
    <polygon points="25,5 30,0 35,5" fill="#ff8c42"/>
    <rect x="15" y="15" width="10" height="3" fill="#000" rx="1"/>
    <rect x="0" y="25" width="10" height="8" fill="#ff8c42"/>
    <rect x="30" y="25" width="10" height="8" fill="#ff8c42"/>
</svg>`));

loadSprite("fish", "data:image/svg+xml;base64," + btoa(`
<svg width="25" height="15" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="15" cy="7.5" rx="10" ry="6" fill="#4169E1"/>
    <polygon points="5,7.5 0,2 0,13" fill="#4169E1"/>
    <circle cx="20" cy="5" r="1.5" fill="#000"/>
    <rect x="17" y="1" width="6" height="2" fill="#FFD700"/>
    <rect x="17" y="12" width="6" height="2" fill="#FFD700"/>
</svg>`));

loadSprite("obstacle", "data:image/svg+xml;base64," + btoa(`
<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="15" r="15" fill="#8B4513"/>
    <circle cx="8" cy="10" r="2" fill="#000"/>
    <circle cx="22" cy="10" r="2" fill="#000"/>
    <ellipse cx="15" cy="18" rx="6" ry="3" fill="#000"/>
    <polygon points="10,5 15,0 20,5" fill="#8B4513"/>
    <polygon points="5,5 10,0 15,5" fill="#8B4513"/>
</svg>`));

// Scenes
scene("game", () => {
    // Reset game state
    score = 0;
    gameSpeed = 100;
    isGameOver = false;

    // Add background elements
    add([
        rect(width(), height()),
        color(135, 206, 235),
        pos(0, 0),
        "bg"
    ]);

    // Add ground
    add([
        rect(width(), 100),
        color(34, 139, 34),
        pos(0, height() - 100),
        area(),
        solid(),
        "ground"
    ]);

    // Add some clouds
    for (let i = 0; i < 5; i++) {
        add([
            circle(20 + rand(10)),
            color(255, 255, 255),
            pos(rand(width()), rand(200)),
            opacity(0.7),
            "cloud",
            {
                speed: rand(10, 30)
            }
        ]);
    }

    // Create the cat player
    const cat = add([
        sprite("cat"),
        pos(100, height() - 130),
        area(),
        body(),
        scale(1.5),
        "player",
        {
            speed: 200,
            jumpForce: 500,
            isGrounded: false
        }
    ]);

    // Score display
    const scoreLabel = add([
        text("Score: 0", { size: 24 }),
        pos(20, 20),
        color(255, 255, 255),
        outline(2, [0, 0, 0]),
    ]);

    // Speed display
    const speedLabel = add([
        text("Speed: 100", { size: 16 }),
        pos(20, 50),
        color(255, 255, 255),
        outline(2, [0, 0, 0]),
    ]);

    // Player controls
    onKeyDown("left", () => {
        if (!isGameOver && cat.pos.x > 0) {
            cat.move(-cat.speed, 0);
        }
    });

    onKeyDown("right", () => {
        if (!isGameOver && cat.pos.x < width() - 60) {
            cat.move(cat.speed, 0);
        }
    });

    onKeyPress("space", () => {
        if (!isGameOver && cat.isGrounded) {
            cat.jump(cat.jumpForce);
            cat.isGrounded = false;
        }
    });

    // Check if cat is on ground
    cat.onCollide("ground", () => {
        cat.isGrounded = true;
    });

    // Fish spawning
    onUpdate(() => {
        if (!isGameOver && rand() < 0.02) {
            add([
                sprite("fish"),
                pos(width(), rand(100, height() - 200)),
                area(),
                move(LEFT, gameSpeed),
                "fish",
                scale(1.2),
                {
                    collected: false
                }
            ]);
        }
    });

    // Obstacle spawning
    onUpdate(() => {
        if (!isGameOver && rand() < 0.008) {
            add([
                sprite("obstacle"),
                pos(width(), height() - 130),
                area(),
                move(LEFT, gameSpeed),
                "obstacle",
                scale(1.2)
            ]);
        }
    });

    // Move clouds
    onUpdate("cloud", (cloud) => {
        cloud.move(-cloud.speed, 0);
        if (cloud.pos.x < -50) {
            cloud.pos.x = width() + 50;
            cloud.pos.y = rand(200);
        }
    });

    // Fish collection
    cat.onCollide("fish", (fish) => {
        if (!fish.collected) {
            fish.collected = true;
            destroy(fish);
            score += 10;
            scoreLabel.text = `Score: ${score}`;
            
            // Increase game speed every 50 points
            if (score % 50 === 0) {
                gameSpeed += 20;
                speedLabel.text = `Speed: ${gameSpeed}`;
            }

            // Add sparkle effect
            add([
                text("★", { size: 20 }),
                pos(fish.pos.x, fish.pos.y),
                color(255, 215, 0),
                lifespan(0.5),
                move(UP, 50)
            ]);
        }
    });

    // Obstacle collision (game over)
    cat.onCollide("obstacle", () => {
        if (!isGameOver) {
            isGameOver = true;
            
            // Add explosion effect
            add([
                text("💥", { size: 40 }),
                pos(cat.pos.x, cat.pos.y),
                lifespan(1),
                scale(2)
            ]);

            // Game over overlay
            add([
                rect(width(), height()),
                color(0, 0, 0),
                opacity(0.7),
                pos(0, 0),
                "gameOverBg"
            ]);

            add([
                text("GAME OVER!", { size: 48 }),
                pos(width() / 2, height() / 2 - 60),
                anchor("center"),
                color(255, 100, 100),
                outline(3, [0, 0, 0]),
            ]);

            add([
                text(`Final Score: ${score}`, { size: 32 }),
                pos(width() / 2, height() / 2),
                anchor("center"),
                color(255, 255, 255),
                outline(2, [0, 0, 0]),
            ]);

            add([
                text("Press ENTER to restart", { size: 20 }),
                pos(width() / 2, height() / 2 + 60),
                anchor("center"),
                color(255, 255, 0),
                outline(1, [0, 0, 0]),
            ]);

            // Restart on Enter
            const restart = onKeyPress("enter", () => {
                go("game");
                restart.cancel();
            });
        }
    });

    // Clean up off-screen objects
    onUpdate("fish", (fish) => {
        if (fish.pos.x < -50) {
            destroy(fish);
        }
    });

    onUpdate("obstacle", (obstacle) => {
        if (obstacle.pos.x < -50) {
            destroy(obstacle);
        }
    });

    // Add some particle effects
    onUpdate(() => {
        if (!isGameOver && rand() < 0.1) {
            add([
                rect(2, 2),
                pos(rand(width()), height() - 100),
                color(255, 255, 255),
                lifespan(2),
                move(UP, rand(20, 40)),
                opacity(0.6),
                "particle"
            ]);
        }
    });
});

// Start screen
scene("start", () => {
    add([
        text("🐱 CAT FISH RUSH 🐟", { size: 48 }),
        pos(width() / 2, height() / 2 - 100),
        anchor("center"),
        color(255, 100, 150),
        outline(3, [0, 0, 0]),
    ]);

    add([
        text("Help the cute cat collect fish!", { size: 24 }),
        pos(width() / 2, height() / 2 - 40),
        anchor("center"),
        color(255, 255, 255),
        outline(2, [0, 0, 0]),
    ]);

    add([
        text("• Arrow Keys: Move", { size: 18 }),
        pos(width() / 2, height() / 2 + 20),
        anchor("center"),
        color(255, 255, 255),
    ]);

    add([
        text("• Spacebar: Jump", { size: 18 }),
        pos(width() / 2, height() / 2 + 45),
        anchor("center"),
        color(255, 255, 255),
    ]);

    add([
        text("• Avoid the brown obstacles!", { size: 18 }),
        pos(width() / 2, height() / 2 + 70),
        anchor("center"),
        color(255, 100, 100),
    ]);

    add([
        text("Press ENTER to start!", { size: 28 }),
        pos(width() / 2, height() / 2 + 120),
        anchor("center"),
        color(255, 255, 0),
        outline(2, [0, 0, 0]),
    ]);

    // Add animated elements
    add([
        text("🐟", { size: 30 }),
        pos(100, 200),
        scale(1),
        rotate(0),
        "fishIcon"
    ]);

    add([
        text("🐟", { size: 25 }),
        pos(700, 300),
        scale(1),
        rotate(0),
        "fishIcon"
    ]);

    // Animate fish icons
    onUpdate("fishIcon", (fish) => {
        fish.angle += 50 * dt();
        fish.scale = wave(0.8, 1.2, time() * 2);
    });

    onKeyPress("enter", () => {
        go("game");
    });
});

// Start the game
go("start");