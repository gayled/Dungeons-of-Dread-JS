// Create Mixins namespace
Game.Mixins = {};

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
        //if 0 or less remove from map
        if (this._hp <= 0) {
            Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
            //check if player died
            if (this.hasMixin(Game.Mixins.PlayerActor)) {
                this.act();
            } else {
                this.getMap().removeEntity(this);
            }
        }
    }
};

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
            var damage = 1 + Math.floor(Math.random() * max);
            Game.sendMessage(this, 'You attack the %s for %d damage!', [target.getName(), damage]);
            Game.sendMessage(target, 'The %s attacks you for %d damage!', [this.getName(), damage]);
            target.takeDamage(this, damage);
        }
    }
};

Game.Mixins.Sight = {
    name: 'Sight',
    groupName: 'Sight',
    init: function(template) {
        this._sightRadius = template['sightRadius'] || 5;
    },
    getSightRadius: function() {
        return this._sightRadius;
    }
};

Game.Mixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function() {
        //detect if game is over
        if (this.getHp() < 1) {
            Game.Screen.playScreen.setGameEnded(true);
            //send message that player has lost
            Game.sendMessage(this, 'You have been killed....Press [Enter] to continue!');
        }
        //re-render the screen
        Game.refresh();
        //lock engine until player completes turn (presses a key)
        this.getMap().getEngine().lock();
        //clear message queue
        this.clearMessages();
    }
};

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
                            this.getY() + yOffset, this.getZ())) {
                        var entity = Game.EntityRepository.create('python');
                        entity.setPosition(this.getX() + xOffset,
                            this.getY() + yOffset, this.getZ());
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;
                        //send message to nearby entities
                        Game.sendMessageNearby(this.getMap(), entity.getX(), entity.getY(),
                            entity.getZ(),
                            'The python is growing!');

                    }
                }
            }
        }
    }
};

Game.Mixins.WanderActor = {
    name: 'WanderActor',
    groupName: 'Actor',
    act: function() {
        //two outcomes determine positive or negative direction
        var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
        //two outcomes determine moving in x or y direction
        if (Math.round(Math.random()) === 1) {
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        } else {
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
        }
    }
};

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
};

Game.sendMessage = function(recipient, message, args) {
    //check if recipient can receive message
    if (recipient.hasMixin(Game.Mixins.MessageRecipient)) {
        //if args, then format message
        if (args) {
            message = vsprintf(message, args);
        }
        recipient.receiveMessage(message);
    }
};

Game.sendMessageNearby = function(map, centerX, centerY, centerZ, message, args) {
    //if args, format the message
    if (args) {
        message = vsprintf(message, args);
    }
    //get nearby entities
    entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
    //iterate through the entities array, sending the message to those who can receive it
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].hasMixin(Game.Mixins.MessageRecipient)) {
            entities[i].receiveMessage(message);
        }
    }
};

Game.Mixins.InventoryHolder = {
    name: 'InventoryHolder',
    init: function(template) {
        //10 slots is default
        var inventorySlots = template['inventorySlots'] || 10;
        //initialize inventory
        this._items = new Array(inventorySlots);
    },
    getItems: function() {
        return this._items;
    },
    getItem: function(i) {
        return this._items[i];
    },
    addItem: function(item) {
        //retrun true if space for item
        for (let i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                this._items[i] = item;
                return true;
            }
        }
        return false;
    },
    removeItem: function(i) {
        this._items[i] = null;
    },
    canAddItem: function() {
        //check for empty slot
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                return true;
            }
        }
        return false;
    },
    pickupItems: function(indices) {
        var mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
        var added = 0;
        for (let i = 0; i < indices.length; i++) {
            //add if inventory not full
            if (this.addItem(mapItems[indices[i] - added])) {
                mapItems.splice(indices[i] - added, 1);
                added++;
            } else {
                //inventory is full
                break;
            }
        }
        //update map items
        this._map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
        return added === indices.length;
    },
    dropItem: function(i) {
        //drops item on current map tile
        if (this._items[i]) {
            if (this._map) {
                this._map.addItem(this.getX(), this.getY(), this.getZ(), this._items[i]);
            }
            this.removeItem(i);
        }
    }
};

// Player template
Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    sightRadius: 6,
    inventorySlots: 10,
    mixins: [Game.Mixins.PlayerActor,
        Game.Mixins.Attacker, Game.Mixins.Destructible,
        Game.Mixins.Sight, Game.Mixins.MessageRecipient, Game.Mixins.InventoryHolder
    ]
};

Game.EntityRepository = new Game.Repository('entities', Game.Entity);

//Python template
Game.EntityRepository.define('python', {
    name: 'python',
    character: 'P',
    foreground: 'green',
    maxHp: 10,
    mixins: [Game.Mixins.PythonActor, Game.Mixins.Destructible]
});

Game.EntityRepository.define('orc', {
    name: 'orc',
    character: 'O',
    foreground: 'white',
    maxHp: '50',
    attackValue: '20',
    mixins: [Game.Mixins.WanderActor, Game.Mixins.Attacker, Game.Mixins.Destructible]
});

Game.EntityRepository.define('dragon', {
    name: 'dragon',
    character: 'D',
    foreground: 'yellow',
    maxHp: '150',
    attackValue: '75',
    mixins: [Game.Mixins.WanderActor, Game.Mixins.Attacker, Game.Mixins.Destructible]
});