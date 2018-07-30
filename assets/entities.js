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
                }
                return false; //else { //if (tile.isDiggable()) {
                //map.dig(x, y);
                //return false; //true;
            }
            //return false;
    }
    //}

Game.Mixins.Destructible = {
    name: 'Destructible',
    init: function(template) {
        //use health in template if exists
        this._maxHp = template['maxHp'] || 10;
        this._hp = template['hp'] || this._maxHp;
        this._defenseValue = template['defenseValue'] || 0;
    },
    getHp: function() {
        return this._hp;
    },
    getMaxHp: function() {
        return this._maxHp;
    },
    getDefenseValue: function() {
        return this._defenseValue;
    },
    takeDamage: function(attacker, damage) {
        this._hp -= damage;
        //if 0 or less remove from game
        if (this._hp <= 0) {
            Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
            Game.sendMessage(this, 'You die!');
            this.getMap().removeEntity(this);
        }
    }
}

Game.Mixins.Attacker = {
    name: 'Attacker',
    groupName: 'Attacker',
    init: function(template) {
        this._attackValue = template['attackValue'] || 1;
    },
    getAttackValue: function() {
        return this._attackValue;
    },
    attack: function(target) {
        //only remove entity if destructible
        if (target.hasMixin('Destructible')) {
            var attack = this.getAttackValue();
            var defense = target.getDefenseValue();
            var max = Math.max(0, attack - defense);
            //target.takeDamage(this, 1 + Math.floor(Math.random() * max));
            var damage = 1 + Math.floor(Math.random() * max);
            Game.sendMessage(this, 'You attack the %s for %d damage!', [target.getName(), damage]);
            Game.sendMessage(target, 'The %s attacks you for %d damage!', [this.getName(), damage]);
            target.takeDamage(this, damage);
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
        //clear message queue
        this.clearMessages();
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
                        //send message to nearby entities
                        Game.sendMessageNearby(this.getMap(), entity.getX(), entity.getY(),
                            'The python is growing!');

                    }
                }
            }
        }
    }
}

Game.Mixins.MessageRecipient = {
    name: 'MessageRecipient',
    init: function(template) {
        this._messages = [];
    },
    receiveMessage: function(message) {
        this._messages.push(message);
    },
    getMessages: function() {
        return this._messages;
    },
    clearMessages: function() {
        this._messages = [];
    }
}

Game.sendMessage = function(recipient, message, args) {
    //check if recipient can receive message
    if (recipient.hasMixin(Game.Mixins.MessageRecipient)) {
        //if args, then format message
        if (args) {
            message = vsprintf(message, args);
        }
        recipient.receiveMessage(message);
    }
}

Game.sendMessageNearby = function(map, centerX, centerY, message, args) {
    //if args, format the message
    if (args) {
        message = vsprintf(message, args);
    }
    //get nearby entitites
    entities = map.getEntitiesWithinRadius(centerX, centerY, 5);
    //iterate through the entities array, sending it to those who can receive it
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].hasMixin(Game.Mixins.MessageRecipient)) {
            entities[i].receiveMessage(message);
        }
    }
}

// Player template
Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    background: 'black',
    maxHp: 100,
    attackValue: 25,
    mixins: [Game.Mixins.Moveable, Game.Mixins.PlayerActor,
        Game.Mixins.Attacker, Game.Mixins.Destructible, Game.Mixins.MessageRecipient
    ]
}

//Python template
Game.PythonTemplate = {
    name: 'python',
    character: 'P',
    foreground: 'green',
    maxHp: 10,
    mixins: [Game.Mixins.PythonActor, Game.Mixins.Destructible]
}