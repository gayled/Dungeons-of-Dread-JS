Game.Map = function(tiles, player) {
    this._tiles = tiles;
    this._depth = tiles.length;
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    //set up field of vision
    this._fov = [];
    this.setupFov();
    //array to hold entities
    this._entities = [];
    //create the ROT engine and scheduler
    this._scheduler = new ROT.Scheduler.Simple();
    this._engine = new ROT.Engine(this._scheduler);
    //add the player
    this.addEntityAtRandomPosition(player, 0);
    //add some pythons
    for (let z = 0; z < this._depth; z++) {
        for (let i = 0; i < 25; i++) {
            this.addEntityAtRandomPosition(new Game.Entity(Game.PythonTemplate), z);
        }
    }
    //holds part of map that's been explored
    this._explored = new Array(this._depth);
    this._setupExploredArray();
};

Game.Map.prototype.getWidth = function() {
    return this._width;
};

Game.Map.prototype.getHeight = function() {
    return this._height;
};

Game.Map.prototype.getDepth = function() {
    return this._depth;
};

// Gets the tile for given coordinates
Game.Map.prototype.getTile = function(x, y, z) {
    // if not in bounds return nullTile
    if (x < 0 || x >= this._width || y < 0 || y >= this._height ||
        z < 0 || z >= this._depth) {
        return Game.Tile.nullTile;
    } else {
        return this._tiles[z][x][y] || Game.Tile.nullTile;
    }
};

Game.Map.prototype.isEmptyFloor = function(x, y, z) {
    // Check if the tile is floor and also has no entity
    return this.getTile(x, y, z) == Game.Tile.floorTile &&
        !this.getEntityAt(x, y, z);
};

Game.Map.prototype.getRandomFloorPosition = function(z) {
    // Randomly generate a tile which is a floor
    var x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._height);
    } while (!this.isEmptyFloor(x, y, z));
    return { x: x, y: y, z: z };
};

Game.Map.prototype.getEngine = function() {
    return this._engine;
};

Game.Map.prototype.getEntities = function() {
    return this._entities;
};

//iterates through all entities to find if one matches position
Game.Map.prototype.getEntityAt = function(x, y, z) {
    for (let i = 0; i < this._entities.length; i++) {
        if (this._entities[i].getX() == x && this._entities[i].getY() == y &&
            this._entities[i].getZ() == z) {
            return this._entities[i];
        }
    }
    return false;
};

Game.Map.prototype.addEntity = function(entity) {
    //ascertain that entity's position is within bounds
    if (entity.getX() < 0 || entity.getX() >= this._width ||
        entity.getY() < 0 || entity.getY() >= this._height ||
        entity.getZ() < 0 || entity.getZ() >= this._depth) {
        throw new Error('Adding entity out of bounds');
    }
    //update map
    entity.setMap(this);
    //add entity to entity array
    this._entities.push(entity);
    //if entity is an actor add to scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.add(entity, true);
    }
};

Game.Map.prototype.addEntityAtRandomPosition = function(entity, z) {
    var position = this.getRandomFloorPosition(z);
    entity.setX(position.x);
    entity.setY(position.y);
    entity.setZ(position.z);
    this.addEntity(entity);
};

Game.Map.prototype.removeEntity = function(entity) {
    //if entity exists, find in list of entities and remove
    for (let i = 0; i < this._entities.length; i++) {
        if (this._entities[i] == entity) {
            this._entities.splice(i, 1);
            break;
        }
    }
    //if actor, remove from scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.remove(entity);
    }
};

Game.Map.prototype.getEntitiesWithinRadius = function(centerX, centerY, centerZ, radius) {
    results = [];
    //determine bounds for where entity can be found
    var leftX = centerX - radius;
    var rightX = centerX + radius;
    var topY = centerY - radius;
    var bottomY = centerY + radius;
    //iterate through entities adding to array those within these bounds
    for (let i = 0; i < this._entities.length; i++) {
        if (this._entities[i].getX() >= leftX && this._entities[i].getX() <= rightX &&
            this._entities[i].getY() >= topY && this._entities[i].getY() <= bottomY &&
            this._entities[i].getZ() == centerZ) {
            results.push(this._entities[i]);
        }
    }
    return results;
};

Game.Map.prototype.setupFov = function() {
    // so dno't lose this
    var map = this;
    // set up FOV at each depth
    for (var z = 0; z < this._depth; z++) {
        // use iife to prevent hoisting out of loop
        (function() {
            // callback ensures tile isn't blocking light
            var depth = z;
            map._fov.push(
                new ROT.FOV.DiscreteShadowcasting(function(x, y) {
                    return !map.getTile(x, y, depth).isBlockingLight();
                }, { topology: 4 })); //FOV is triangular
        })();
    }
};

Game.Map.prototype.getFov = function(depth) {
    return this._fov[depth];
};

Game.Map.prototype._setupExploredArray = function() {
    for (let z = 0; z < this._depth; z++) {
        this._explored[z] = new Array(this._width);
        for (let x = 0; x < this._width; x++) {
            this._explored[z][x] = new Array(this._height);
            for (let y = 0; y < this._height; y++) {
                this._explored[z][x][y] = false;
            }
        }
    }
};

//updates the explored state for a given tile
Game.Map.prototype.setExplored = function(x, y, z, state) {
    //only return if within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        return this._explored[z][x][y] = state;
    }
};

//checks if explored
Game.Map.prototype.isExplored = function(x, y, z) {
    //only return if within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        return this._explored[z][x][y];
    } else {
        return false;
    }
};