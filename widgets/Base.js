$WI.Class.Widget = new $WI.Class({
	__construct: function() {
		this.chain = function(obj) {
		        for (var fn in obj) {
		                if (typeof obj[fn] == "function") {
		                    obj[fn] = obj[fn].chain();
		                }
		    }
		        return obj;
		}

		// alert('wtfbbq');
	},
	setDom: function (dom) {
		this._dom = dom;
		if (dom.id)
		this.setName(dom.id);
		var width = (window.innerWidth >= dom.style.width) ? dom.style.width : window.innerWidth;
		this.setWidth(width+"px");
		this.setHeight(dom.getAttribute('height'));
	},
	getDom: function () {
		return this._dom;
	},
	setName: function (name) {
		this._name = name;
	},
	getName: function() {
		return this._name;
	},
	setData: function (data) {
		this._data = data;
	},
	update: function () {
		//update widget...
	},
	show: function(delay) {
		//hide widget;
		// this._dom.style.display = "inherit";
		if (delay) {
			var func = function() {
				this.removeClass("hide");
				this.addClass("show");
			};
			setTimeout(func.Apply(this), delay)
		}
		else {

			this.removeClass("hide");
			this.addClass("show");
		}
	},
	hide: function(delay) {
		//show widget
		// this._dom.style.display = "none";
		if (delay) {
			var func = function() {
				this.removeClass("show");
				this.addClass("hide");
			};
			setTimeout(func.Apply(this), delay);
		}
		else {
			this.removeClass("show");
			this.addClass("hide");
		}
	},
	addClass: function(name) {
		this._dom.className = this.removeString(name, this._dom.className);
		this._dom.className += " " + name;
	},
	removeClass: function(name) {
	    this._dom.className = this.removeString(name, this._dom.className);
	},
	setHeight: function(height) {
		this._dom.style.height = height;
	},
	getHeight: function() {
		return this._dom.style.height;
	},
	setWidth: function(width) {
		this._dom.style.width = width;
	},
	getWidth: function() {
		return this._dom.style.width;	
	},
	removeString: function(removeString, originalString) {
	    var re = new RegExp('(^| )' + removeString + '( |$)');
	    originalString = originalString.replace(re, '$1');
	    originalString = originalString.replace(/ $/, '');
	    return originalString;
	},
	refresh: function() {
		
	}
});

