window.onload = function() {
    const app = new PIXI.Application({ width: 800, height: 800, backgroundColor: 0x1099bb });
    document.getElementById('gameScreen').appendChild(app.view);

    const player = new PIXI.Graphics();
    player.beginFill(0xff0000);
    player.drawCircle(0, 0, 20);
    player.endFill();
    player.x = app.view.width / 2;
    player.y = app.view.height / 2;
    player.health = 100;
    app.stage.addChild(player);

    let playerDirection = 'left'; 
    let isGameOver = false;
    const keys = {};
    window.addEventListener("keydown", (e) => keys[e.code] = true);
    window.addEventListener("keyup", (e) => keys[e.code] = false);

    let exp = 0;
    let level = 1;
    let score = 0;

    const expToNextLevel = () => level * 10;

    function levelUp() {
        level++;
        exp = 0;
        showLevelUpMessage();
        updateUI(); 
    }

    function showLevelUpMessage() {
        const levelUpText = new PIXI.Text(`Уровень ${level}!`, {
            fontSize: 36,
            fill: 0xffffff,
            align: 'center'
        });
        levelUpText.x = app.view.width / 2 - levelUpText.width / 2;
        levelUpText.y = app.view.height / 2 - 50;
        app.stage.addChild(levelUpText);

        setTimeout(() => {
            app.stage.removeChild(levelUpText);
        }, 2000);
    }

    function showGameOver() {
        const gameOverText = new PIXI.Text("Ты проиграл, анскильный казуал!", {
            fontSize: 48,
            fill: 0xffffff,
            align: 'center'
        });
        gameOverText.x = app.view.width / 2 - gameOverText.width / 2;
        gameOverText.y = app.view.height / 2 - 100;
        app.stage.addChild(gameOverText);

        const scoreText = new PIXI.Text(`Очки: ${score}`, {
            fontSize: 36,
            fill: 0xffffff,
            align: 'center'
        });
        scoreText.x = app.view.width / 2 - scoreText.width / 2;
        scoreText.y = app.view.height / 2 + 50;
        app.stage.addChild(scoreText);

        const restartButton = new PIXI.Text("Нажмите для перезапуска", {
            fontSize: 36,
            fill: 0xffffff,
            align: 'center'
        });
        restartButton.x = app.view.width / 2 - restartButton.width / 2;
        restartButton.y = app.view.height / 2 + 150;
        restartButton.interactive = true;
        restartButton.buttonMode = true;
        restartButton.on('pointerdown', () => restartGame());

        app.stage.addChild(restartButton);
    }

    const healthBar = new PIXI.Graphics();
    healthBar.beginFill(0x00ff00);
    healthBar.drawRect(0, 0, 200, 20);
    healthBar.endFill();
    healthBar.x = 10;
    healthBar.y = 10;
    app.stage.addChild(healthBar);

    function updateHealthBar() {
        healthBar.width = (player.health / 100) * 200;
    }

    function updateUI() {
        document.getElementById('score').innerText = `Очки: ${score}`;
        document.getElementById('level').innerText = `Уровень: ${level}`;
        document.getElementById('health').innerText = `Здоровье: ${Math.round(player.health)}`;
    }

    app.ticker.add(() => {
        if (isGameOver) return;

        if (keys["ArrowUp"]) player.y = Math.max(0, player.y - 3);
        if (keys["ArrowDown"]) player.y = Math.min(app.view.height, player.y + 3);
        if (keys["ArrowLeft"]) {
            player.x = Math.max(0, player.x - 3);
            playerDirection = 'left'; 
        }
        if (keys["ArrowRight"]) {
            player.x = Math.min(app.view.width, player.x + 3);
            playerDirection = 'right'; 
        }

        if (exp >= expToNextLevel()) {
            levelUp();
        }

        updateHealthBar();
        updateUI(); 

        // Стрельба
        if (playerDirection === 'left') {
            shoot('left');
        } else if (playerDirection === 'right') {
            shoot('right');
        }
    });

    const bullets = [];
    let shootCooldown = 0; 

    function shoot(direction) {
        if (shootCooldown > 0) {
            shootCooldown--;
            return;
        }

        const bullet = new PIXI.Graphics();
        bullet.beginFill(0xffff00);
        bullet.drawRect(0, 0, 10, 3);
        bullet.endFill();
        bullet.x = player.x + (direction === 'left' ? -20 : 20); 
        bullet.y = player.y;
        bullet.direction = direction;
        bullets.push(bullet);
        app.stage.addChild(bullet);

        shootCooldown = 20; 
    }

    app.ticker.add(() => {
        if (isGameOver) return;

        // Двигаем пули
        bullets.forEach((bullet, index) => {
            if (bullet.direction === 'left') {
                bullet.x -= 5;
            } else {
                bullet.x += 5;
            }

            // Проверка на столкновение с врагом
            enemies.forEach((enemy, enemyIndex) => {
                const dist = Math.sqrt(Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2));
                if (dist < 15) { 
                    enemy.health -= 10; 
                    app.stage.removeChild(bullet);
                    bullets.splice(index, 1); 
                    if (enemy.health <= 0) {
                        app.stage.removeChild(enemy); 
                        enemies.splice(enemyIndex, 1); 
                        score += 10; 
                    }
                }
            });

            
            if (bullet.x < 0 || bullet.x > app.view.width) {
                app.stage.removeChild(bullet);
                bullets.splice(index, 1);
            }
        });
    });

    const enemies = [];
    let enemyStrength = 1;

    function spawnEnemy() {
        const enemy = new PIXI.Graphics();
        enemy.beginFill(0x00ff00);
        enemy.drawCircle(0, 0, 15);
        enemy.endFill();
        enemy.x = Math.random() * app.view.width;
        enemy.y = Math.random() * app.view.height;
        enemy.health = enemyStrength;
        enemies.push(enemy);
        app.stage.addChild(enemy);
    }

    app.ticker.add(() => {
        if (isGameOver) return;

        enemies.forEach(enemy => {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                enemy.x += (dx / dist) * 1.2;
                enemy.y += (dy / dist) * 1.2;
            }
            if (dist < 20) {
                player.health -= 0.1;
                if (player.health <= 0) {
                    isGameOver = true;
                    showGameOver();
                }
            }
        });
    });

    function restartGame() {
        
        location.reload();
    }

    
    setInterval(() => {
        spawnEnemy();

        
        if (score > 0 && score % 100 === 0) {
            enemyStrength++; 
            for (let i = 0; i < Math.floor(score / 100); i++) {
                spawnEnemy(); 
            }
        }
    }, 2000);
};
