Game.Entity = function(properties) {
    properties = properties || {};
    // Call glyph constructor
    Game.Glyph.call(this, properties);
    // Instantiate entity properties
    this._name = properties['name'] || '';
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._z = properties['z'] || 0;
    this._map = null;
    // This object tracks the mixins belonging to the entity
    this._attachedMixins = {};
    // This object tracks the mixin groups
    this._attachedMixinGroups = {};
    // Contains the entity's mixins
    var mixins = properties['mixins'] || [];
    for (var i = 0; i < mixins.length; i++) {
        // Copy over all properties from each mixin as long
        // as it's not the name or the init property.
        // also make sure not to override a property that
        // already exists on the entity.
        for (var key in mixins[i]) {
            if (key != 'init' && key != 'name' && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        // Add the name of this mixin to the attached mixins
        this._attachedMixins[mixins[i].name] = true;
        //if group name exists, add it
        if (mixins[i].groupName) {
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }
        // Call the init function if it exists
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};
// Make entities inherit all the functionality from glyphs
Game.Entity.extend(Game.Glyph);

Game.Entity.prototype.hasMixin = function(obj) {
    // Allow passing the mixin itself or the name as a string
    if (typeof obj === 'object') {
        return this._attachedMixins[obj.name];
    } else {
        return this._attachedMixins[obj] || this._attachedMixinGroups[obj];
    }
};

Game.Entity.prototype.setName = function(name) {
    this._name = name;
};

Game.Entity.prototype.setX = function(x) {
    this._x = x;
};

Game.Entity.prototype.setY = function(y) {
    this._y = y;
};

Game.Entity.prototype.setZ = function(z) {
    this._z = z;
};

Game.Entity.prototype.setMap = function(map) {
    this._map = map;
};

Game.Entity.prototype.setPosition = function(x, y, z) {
    var oldX = this._x;
    var oldY = this._y;
    var oldZ = this._z;
    //update position
    this._x = x;
    this._y = y;
    this._z = z;
    //if entity on map, notify that entity has moved
    if (this._map) {
        this._map.updateEntityPosition(this, oldX, oldY, oldZ);
    }
};

Game.Entity.prototype.getName = function() {
    return this._name;
};

Game.Entity.prototype.getX = function() {
    return this._x;
};

Game.Entity.prototype.getY = function() {
    return this._y;
};

Game.Entity.prototype.getZ = function() {
    return this._z;
};

Game.Entity.prototype.getMap = function() {
    return this._map;
};

Game.Entity.prototype.tryMove = function(x, y, z, map) {
    var map = this.getMap();
    //use starting depth
    var tile = map.getTile(x, y, this.getZ());
    var target = map.getEntityAt(x, y, this.getZ());
    //check if on stairs
    if (z < this.getZ()) {
        if (tile != Game.Tile.stairsUpTile) {
            Game.sendMessage(this, "You can't go up there!");
        } else {
            this.setPosition(x, y, z);
            Game.sendMessage(this, "You go up to level %d", [z + 1]);
        }
    } else if (z > this.getZ()) {
        if (tile != Game.Tile.stairDownTile) {
            Game.sendMessage(this, "You can't go down there!");
        } else {
            this.setPosition(x, y, z);
            Game.sendMessage(this, "You go down to level %d", [z + 1]);
        }
    } else if (target) {
        //if attacker try to attack target
        if (this.hasMixin('Attacker') &&
            (this.hasMixin(Game.Mixins.PlayerActor) ||
                target.hasMixin(Game.Mixins.PlayerActor))) {
            this.attack(target);
            return true;
        }
        //do nothing
        return false;
    } else if (tile.isWalkable()) {
        //update position
        this.setPosition(x, y, z);
        //notify if items at this position
        var items = this.getMap().getItemsAt(x, y, z);
        if (items) {
            if (items.length === 1) {
                Game.sendMessage(this, "You see %s.", [items[0].describeA()]);
            } else {
                Game.sendMessage(this, "There are several items here!");
            }
        }
        return true;
    }
    return false;
};