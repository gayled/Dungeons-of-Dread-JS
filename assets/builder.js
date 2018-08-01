Game.Builder = function(width, height, depth) {
    this._width = width;
    this._height = height;
    this._depth = depth;
    this._tiles = new Array(depth);
    this._regions = new Array(depth);
    // allocate a 3d map
    for (var z = 0; z < depth; z++) {
        // Create a dungeon at each level
        this._tiles[z] = this._generateLevel();
        // Setup the regions array for each depth
        this._regions[z] = new Array(width);
        for (var x = 0; x < width; x++) {
            this._regions[z][x] = new Array(height);
            // initialize with zeroes
            for (var y = 0; y < height; y++) {
                this._regions[z][x][y] = 0;
            }
        }
    }
    for (var z = 0; z < this._depth; z++) {
        this._setupRegions(z);
    }
    this._connectAllRegions();
};

Game.Builder.prototype.getTiles = function() {
    return this._tiles;
};
Game.Builder.prototype.getDepth = function() {
    return this._depth;
};
Game.Builder.prototype.getWidth = function() {
    return this._width;
};
Game.Builder.prototype.getHeight = function() {
    return this._height;
};

Game.Builder.prototype._generateLevel = function() {
    // Create empty map
    var map = new Array(this._width);
    for (var w = 0; w < this._width; w++) {
        map[w] = new Array(this._height);
    }
    // generate the dungeon
    var generator = new ROT.Map.Uniform(this._width, this._height, { timeLimit: 5000 });

    generator.create(function(x, y, v) {
        if (v === 0) {
            map[x][y] = Game.Tile.floorTile;
        } else {
            map[x][y] = Game.Tile.wallTile;
        }
    });
    return map;
};

Game.Builder.prototype._canFillRegion = function(x, y, z) {
    // check tile in bounds
    if (x < 0 || y < 0 || z < 0 || x >= this._width ||
        y >= this._height || z >= this._depth) {
        return false;
    }
    // check tile isn't in region
    if (this._regions[z][x][y] != 0) {
        return false;
    }
    // check tile walkable
    return this._tiles[z][x][y].isWalkable();
};

Game.Builder.prototype._fillRegion = function(region, x, y, z) {
    var tilesFilled = 1;
    var tiles = [{ x: x, y: y }];
    var tile;
    var neighbors;
    // Update the region of the original tile
    this._regions[z][x][y] = region;
    // Keep looping while we still have tiles to process
    while (tiles.length > 0) {
        tile = tiles.pop();
        // Get tile neighbors 
        neighbors = Game.getNeighborPositions(tile.x, tile.y);
        // check that neighbors can fill the region, if so, add them to region
        while (neighbors.length > 0) {
            tile = neighbors.pop();
            if (this._canFillRegion(tile.x, tile.y, z)) {
                this._regions[z][tile.x][tile.y] = region;
                tiles.push(tile);
                tilesFilled++;
            }
        }

    }
    return tilesFilled;
};

Game.Builder.prototype._removeRegion = function(region, z) {
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._regions[z][x][y] == region) {
                // Clear the region and set to wall tiles
                this._regions[z][x][y] = 0;
                this._tiles[z][x][y] = Game.Tile.wallTile;
            }
        }
    }
};


Game.Builder.prototype._setupRegions = function(z) {
    // creates regions for each dungeon level
    var region = 1;
    var tilesFilled;
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._canFillRegion(x, y, z)) {
                // Try to fill
                tilesFilled = this._fillRegion(region, x, y, z);
                // If  too small, remove it
                if (tilesFilled <= 20) {
                    this._removeRegion(region, z);
                } else {
                    region++;
                }
            }
        }
    }
};

Game.Builder.prototype._findRegionOverlaps = function(z, r1, r2) {
    var matches = [];
    // fill matches with floor tiles in adjacent depths that overlap
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._tiles[z][x][y] == Game.Tile.floorTile &&
                this._tiles[z + 1][x][y] == Game.Tile.floorTile &&
                this._regions[z][x][y] == r1 &&
                this._regions[z + 1][x][y] == r2) {
                matches.push({ x: x, y: y });
            }
        }
    }
    // randomize to eliminate bias
    return matches.randomize();
};


Game.Builder.prototype._connectRegions = function(z, r1, r2) {
    var overlap = this._findRegionOverlaps(z, r1, r2);
    // Make sure there was overlap
    if (overlap.length == 0) {
        return false;
    }
    // Select the first tile from the overlap and change it to stairs
    var point = overlap[0];
    this._tiles[z][point.x][point.y] = Game.Tile.stairsDownTile;
    this._tiles[z + 1][point.x][point.y] = Game.Tile.stairsUpTile;
    return true;
};

Game.Builder.prototype._connectAllRegions = function() {
    for (var z = 0; z < this._depth - 1; z++) {
        // connect any floor tiles in adjacent depths that aren't already connected
        var connected = {};
        var key;
        for (var x = 0; x < this._width; x++) {
            for (var y = 0; y < this._height; y++) {
                key = this._regions[z][x][y] + ',' +
                    this._regions[z + 1][x][y];
                if (this._tiles[z][x][y] == Game.Tile.floorTile &&
                    this._tiles[z + 1][x][y] == Game.Tile.floorTile &&
                    !connected[key]) {
                    this._connectRegions(z, this._regions[z][x][y],
                        this._regions[z + 1][x][y]);
                    connected[key] = true;
                }
            }
        }
    }
};