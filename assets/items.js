Game.ItemRepository = new Game.Repository('items', Game.Item);

Game.ItemRepository.define('gold piece', {
    name: 'gold piece',
    character: 'g',
    foreground: 'yellow'
});

Game.ItemRepository.define('silver coin', {
    name: 'silver coin',
    character: 's',
    foreground: 'white'
});