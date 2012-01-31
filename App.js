$WI.Class.Application = new $WI.Class({
	__construct: function() {
		var app = document.getElementsByTagName('app');

		$WI.Method.App.load(app);

		var screenOne = $WI.Method.App.getCurrentScreen();
		var txt = screenOne.getWidgetByName("mainScreenTextBox");
		$(txt._inputElement).focus(function() {
	    	alice.wobble(txt._inputElement, 20, 5, "top-left", 1000, 10, "ease-in-out", -1);
	  	});
	  	$(txt._inputElement).blur(function() {
	    	// alice.wobble("MyDiv", 20, 5, "top-left", 1000, 10, "ease-in-out", -1);
	  	});

		txt._inputElement.onkeypress = function(e) {
			if (e.keyCode == 13) // On Enter.
            {
                $WI.Method.App.pushScreen("listScreen");
				var list = $WI.Method.App.getCurrentScreen().getWidgetByName("list");
				
				var added = document.createElement("div");
				added.innerText = "Added!";
				list.addItem(added);
            }
		};
	}
});





































$WI.Application = function() {
	
	chain = function(obj) {
        for (var fn in obj) {
                if (typeof obj[fn] == "function") {
                    obj[fn] = obj[fn].chain();
                }

    	}
        return obj;
	}

	return chain(new $WI.Class.Application()).__construct();
};

Function.prototype.chain = function() {
	var that = this;
	return function() {
	    // New function runs the old function
	    var retVal = that.apply(this, arguments);
	    // Returns "this" if old function returned nothing
	    if (typeof retVal == "undefined") { return this; }
	                // else returns old value
	    else { return retVal; }
	}
};

$WI.Method.App = {
	__screens: [],
	load: function(dom) {
		window.onkeyup = function(e) {
			if (e.keyCode == 27) {
				var currentScreen = $WI.Method.App.getCurrentScreen();
				if (currentScreen.hasParent()) {
					currentScreen.popScreen();
					e.preventDefault();
				}
				else {
					// alert('wtf');
				}
			}
		}

		var list = dom[0].childNodes;
		for (var k = 0; k < list.length; k++) {
			if (list[k].tagName === "SCREEN") {
				var scr = new $Screen(list[k]);
				scr.hide();
				var curDom = list[k];
				scr.setName(curDom.id);
				this.addScreen(scr);
			}
		}
		this.setCurrentScreen(this.__screens[0]);
		this.getCurrentScreen().push();
	},
	getCurrentScreen : function() {
		return this.__currentScreen;
	},
	setCurrentScreen : function(currentScreen) {
		this.__currentScreen = currentScreen;
	},
	addScreen: function(screen) {
		this.__screens.push(screen);
	},
	getScreenByName: function(name) {
		for (var i = 0; i < this.__screens.length; i++) {
			if (this.__screens[i].getName() === name) {
				return this.__screens[i];
			}
		}
	},
	getWidgetByName: function(name) {
		console.log("getWidgetByName: " + name);
		for (var i = 0; i < this.__widgets.length; i++)	{
			var currentScreen = this.__screens[i];
			var widg = currentScreen.getWidgetByName(name);
			if (widg) {
				return widg;
			}
		}
	},
	pushScreen: function(name) {
		this.getCurrentScreen().pushScreen(this.getScreenByName(name));
	}
};
$WI._append($WI, $WI.Method.App);