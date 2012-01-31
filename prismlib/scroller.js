/*********************************************************
*		Scroller CLASS
*		Designed & developed by Dima Svirid, 2007	
*		Class: scroller.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Scroller = new $WI.Class({
	Scroll: function(options) {
		this.options = options;
		if(this.options.obj) {
			this.options.obj = $E(this.options.obj);
			this.obj = this._insertDOM(options.obj, {objType: 'div', objClass: 'element-scroller', position: 'relative', overflow: 'hidden', config: options}, 'replaceAppend');	
			this._setStyle(this.options.obj, 'position', 'relative');
		} else {
			this.obj = this._createDOM({objType: 'div', objClass: 'element-scroller', position: 'relative', config: options});		
		}
		var scroller = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-scroller-cursor', position: 'absolute', 	backgroundColor: '#000000',	width: '20px', height: '20px', top: '0px'}, 'insertinto');	
		
		var _scroll = $WI.Drag(scroller, {moveY: false, step: 20, limits: {left: 0, right: this._scrollerLimit}});

				_scroll.AddEvent({type: 'drag', obj: scroller, onevent: this._scrollLayer});
				_scroll.AddEvent({type: 'drop', obj: scroller, onevent: this._scrollLayer});
		
	},
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
		

	},
	onScroll: function(event, _target, obj) {		
	},
	_scrollLayer: function(event, _target, obj) {
		if(!obj._construct || !obj._construct.options.obj) return;
		var scrolled = obj._construct.options.obj;	
		var scroll = obj._construct.obj;		
		var w = this._getWidth(scrolled);
		var ws = this._getWidth(scroll);
		var wt = this._getWidth(obj);
		var period = (w-ws)/(ws-wt);
		var xys = this._getStyleInt(obj, 'left');
		var newxy = xys*period;
		if((ws-wt)<=newxy) newxy = w-ws;

		this._setStyle(scrolled, 'left', this._fixPx(-newxy));
		
		this.onScroll(event, _target, obj);
	},
	_scrollerLimit: function(_target, type){		
		if(type=='right'){
			var w = this._getWidth(_target._construct.obj)-this._getWidth(_target);		
			return w;
		}
	}		
});

