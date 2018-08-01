Game.Tile = function(properties) {
    properties = properties || {};
    // Call the Glyph constructor 
    Game.Glyph.call(this, properties);
    // Set properties
    this._walkable = properties['walkable'] || false;
    this._blocksLight = (properties['blocksLight'] !== undefined) ? properties['blocksLight'] : true;
};
// tiles inherit from glyph
Game.Tile.extend(Game.Glyph);

Game.Tile.prototype.isWalkable = function() {
    return this._walkable;
};

Game.Tile.prototype.isBlockingLight = function() {
    return this._blocksLight;
};

Game.getNeighborPositions = function(x, y) {
    var tiles = [];
    //generate all 8 offsets
    for (let dX = -1; dX < 2; dX++) {
        for (let dY = -1; dY < 2; dY++) {
            if (dX == 0 && dY == 0) {
                continue;
            }
            tiles.push({ x: x + dX, y: y + dY });
        }
    }
    return tiles.randomize(); //so top left isn't favored
};

Game.Tile.nullTile = new Game.Tile({});

Game.Tile.floorTile = new Game.Tile({
    character: '.',
    walkable: true,
    blocksLight: false
});

Game.Tile.wallTile = new Game.Tile({
    character: '#',
    foreground: 'goldenrod'
});

Game.Tile.stairsUpTile = new Game.Tile({
    character: '<',
    foreground: 'white',
    walkable: true,
    blocksLight: false
});

Game.Tile.stairsDownTile = new Game.Tile({
    character: '>',
    foreground: 'white',
    walkable: true,
    blocksLight: false
});