Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
};

//define named template
Game.Repository.prototype.define = function(name, template) {
    this._templates[name] = template;
};

//create objects form template
Game.Repository.prototype.create = function(name) {
    //make sure named template exists
    var template = this._templates[name];
    if (!template) {
        throw new Error("No template named '" + name + "' in repository '" + this._name + "'");
    }
    //construct object from themplate
    return new this._ctor(template);
};

//create object form random template
Game.Repository.prototype.createRandom = function() {
    //create from random key
    return this.create(Object.keys(this._templates).random());
};