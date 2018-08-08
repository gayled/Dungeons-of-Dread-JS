Game.Map = function(tiles, player) {
    this._tiles = tiles;
    this._depth = tiles.length;
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    //set up field of vision
    this._fov = [];
    this.setupFov();
    //object (hash table} to hold entities
    this._entities = {};
    //create table to hold items
    this._items = {};
    //create the ROT engine and scheduler
    this._scheduler = new ROT.Scheduler.Simple();
    this._engine = new ROT.Engine(this._scheduler);
    //add the player
    this.addEntityAtRandomPosition(player, 0);
    //add random entities at each depth
    for (let z = 0; z < this._depth; z++) {
        for (let i = 0; i < 15; i++) {
            //randomly select entities
            this.addEntityAtRandomPosition(Game.EntityRepository.createRandom(), z);
        }
        for (let i = 0; i < 10; i++) {
            //randomly select items
            this.addItemAtRandomPosition(Game.ItemRepository.createRandom(), z);
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
    return this._entities[x + ',' + y + ',' + z];
};

Game.Map.prototype.addEntity = function(entity) {
    //update map
    entity.setMap(this);
    //add entity to entity array
    this.updateEntityPosition(entity);
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
    //if entity exists, remove from map
    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this._entities[key] == entity) {
        delete this._entities[key];
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
    for (var key in this._entities) {
        var entity = this._entities[key];
        if (entity.getX() >= leftX && entity.getX() <= rightX &&
            entity.getY() >= topY && entity.getY() <= bottomY &&
            entity.getZ() == centerZ) {
            results.push(entity);
        }
    }
    return results;
};

Game.Map.prototype.updateEntityPosition = function(entity, oldX, oldY, oldZ) {
    if (typeof(oldX) !== 'undefined') {
        //delete old positions of the entity
        var oldKey = oldX + ',' + oldY + ',' + oldZ;
        if (this._entities[oldKey] == entity) {
            delete this._entities[oldKey];
        }
    }
    //check if inbounds
    if (entity.getX() < 0 || entity.getX() >= this._width ||
        entity.getY() < 0 || entity.getY() >= this._height ||
        entity.getZ() < 0 || entity.getZ() >= this._depth) {
        throw new Error('Entity\'s position is out of bounds');
    }
    //verify no entity at new position
    var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this._entities[key]) {
        throw new Error('Postion is occupied');
    }
    //Add entity to hash table
    this._entities[key] = entity;
};

Game.Map.prototype.getItemsAt = function(x, y, z) {
    return this._items[x + ',' + y + ',' + z];
};

Game.Map.prototype.setItemsAt = function(x, y, z, items) {
    var key = x + ',' + y + ',' + z;
    if (items.length === 0) {
        if (this._items[key]) {
            delete this._items[key];
        }
    } else {
        //update items at that key
        this._items[key] = items;
    }
};

Game.Map.prototype.addItem = function(x, y, z, item) {
    //if already items add to list
    var key = x + ',' + y + ',' + z;
    if (this._items[key]) {
        this._items[key].push(item);
    } else {
        this._items[key] = [item];
    }
};

Game.Map.prototype.addItemAtRandomPosition = function(item, z) {
    var position = this.getRandomFloorPosition(z);
    this.addItem(position.x, position.y, position.z, item);
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