$WI.Class.Screen = new $WI.Class({	
	__extends: [$WI.Class.Widget],
	__widgets: [],
	__childScreens: [],
	__firstStart: true,
	__construct: function() {
		console.log("$WI.Class.Screen: __construct");
		this.addClass('Screen');
		this.scanForWidgets();
		this.assembleChildren();
	},
	push: function() {
		console.log("$WI.Class.Screen: push");
		this._currentScreen = this;
		this.setParent(this);
		this.show();
		this.activate();
	},
	pushScreen: function(screen) {
		console.log("$WI.Class.Screen: pushScreen");
		this._currentScreen = screen;
		screen.setParent(this);
		screen.fadeIn();
		this.hide(300);

		this.deactivate();
		screen.activate();
		
	},
	popScreen: function () {
		console.log("$WI.Class.Screen: popScreen");
		if (!this._root) {
			// show fade out animation.
			this.removeClass("show");
			this._parent.show();
			this.fadeOut(300);
			this.deactivate();
			
			this._parent.removeClass('fadeOut');
			this._parent.removeClass('fadeIn');
			this._parent.removeClass('fadeOutIn');
			
			this._parent.activate();
		}
	},
	popCurrentChildScreen: function() {
		console.log("$WI.Class.Screen: popCurrentChildScreen");
		this._currentScreen.fadeOut();
		this.fadeIn();
	},
	setParent: function (screen) {
		console.log("$WI.Class.Screen: setParent");
		if (this != screen) {
			this._parent = screen;
			this._hasParent = true;
		}
	},
	getParent: function () {
		console.log("$WI.Class.Screen: getParent");
		return this._parent;
	},
	hasParent: function() {
		console.log("$WI.Class.Screen: hasParent");
		return this._hasParent;
	},
	activate: function (event) {
		console.log("$WI.Class.Screen: activate");
		$WI.Method.App.setCurrentScreen(this);
		if (this.__firstStart === true) {
			this.__construct();
			this.__firstStart = false;
		}
		this.refreshWidgets();
		// scroller.refresh();
	},
	deactivate: function (event) {
		console.log("$WI.Class.Screen: deactivate");
		
	},
	scanForWidgets: function() {
		console.log("$WI.Class.Screen: scanForWidgets");
		var list = this._dom.childNodes;
		
		// for (var i = 0; i < list.length; i++) {
		// 	if (list[i].tagName != "SCREEN") {
		// 		if (list[i].tagName === "SCROLLER") {
		// 			this.addWidget(new $WI.Scroller(list[i]));
		// 		}
		// 		else if (list[i].tagName === "TEXTBOX") {
		// 			var curDom = list[i];
		// 			// list[i].style.height = curDom.getAttribute('height');
		// 			this.addWidget(textbox);
		// 		}
		// 		else if (list[i].tagName === "DIV") {
		// 			this.addWidget(this.identifyWidget(list[i]));
		// 		}
		// 	}
		// }


		var scrollers = this._dom.getElementsByTagName("scroller");
		for (var i = 0; i < scrollers.length; i++) {
			console.log("Scroller added. " + scrollers[i].id);
			this.addWidget(new $WI.Scroller(scrollers[i]));
		}
		var textboxes = this._dom.getElementsByTagName("textbox");
		for (var i = 0; i < textboxes.length; i++) {
			console.log("Textbox added.");
			this.addWidget(new $WI.TextBox(textboxes[i], {}));
		}

	},
	refreshWidgets: function() {
		console.log("$WI.Class.Screen: refreshWidgets");
		for (var k = 0; k < this.__widgets.length; k++) {
			if (this.__widgets[k].refresh)
			this.__widgets[k].refresh();
		}
	},
	addWidget: function(widget) {
		console.log("$WI.Class.Screen: addWidget");
		this.__widgets.push(widget);
	},
	assembleChildren: function () {
		console.log("$WI.Class.Screen: assembleChildren");
		var list = this._dom.childNodes;
		for (var k = 0; k < list.length; k++) {
			if (list[k].tagName === "SCREEN") {
				var scr = new $Screen(list[k]);
				scr.hide();
				this.__childScreens.push(scr);
				$WI.Method.App.addScreen(scr);
			}
		}
	},
	fadeIn: function(delay) {
		console.log("$WI.Class.Screen: fadeIn");
		this.addClass('initialIn');
		this.removeClass('fadeOut');
		this.removeClass('fadeIn');
		this.removeClass('fadeOutIn');
		this.addClass('fadeIn');
		this.show(delay);
		// navigator.notification.showBanner(this.getName() + " fadeIn() " + this._dom.className);
	},
	fadeOut: function(delay) {
		console.log("$WI.Class.Screen: fadeOut");
		this.addClass('initialOut');
		this.removeClass('fadeIn');
		this.removeClass('fadeOut');
		this.removeClass('fadeOutIn');
		this.addClass('fadeOut');
		
		this.hide(delay);
		// navigator.notification.showBanner(this.getName() + " fadeOut() " + this._dom.className);
	},
	fadeOutIn: function(delay) {
		console.log("$WI.Class.Screen: fadeOutIn");
		this.removeClass('fadeIn');
		this.removeClass('fadeOut');
		this.removeClass('fadeOutIn');
		// this.addClass('fadeOutIn');
		this.show(delay);

		// navigator.notification.showBanner(this.getName() + " fadeOutIn() " + this._dom.className);
	},
	getWidgetByName: function(name) {
		console.log("getWidgetByName: " + name);
		// console.log(JSON.stringify());
		// for (var k in this.__widgets) {
		// 	console.log(k);
		// }
		for (var k = 0; k < this.__widgets.length; k++) {
			var currentWidget = this.__widgets[k];
			if (currentWidget._name) {
				if (currentWidget.getName() === name) {
					return currentWidget;
				}
			}			
		}
	},
	identifyWidget: function(dom) {
		console.log("$WI.Class.Screen: identifyWidget");
		if (dom.tagName === "SCROLLER") {
			return new $WI.Scroller(dom);
		}
		else if (dom.tagName === "TEXTBOX") {
			dom.style.height = dom.getAttribute('height');
			var textbox = new $WI.TextBox(dom, {});
			return textbox;
		}
	}
});

$Screen = function (dom) {
	var screen = new $WI.Class.Screen();
	screen.setDom(dom);
	screen.setWidth(window.innerWidth+"px");
	// screen.__construct();
	return screen;
}