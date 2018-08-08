Game.Item = function(properties) {
    properties = properties || {};
    //call the glyph constructor
    Game.Glyph.call(this, properties);
    this._name = properties['name'] || '';
};
//items inherit glyph functionality
Game.Item.extend(Game.Glyph);

Game.Item.prototype.describe = function() {
    return this._name;
};

Game.Item.prototype.describeA = function(capitalize) {
    //capitalization optional
    var prefixes = capitalize ? ['A', 'An'] : ['a', 'an'];
    var string = this.describe();
    var firstLetter = string.charAt(0).toLowerCase();
    var prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;
    return prefixes[prefix] + ' ' + string;
};