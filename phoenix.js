(function() {
  var FINDER,
      GRID_HEIGHT,
      GRID_WIDTH,
      ITERM,
      MARGIN_X,
      MARGIN_Y;

  Phoenix.notify("Phoenix config loading");

  var debug = function(o, label) {
    if (label == null) {
      label = "obj";
    }
    return Phoenix.log(label + ": " + JSON.stringify(o));
  };

  MARGIN_X = 3;
  MARGIN_Y = 3;
  GRID_WIDTH = 20;
  GRID_HEIGHT = 16;

  _.mixin({
    flatmap: function(list, iteratee, context) {
      return _.flatten(_.map(list, iteratee, context));
    }
  });

  Window.prototype.screenRect = function() {
    return this.screen().flippedVisibleFrame();
  };

  Window.prototype.fullGridFrame = function() {
    return this.calculateGrid({
      y: 0,
      x: 0,
      width: 1,
      height: 1
    });
  };

  var snapAllToGrid = function() {
    return _.map(visible(), function(win) {
      return win.snapToGrid();
    });
  };

  var changeGridWidth = function(n) {
    GRID_WIDTH = Math.max(1, GRID_WIDTH + n);
    Phoenix.notify("grid is " + GRID_WIDTH + " tiles wide");
    return snapAllToGrid();
  };

  var changeGridHeight = function(n) {
    GRID_HEIGHT = Math.max(1, GRID_HEIGHT + n);
    Phoenix.notify("grid is " + GRID_HEIGHT + " tiles high");
    return snapAllToGrid();
  };

  Window.prototype.getGrid = function() {
    var frame, gridHeight, gridWidth;
    frame = this.frame();
    gridWidth = this.screenRect().width / GRID_WIDTH;
    gridHeight = this.screenRect().height / GRID_HEIGHT;
    return {
      y: Math.round((frame.y - this.screenRect().y) / gridHeight),
      x: Math.round((frame.x - this.screenRect().x) / gridWidth),
      width: Math.max(1, Math.round(frame.width / gridWidth)),
      height: Math.max(1, Math.round(frame.height / gridHeight))
    };
  };

  Window.prototype.setGrid = function(grid, screen) {
    var gridHeight, gridWidth, screenRect;
    screenRect = screen.flippedVisibleFrame();
    gridWidth = screenRect.width / GRID_WIDTH;
    gridHeight = screenRect.height / GRID_HEIGHT;
    return this.setFrame({
      y: ((grid.y * gridHeight) + screenRect.y) + MARGIN_Y,
      x: ((grid.x * gridWidth) + screenRect.x) + MARGIN_X,
      width: (grid.width * gridWidth) - (MARGIN_X * 2.0),
      height: (grid.height * gridHeight) - (MARGIN_Y * 2.0)
    });
  };

  Window.prototype.snapToGrid = function() {
    if (this.isNormal()) {
      return this.setGrid(this.getGrid(), this.screen());
    }
  };

  Window.prototype.calculateGrid = function(arg) {
    var height, width, x, y;
    x = arg.x, y = arg.y, width = arg.width, height = arg.height;
    return {
      y: Math.round(y * this.screenRect().height) + MARGIN_Y + this.screenRect().y,
      x: Math.round(x * this.screenRect().width) + MARGIN_X + this.screenRect().x,
      width: Math.round(width * this.screenRect().width) - 2.0 * MARGIN_X,
      height: Math.round(height * this.screenRect().height) - 2.0 * MARGIN_Y
    };
  };

  Window.prototype.toGrid = function(arg) {
    var height, rect, width, x, y;
    x = arg.x, y = arg.y, width = arg.width, height = arg.height;
    rect = this.calculateGrid({
      x: x,
      y: y,
      width: width,
      height: height
    });
    this.setFrame(rect);
    return this;
  };

  Window.prototype.topRight = function() {
    return {
      x: this.frame().x + this.frame().width,
      y: this.frame().y
    };
  };

  Window.prototype.toLeft = function() {
    return _.filter(this.windowsToWest(), function(win) {
      return win.topLeft().x < this.topLeft().x - 10;
    });
  };

  Window.prototype.toRight = function() {
    return _.filter(this.windowsToEast(), function(win) {
      return win.topRight().x > this.topRight().x + 10;
    });
  };

  Window.prototype.info = function() {
    var f;
    f = this.frame();
    return "[" + (this.app().processIdentifier()) + "] " + (this.app().name()) + " : " + (this.title()) + "\n{x:" + f.x + ", y:" + f.y + ", width:" + f.width + ", height:" + f.height + "}\n";
  };

  Window.sortByMostRecent = function(windows) {
    var allVisible;
    allVisible = visibleInOrder();
    return _.sortBy(windows, function(win) {
      return _.map(allVisible, function(w) {
        return w.info();
      }).indexOf(win.info());
    });
  };

  var lastFrames = {};

  Window.prototype.toFullScreen = function() {
    if (!_.isEqual(this.frame(), this.fullGridFrame())) {
      this.rememberFrame();
      return this.toGrid({
        y: 0,
        x: 0,
        width: 1,
        height: 1
      });
    } else if (lastFrames[this.uid()]) {
      this.setFrame(lastFrames[this.uid()]);
      return this.forgetFrame();
    }
  };

  Window.prototype.uid = function() {
    return (this.app().name()) + "::" + (this.title());
  };

  Window.prototype.rememberFrame = function() {
    return lastFrames[this.uid()] = this.frame();
  };

  Window.prototype.forgetFrame = function() {
    return delete lastFrames[this.uid()];
  };

  Window.prototype.toTopHalf = function() {
    return this.toGrid({
      x: 0,
      y: 0,
      width: 1,
      height: 0.5
    });
  };

  Window.prototype.toBottomHalf = function() {
    return this.toGrid({
      x: 0,
      y: 0.5,
      width: 1,
      height: 0.5
    });
  };

  Window.prototype.toLeftHalf = function() {
    return this.toGrid({
      x: 0,
      y: 0,
      width: 0.5,
      height: 1
    });
  };

  Window.prototype.toRightHalf = function() {
    return this.toGrid({
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 1
    });
  };

  Window.prototype.toTopRight = function() {
    return this.toGrid({
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.5
    });
  };

  Window.prototype.toBottomRight = function() {
    return this.toGrid({
      x: 0.5,
      y: 0.5,
      width: 0.5,
      height: 0.5
    });
  };

  Window.prototype.toTopLeft = function() {
    return this.toGrid({
      x: 0,
      y: 0,
      width: 0.5,
      height: 0.5
    });
  };

  Window.prototype.toBottomLeft = function() {
    return this.toGrid({
      x: 0,
      y: 0.5,
      width: 0.5,
      height: 0.5
    });
  };

  var getAllScreens = function() {
    return Screen.all();
  }

  var getCurrentScreenIndex = function(allScreens, currentScreen) {
    if (allScreens.length == 1) {
      Phoenix.notify("No more screens available");
      return -1;
    }

    return _.findIndex(allScreens, function (screen) {
      return screen.identifier() == currentScreen.identifier()
    });
  }

  var getPreviousScreen = function(currentScreen) {
    var allScreens = getAllScreens();
    var currentScreenIndex = getCurrentScreenIndex(allScreens, currentScreen);

    if (currentScreenIndex == -1) {
      return currentScreen;
    }

    var idx = currentScreenIndex - 1;
    if (idx < 0) {
      idx = allScreens.length - 1;
    }
    return allScreens[idx];
  }

  var getNextScreen = function(currentScreen) {
    var allScreens = getAllScreens();
    var currentScreenIndex = getCurrentScreenIndex(allScreens, currentScreen);

    if (currentScreenIndex == -1) {
      return currentScreen;
    }

    var idx = currentScreenIndex + 1;
    if (idx > allScreens.length - 1) {
      idx = 0;
    }
    return allScreens[idx];
  }

  var focused = function() {
    return Window.focused();
  }

  var moveWindowToNextScreen = function() {
    var nextScreen = getNextScreen(focused().screen());
    return focused().setGrid(focused().getGrid(), nextScreen);
  };

  var moveWindowToPreviousScreen = function() {
    var nextScreen = getPreviousScreen(focused().screen());
    return focused().setGrid(focused().getGrid(), nextScreen);
  };

  windowLeftOneColumn = function() {
    var frame;
    frame = focused().getGrid();
    frame.x = Math.max(frame.x - 1, 0);
    return focused().setGrid(frame, focused().screen());
  };

  var windowDownOneRow = function() {
    var frame;
    frame = focused().getGrid();
    frame.y = Math.min(Math.floor(frame.y + 1), GRID_HEIGHT - 1);
    return focused().setGrid(frame, focused().screen());
  };

  var windowUpOneRow = function() {
    var frame;
    frame = focused().getGrid();
    frame.y = Math.max(Math.floor(frame.y - 1), 0);
    return focused().setGrid(frame, focused().screen());
  };

  var windowRightOneColumn = function() {
    var frame;
    frame = focused().getGrid();
    frame.x = Math.min(frame.x + 1, GRID_WIDTH - frame.width);
    return focused().setGrid(frame, focused().screen());
  };

  var windowGrowOneGridColumn = function() {
    var frame;
    frame = focused().getGrid();
    frame.width = Math.min(frame.width + 1, GRID_WIDTH - frame.x);
    return focused().setGrid(frame, focused().screen());
  };

  var windowShrinkOneGridColumn = function() {
    var frame;
    frame = focused().getGrid();
    frame.width = Math.max(frame.width - 1, 1);
    return focused().setGrid(frame, focused().screen());
  };

  var windowGrowOneGridRow = function() {
    var frame;
    frame = focused().getGrid();
    frame.height = Math.min(frame.height + 1, GRID_HEIGHT);
    return focused().setGrid(frame, focused().screen());
  };

  windowShrinkOneGridRow = function() {
    var frame;
    frame = focused().getGrid();
    frame.height = Math.max(frame.height - 1, 1);
    return focused().setGrid(frame, focused().screen());
  };

  var windowToFullHeight = function() {
    var frame;
    frame = focused().getGrid();
    frame.y = 0;
    frame.height = GRID_HEIGHT;
    return focused().setGrid(frame, focused().screen());
  };

  App.prototype.firstWindow = function() {
    return this.visibleWindows()[0];
  };

  App.allWithName = function(name) {
    return _.filter(App.all(), function (app) {
      return app.name() === name;
    });
  };

  App.byName = function(name) {
    var app;
    app = _.first(App.allWithName(name));
    app.show();
    return app;
  };

  App.focusOrStart = function(name) {
    var activeWindows, apps;
    apps = App.allWithName(name);
    if (_.isEmpty(apps)) {
      Phoenix.notify("Starting " + name);
      App.launch(name);
    } else {
      Phoenix.notify("Switching to " + name);
    }
    windows = _.flatmap(apps, function(x) {
      return x.windows();
    });
    activeWindows = _.reject(windows, function(win) {
      return win.isMinimized();
    });
    if (_.isEmpty(activeWindows)) {
      App.launch(name);
    }
    return _.each(activeWindows, function(win) {
      return win.focus();
    });
  };

  var keyBindings = {};

  bindKey = function(key, description, modifier, fn) {
    return keyBindings[description] = Key.on(key, modifier, fn);
  };

  mash = 'cmd-alt-ctrl'.split('-');

  bindKey('up', 'To Top Half', mash, function() {
    return focused().toTopHalf();
  });

  bindKey('down', 'To Bottom Half', mash, function() {
    return focused().toBottomHalf();
  });

  bindKey('left', 'To Left Half', mash, function() {
    return focused().toLeftHalf();
  });

  bindKey('right', 'To Right Half', mash, function() {
    return focused().toRightHalf();
  });

  bindKey('Y', 'Top Left', mash, function() {
    return focused().toTopLeft();
  });

  bindKey('N', 'Bottom Left', mash, function() {
    return focused().toBottomLeft();
  });

  bindKey('P', 'Top Right', mash, function() {
    return focused().toTopRight();
  });

  bindKey('/', 'Bottom Right', mash, function() {
    return focused().toBottomRight();
  });

  bindKey('space', 'Maximize Window', mash, function() {
    return focused().toFullScreen();
  });

  ITERM = "iTerm2";

  FINDER = "Finder";

  CHROME = "ChromeLauncher";

  bindKey('T', 'Launch iTerm2', mash, function() {
    return App.focusOrStart(ITERM);
  });

  bindKey('F', 'Launch Finder', mash, function() {
    return App.focusOrStart(FINDER);
  });

  bindKey('0', 'To Next Screen', mash, function() {
    return moveWindowToNextScreen();
  });

  bindKey('6', 'To Previous Screen', mash, function() {
    return moveWindowToPreviousScreen();
  });

  bindKey('=', 'Increase Grid Columns', mash, function() {
    return changeGridWidth(+1);
  });

  bindKey('-', 'Reduce Grid Columns', mash, function() {
    return changeGridWidth(-1);
  });

  bindKey('[', 'Increase Grid Rows', mash, function() {
    return changeGridHeight(+1);
  });

  bindKey(']', 'Reduce Grid Rows', mash, function() {
    return changeGridHeight(-1);
  });

  bindKey(';', 'Snap focused to grid', mash, function() {
    return focused().snapToGrid();
  });

  bindKey("'", 'Snap all to grid', mash, function() {
    return Window.all({"visible": true}).map(function(win) {
      return win.snapToGrid();
    });
  });

  bindKey('H', 'Move Grid Left', mash, function() {
    return windowLeftOneColumn();
  });

  bindKey('J', 'Move Grid Down', mash, function() {
    return windowDownOneRow();
  });

  bindKey('K', 'Move Grid Up', mash, function() {
    return windowUpOneRow();
  });

  bindKey('L', 'Move Grid Right', mash, function() {
    return windowRightOneColumn();
  });

  bindKey('U', 'Window Full Height', mash, function() {
    return windowToFullHeight();
  });

  bindKey('I', 'Shrink by One Column', mash, function() {
    return windowShrinkOneGridColumn();
  });

  bindKey('O', 'Grow by One Column', mash, function() {
    return windowGrowOneGridColumn();
  });

  bindKey(',', 'Shrink by One Row', mash, function() {
    return windowShrinkOneGridRow();
  });

  bindKey('.', 'Grow by One Row', mash, function() {
    return windowGrowOneGridRow();
  });

  Phoenix.notify("Loaded");

}).call(this);
