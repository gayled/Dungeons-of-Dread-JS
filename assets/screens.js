Game.Screen = {};

// Define start screen
Game.Screen.startScreen = {
    enter: function() { console.log("Entered start screen."); },
    exit: function() { console.log("Exited start screen."); },
    render: function(display) {
        // Render our prompt to the screen
        display.drawText(1, 1, "%c{yellow}Javascript Roguelike");
        display.drawText(1, 2, "Press [Enter] to start!");
    },
    handleInput: function(inputType, inputData) {
        // When [Enter] is pressed, go to the play screen
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.playScreen);
            }
        }
    }
};

// Define play screen
Game.Screen.playScreen = {
    _map: null,
    _player: null,
    enter: function() {
        //var map = [];
        // map dimensions
        var width = 100;
        var height = 48;
        var depth = 3;
        //create map
        var tiles = new Game.Builder(width, height, depth).getTiles();

        /*for (let x = 0; x < mapWidth; x++) {
            // Create the nested array for the y values
            map.push([]);
            // initialize with null tiles
            for (let y = 0; y < mapHeight; y++) {
                map[x].push(Game.Tile.nullTile);
            }
        }
         Generate map with floor and wall tiles
        var generator = new ROT.Map.Uniform(mapWidth, mapHeight, { timeLimit: 5000 });

        generator.create(function(x, y, v) {
            if (v === 0) {
                map[x][y] = Game.Tile.floorTile;
            } else {
                map[x][y] = Game.Tile.wallTile;
            }
        });
        */
        // Create player and start game engine
        this._player = new Game.Entity(Game.PlayerTemplate);
        // Create our map from the tiles
        this._map = new Game.Map(tiles, this._player);
        this._map.getEngine().start();
    },
    exit: function() { console.log("Exited play screen."); },
    render: function(display) {
        var screenWidth = Game.getScreenWidth();
        var screenHeight = Game.getScreenHeight();
        // Make sure the x-axis doesn't go to the left of the left bound
        var topLeftX = Math.max(0, this._player.getX() - (screenWidth / 2));
        // Make there's enough space to fit the game screen
        topLeftX = Math.min(topLeftX, this._map.getWidth() - screenWidth);
        // Make sure the y-axis doesn't go above the top bound
        var topLeftY = Math.max(0, this._player.getY() - (screenHeight / 2));
        // Make sure there's enough space to fit the game screen
        topLeftY = Math.min(topLeftY, this._map.getHeight() - screenHeight);
        // Iterate through all visible map cells
        for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
            for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
                // Fetch tile glyphs and render at the offset position
                var tile = this._map.getTile(x, y, this._player.getZ());
                display.draw(
                    x - topLeftX,
                    y - topLeftY,
                    tile.getChar(),
                    tile.getForeground(),
                    tile.getBackground());
            }
        }
        // Render game entities
        var entities = this._map.getEntities();
        for (let i = 0; i < entities.length; i++) {
            var entity = entities[i];
            //render only if entity is on screen
            if (entity.getX() >= topLeftX && entity.getY() >= topLeftY &&
                entity.getX() < topLeftX + screenWidth && entity.getY() < topLeftY + screenHeight &&
                entity.getZ() == this._player.getZ()) {
                display.draw(
                    entity.getX() - topLeftX,
                    entity.getY() - topLeftY,
                    entity.getChar(),
                    entity.getForeground(),
                    entity.getBackground()
                );
            }
        }
        //get messages in player queue and render 
        var messages = this._player.getMessages();
        var messageY = 0;
        for (let i = 0; i < messages.length; i++) {
            //draw message text at top left of screen
            messageY += display.drawText(
                0,
                messageY,
                '%c{white}%b{black}' + messages[i]
            );
        }
        //render player stats at bottom left of screen
        var stats = '%c{white}%b{black}';
        stats += vsprintf('Health: %d/%d', [this._player.getHp(), this._player.getMaxHp()]);
        display.drawText(0, screenHeight, stats);
    },
    handleInput: function(inputType, inputData) {
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.winScreen);
            } else if (inputData.keyCode === ROT.VK_ESCAPE) {
                Game.switchScreen(Game.Screen.loseScreen);
            } else {
                // determine direction of player move from user input
                if (inputData.keyCode === ROT.VK_LEFT) {
                    this.move(-1, 0, 0);
                } else if (inputData.keyCode === ROT.VK_RIGHT) {
                    this.move(1, 0, 0);
                } else if (inputData.keyCode === ROT.VK_UP) {
                    this.move(0, -1, 0);
                } else if (inputData.keyCode === ROT.VK_DOWN) {
                    this.move(0, 1, 0);
                }
                //unlock engine
                this._map.getEngine().unlock();
            }
        } else if (inputType === 'keypress') {
            var keyChar = String.fromCharCode(inputData.charCode);
            if (keyChar === '>') {
                this.move(0, 0, 1);
            } else if (keyChar === '<') {
                this.move(0, 0, -1);
            } else {
                //invalid key
                return;
            }
            //unlock engine
            this._map.getEngine().unlock();
        }
    },
    move: function(dX, dY, dZ) {
        var newX = this._player.getX() + dX;
        var newY = this._player.getY() + dY;
        var newZ = this._player.getZ() + dZ;
        // test if move is feasible
        this._player.tryMove(newX, newY, newZ, this._map);
    }
};

// win screen
Game.Screen.winScreen = {
    enter: function() { console.log("Entered win screen."); },
    exit: function() { console.log("Exited win screen."); },
    render: function(display) {
        // Render our prompt to the screen
        for (var i = 0; i < 22; i++) {
            // Generate random background colors
            var r = Math.round(Math.random() * 255);
            var g = Math.round(Math.random() * 255);
            var b = Math.round(Math.random() * 255);
            var background = ROT.Color.toRGB([r, g, b]);
            display.drawText(2, i + 1, "%b{" + background + "}You win!");
        }
    },
    handleInput: function(inputType, inputData) {

    }
};

// lose screen
Game.Screen.loseScreen = {
    enter: function() { console.log("Entered lose screen."); },
    exit: function() { console.log("Exited lose screen."); },
    render: function(display) {
        // Render our prompt to the screen
        for (var i = 0; i < 22; i++) {
            display.drawText(2, i + 1, "%b{red}You lose! :(");
        }
    },
    handleInput: function(inputType, inputData) {

    }
};