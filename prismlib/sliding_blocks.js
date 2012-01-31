/*********************************************************
*		Dynamic Sliding Blocks CLASS
*		Designed & developed by Dima Svirid, 2008	
*		Class: sliding_menu.js
*	  Extends: system.js
*********************************************************/
$WI.Class.SlidingBlocks = new $WI.Class({	
	SetOptions: function(options){
		if(!options) options = {};
		this.options = options;
	},
	Create: function(options) {
		if(!this.options) this.options = {};
		if(!this.menus) this.menus = [];
		if(!options) options = {};
		if(!this.obj)
			this.obj = this._createDOM({objType: 'div', objClass: 'element-sliding-blocks'});		
		
		var menu = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-sliding-blocks-block'}, 'insertinto');
		menu.header = this._insertDOM(menu, {objType: 'div', objClass: 'element-sliding-blocks-header'}, 'insertinto');
		var left = this._insertDOM(menu.header, {objType: 'div', objClass: this._createClass(['-left'], 'element-sliding-blocks-header')}, 'insertinto');
		this._insertDOM(left, {objType: 'div', objClass: 'element-sliding-blocks-header-icon', backgroundImage: 'url('+options.icon+')'}, 'insertinto');
		this._insertDOM(left, {objType: 'div', objClass: 'element-sliding-blocks-header-text', html: options.title}, 'insertinto');						
		var right = this._insertDOM(menu.header, {objType: 'div', objClass: this._createClass(['-right'], 'element-sliding-blocks-header')}, 'insertinto');
		menu.arrow = this._insertDOM(right, {objType: 'div', objClass: 'element-sliding-blocks-header-arrow element-sliding-blocks-header-arrow-closed'}, 'insertinto');
		menu.body = this._insertDOM(menu, {objType: 'div', objClass: 'element-sliding-blocks-body', height: '0px'}, 'insertinto');
								
		menu.body.left = this._insertDOM(menu.body, {objType: 'div', objClass: this._createClass(['-left'], 'element-sliding-blocks-body')}, 'insertinto');
		this._insertDOM(menu.body, {objType: 'div', objClass: this._createClass(['-right'], 'element-sliding-blocks-body')}, 'insertinto');
		
		menu.body.content = this._insertDOM(menu.body.left, {objType: 'div', objClass: 'element-sliding-blocks-body-content'}, 'insertinto');					
		
		menu.footer = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-sliding-blocks-footer'}, 'insertinto');
		this._insertDOM(menu.footer, {objType: 'div', objClass: this._createClass(['-left'], 'element-sliding-blocks-footer'), html: '<font></font>'}, 'insertinto');
		this._insertDOM(menu.footer, {objType: 'div', objClass: this._createClass(['-right'], 'element-sliding-blocks-footer'), html: '<font></font>'}, 'insertinto');								
								
		menu.openned = false;
		menu.options = options;
		
		this.AddEvent({type: 'openclose', obj: menu, onevent: this._menuEvent});
		this.AddEvent({type: 'click', obj: menu.header, onevent: {obj: menu, fire: 'openclose'}});
		
		//add menu to a global class array
		this.menus.push(menu);
				
		return menu.body;
	},	
	Content: function(to, content) {
		this._isDisplay($E(content), true);
		this._insertDOM((this._hasClass(to, 'element-sliding-blocks-block')) ? to.body.content : to.content, {newNode: $E(content)}, 'insertinto');		
	},
	GetBody: function() {	
		return this.obj;
	},
	GetBlocks: function() {	
		return this.menus;
	},
	GetContent: function(block) {
		return block.body.content;	
	},
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');	
		this.AjustDivs();	
		
		for(var i=0;i<this.menus.length;i++) 
			if(this.menus[i].options.openned)
				this.Fire(null, 'openclose', this.menus[i]);
		
	},	
	AjustDivs: function(){
		//ajustting for fixed size
		if(this.options.height) {
			var __height = parseInt(this.options.height);
			for(var i=0;i<this.menus.length;i++) 	 
			 __height -= this._getHeight(this.menus[i].header) + 1;
			
			this.options.height = __height;		
			
			for(var i=0;i<this.menus.length;i++) 		
				if(this._getStyleInt(this.menus[i].body, 'height') > 0) 
					this._setStyle(this.menus[i].body, 'height', this._fixPx(this.options.height));
		
		}
	},
	_openMenu: function(event, _target, obj) {		
		//close all the blocks before the main menu
		if($WI.Check(this.options.async, true) == false) {
			for(var i=0;i<this.menus.length;i++) 
				if(obj != this.menus[i])
					this._closeMenu(null, null, this.menus[i], true);
		}				
		
		if(this.options.height)	var hb = parseInt(this.options.height);
		else var hb = this._getHeight(obj.body.content);		
		obj.openned = true;			
		this._removeClass(obj.arrow, 'element-sliding-blocks-header-arrow-closed');		
		
		if(this._getHeight(obj.body)==0)
			$WI.Animation({tweening: 'tweenOut', obj: obj.body, style: 'height', from: 0, to: hb, speed: (this.options.speed)?this.options.speed:20});				
	},
	_closeMenu: function(event, _target, obj, forceclose){			
		if($WI.Check(this.options.async, true) == false && event) return; 
		
		if(this.options.height)	var hb = parseInt(this.options.height);
		else var hb = this._getHeight(obj.body.content);
		obj.openned = false;		
		this._addClass(obj.arrow, 'element-sliding-blocks-header-arrow-closed');		
  	
		if(this._getHeight(obj.body))
			$WI.Animation({tweening: 'tweenOut', obj: obj.body, style: 'height', from: hb, to: 0, speed: (this.options.speed)?this.options.speed:20});	
	},
	_menuEvent: function(event, _target, obj) {	
		if(!obj.openned) this._openMenu(event, _target, obj);
		else this._closeMenu(event, _target, obj);
	},
	_createClass: function(obj, parentCls) {		
		var before, after;
		if(typeof parentCls=='object') {			
			if(parentCls.before)before=parentCls.before;
			if(parentCls.after)after=parentCls.after;
			parentCls = parentCls.main;
		}		
		var clsReturn = (parentCls)?parentCls:'';			
		if(before) clsReturn = before + ' ' + clsReturn;
		for(var i = 0; i < obj.length; i++) {
			if(parentCls) clsReturn += ' ' + parentCls;
			clsReturn += obj;		
		}
		if(after) clsReturn =  clsReturn + ' ' + after;
		return clsReturn;
	}
});
