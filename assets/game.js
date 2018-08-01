var Game = {
    _display: null,
    _currentScreen: null,
    _screenWidth: 80,
    _screenHeight: 24,
    init: function() {
        // initialize game display
        this._display = new ROT.Display({
            width: this._screenWidth,
            height: this._screenHeight + 1 //add 1 for displaying stats
        });
        var game = this;
        //helper function for binding events to current screen
        var bindEventToScreen = function(event) {
            window.addEventListener(event, function(e) {
                // When an event is received, send it to the
                // screen if there is one
                if (game._currentScreen !== null) {
                    // Send the event type and data to the screen
                    game._currentScreen.handleInput(event, e);
                }
            });
        };
        // Bind keypress event
        bindEventToScreen('keydown');
        bindEventToScreen('keypress');
    },
    getDisplay: function() {
        return this._display;
    },
    getScreenWidth: function() {
        return this._screenWidth;
    },
    getScreenHeight: function() {
        return this._screenHeight;
    },

    refresh: function() {
        //clear the screen
        this._display.clear();
        //re-render the screen
        this._currentScreen.render(this._display);
    },

    switchScreen: function(screen) {
        // if exists, exit current screen
        if (this._currentScreen !== null) {
            this._currentScreen.exit();
        }
        // Clear the display
        this.getDisplay().clear();
        // Update our current screen from parameter and render it
        this._currentScreen = screen;
        if (!this._currentScreen !== null) {
            this._currentScreen.enter();
            this.refresh();
        }
    }
};

window.onload = function() {
    // Check if rot.js can work in this browser
    if (!ROT.isSupported()) {
        alert("The rot.js library isn't supported by your browser.");
    } else {
        // Initialize the game
        Game.init();
        // Add the ROT container to index.html
        document.body.appendChild(Game.getDisplay().getContainer());
        // Load the start screen
        Game.switchScreen(Game.Screen.startScreen);
    }
};