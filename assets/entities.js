// Create our Mixins namespace
Game.Mixins = {};

// Define our Moveable mixin
Game.Mixins.Moveable = {
    name: 'Moveable',
    tryMove: function(x, y, map) {
        var tile = map.getTile(x, y);
        var target = map.getEntityAt(x, y);
        //if entity occupies the position, can't move there
        if (target) {
            //if attacker, try to attack target
            if (this.hasMixin('Attacker')) {
                this.attack(target);
                return true;
            } else {
                //do nothing
                return false;
            }
        } else if (tile.isWalkable()) {
            // Update the entity's position
            this._x = x;
            this._y = y;
            return true;
            // Check if the tile is diggable, and
            // if so try to dig it
        } else { //if (tile.isDiggable()) {
            //map.dig(x, y);
            return false; //true;
        }
        //return false;
    }
}

Game.Mixins.Destructible = {
    name: 'Destructible',
    init: function() {
        this._hp = 1;
    },
    takeDamage: function(attacker, damage) {
        this._hp -= damage;
        //if 0 or less remove from game
        if (this._hp <= 0) {
            this.getMap().removeEntity(this);
        }
    }
}

Game.Mixins.SimpleAttacker = {
    name: 'SimpleAttacker',
    groupName: 'Attacker',
    attack: function(target) {
        //only remove entity if destructible
        if (target.hasMixin('Destructible')) {
            target.takeDamage(this, 1);
        }
    }
}

Game.Mixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function() {
        //re-render the screen
        Game.refresh();
        //lock engine until player completes turn (presses a key)
        this.getMap().getEngine().lock();
    }
}

Game.Mixins.PythonActor = {
    name: 'PythonActor',
    groupName: 'Actor',
    init: function() {
        this._growthsRemaining = 5;
    },
    act: function() {
        //check if python can grow
        if (this._growthsRemaining > 0) {
            if (Math.random() <= 0.02) {
                //generate an offset of -1, 0, or 1
                var xOffset = Math.floor(Math.random() * 3) - 1;
                var yOffset = Math.floor(Math.random() * 3) - 1;
                if (xOffset != 0 || yOffset != 0) {
                    //check if python can grow into that position
                    if (this.getMap().isEmptyFloor(this.getX() + xOffset,
                            this.getY() + yOffset)) {
                        var entity = new Game.Entity(Game.PythonTemplate);
                        entity.setX(this.getX() + xOffset);
                        entity.setY(this.getY() + yOffset);
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;
                    }
                }
            }
        }
    }
}

// Player template
Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    background: 'black',
    mixins: [Game.Mixins.Moveable, Game.Mixins.PlayerActor,
        Game.Mixins.SimpleAttacker, Game.Mixins.Destructible
    ]
}

//Python template
Game.PythonTemplate = {
    character: 'P',
    foreground: 'green',
    mixins: [Game.Mixins.PythonActor, Game.Mixins.Destructible]
}