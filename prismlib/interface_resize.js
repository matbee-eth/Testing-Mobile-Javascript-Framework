/***********************************************************
* INTERFACE CLASS
*	Designed & developed by Dima Svirid, 2007	
*	Class: interface_resize.js
* Extends: system.js, dragdrop.js
************************************************************/
$WI.Class.InterfaceContainer = new $WI.Class({	
	Create: function(options) {		
		if(!options) var options = {};
		this.options = options;	
		if(!this.options.padding) this.options.padding = 0;		
		
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-interface'});	
		
		this.topside = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-interface-side-topmenu', display: 'none'}, 'insertinto');		
		
		this.side1x1 = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-interface-side', top: this._fixPx(this.options.padding)}, 'insertinto');
		
		
		this.side1x1.topmenu = this._insertDOM(this.side1x1, {objType: 'div', objClass: 'element-interface-side-topmenu', display: 'none'}, 'insertinto');
		
		this.side1x1.topside = this._insertDOM(this.side1x1, {objType: 'div', objClass: 'element-interface-side-top', display: 'none'}, 'insertinto');

		this.side1x1.content = this._insertDOM(this.side1x1, {objType: 'div', objClass: 'element-interface-side-content'}, 'insertinto');

		this.side1x2 = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-interface-side', top: this._fixPx(this.options.padding)}, 'insertinto');
		
		this.side1x2.topmenu = this._insertDOM(this.side1x2, {objType: 'div', objClass: 'element-interface-side-topmenu', display: 'none'}, 'insertinto');
		
		this.side1x2.topside = this._insertDOM(this.side1x2, {objType: 'div', objClass: 'element-interface-side-top', display: 'none'}, 'insertinto');
		this.side1x2.content = this._insertDOM(this.side1x2, {objType: 'div', objClass: 'element-interface-side-content'}, 'insertinto');

		this.side1x1.resizer = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-interface-resizer-h'}, 'insertinto');
		this.side1x1.resizer._this = this;		

		
		
		return this.obj;
	},
	SetSide: function(side, options) {		
		var obj = eval('this.' + side);
		
		this._isDisplay(obj, true);
		
		if(options.objClass) options.objClass = obj.className + ' ' + options.objClass;
		
		this._applyConfig(obj, options);	
		
		this._ajustSides();	
		return obj;
	},
	Content: function(content) {		
	},
	GetBody: function(obj) {
		if(obj)
			return eval('this.' + obj);
		else 
			return this.obj;		
	},	
	Write: function(where) {			
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');				
	
		var _resizer = $WI.Drag(this.side1x1.resizer, {moveY: false});
				_resizer.UseProxy({parent: this.obj, objClass: 'element-interface-resizer-h element-interface-resizer-h-proxy'});
				_resizer.AddEvent({type: 'drop', obj: _resizer.GetBody(), onevent: this._dropResizer});
		
		this.AddEvent({type: 'ajusting', obj: this.obj, onevent: this._ajustSides});
		
		this.AddEvent({type: 'resize', obj: window, onevent: {fire: 'ajusting', obj: this.obj}});
		
		this.options.resizer = this._getWidth(this.side1x1.resizer);;		
	},
	_getPx: function(size, what) {
		if(what=='width') var client = this.obj;
		var client = this._getClientWH();
		if(size.indexOf('%')!=-1) 
			return this._convertP$Px(size, client.w);
		else
			return parseInt(size);
	},
	_dropResizer: function(event, _target, obj) {
		var _this = obj._this;		
		
		var newx = this._getXY(obj, true).x;
		this._setStyle(_this.side1x1, 'width', this._fixPx(newx));	
		_this._ajustSides();
		
		_this.Fire(null, 'ajusting', _this.obj);
		
		//this.Fire(obj);		
	},
	_ajustSides: function(event, _target, obj) {

		var w = this._getWidth(this.obj);
		var h = this._getHeight(this.obj);	
		
		var w_left = this._getWidth(this.side1x1);
		var h_top = this._getHeight(this.side1x1.topside);
		var h_top2 = this._getHeight(this.side1x2.topside);
		var h_topside = this._getHeight(this.topside);
		var h_menu = this._getHeight(this.side1x1.topmenu);
		var h_menu2 = this._getHeight(this.side1x2.topmenu);
	
		//fix resizer
		this._applyConfig(this.side1x1.resizer, {top: this._fixPx(h_topside), left: this._fixPx(w_left), height:  this._fixPx(h-h_topside)});
		
		this._applyConfig(this.side1x1, {top: this._fixPx(h_topside), height: this._fixPx(h-h_top-h_menu-h_topside)});
		this._applyConfig(this.side1x2, {top: this._fixPx(h_topside), height: this._fixPx(h-h_menu2-h_topside)});		
		
		this._applyConfig(this.side1x1.content, {width: this._fixPx(w_left), height: this._fixPx(h-h_top-h_menu-h_topside)});		
		this._applyConfig(this.side1x2.content, {height: this._fixPx(h-h_top2-h_menu2-h_topside)});		
		
		this._applyConfig(this.side1x2, {width: this._fixPx(w-w_left-this.options.resizer), left: this._fixPx(w_left+this.options.resizer)});
		
		return;		
	},
	_setCurrentSizes: function(){
		this.side1x1.w = this._getWidth(this.side1x1);
		this.side1x1.h = this._getHeight(this.side1x1);
		this.side1x2.w = this._getWidth(this.side1x2);
		this.side1x2.h = this._getHeight(this.side1x2);		
	}
});
