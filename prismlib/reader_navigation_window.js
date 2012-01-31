/*********************************************************
*		Reader Navigation Window CLASS
*		Designed & developed by Dima Svirid, 2009	
*		Class: reader_navigation.js
*	  Extends: system.js, reader.js
*********************************************************/
$WI.Class.ReaderNavigationWindow = new $WI.Class({
	Create: function(options) {
		
		//RIGHT VIEWER NAVIGATION BLOCK
		this.obj = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-reader-navigation-window'}, 'insertinto');
		this.obj.pages = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-reader-navigation-pages-window'}, 'insertinto');	
		this.obj.pages.array = [];	
	},	
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');
		
		this.obj.pages.drag = $WI.Drag(this.obj.pages, {moveY: false, limits: {left: this._dragLimit, right: 0}});	
		this.obj.pages.drag._super = this;	
	},
	GetBody: function() {
		return this.obj;
	},
	SetPage: function(options) {
		var page = this._insertDOM(this.obj.pages, {objType: 'img', objClass: 'element-reader-navigation-page-window', src: options.src}, 'insertinto');
		var w = this._getWidth(page);
		this._setStyle(page, 'left', this._fixPx(w*this.obj.pages.array.length));
		this.obj.pages.array.push(page);		
		
		this._cancelSelect(null, true, page);
		
		//this._setStyle(this.obj.pages, 'width', this._fixPx(w*this.obj.pages.array.length+w));
	},
	_dragLimit: function(_target, type){		
		if(type=='left'){				
			var w = this._getWidth(this._super.obj);
			var wp = this._getWidth(_target);
			return -(wp*this._super.obj.pages.array.length - w);
		}
	}			
});








