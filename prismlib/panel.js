/***********************************************************
* PANEL LAYOUT CLASS
*	Designed & developed by Dima Svirid, 2009	
*	Class: panel.js
* Extends: system.js, dragdrop.js
************************************************************/
$WI.VPanel = function(options) {
	return new $WI.Class.Panel().VPanel(options);
};
$WI.HPanel = function(options) {
	return new $WI.Class.Panel().HPanel(options);
};
$WI.VPanelStatic = function(options) {
	return new $WI.Class.PanelStatic().VPanel(options);
};
$WI.HPanelStatic = function(options) {
	return new $WI.Class.PanelStatic().HPanel(options);
};

$WI.Class.PanelStatic = new $WI.Class({	
	VPanel: function(options) {			
		this.__name = 'vpanel';
		return this._Panel(options);
	},
	HPanel: function(options) {
		this.__name = 'hpanel';
		return this._Panel(options);
	},
	Add: function(options) {
		if(!options) var options = {};	
		var panel = this._subPanel(options);	
		if(options.auto) panel.auto = true;
		panel.SetWidth = this.SetWidth;
		panel.SetHeight = this.SetHeight;
		if(options.width) panel.SetWidth(options.width);
		if(options.height) panel.SetHeight(options.height);		
		panel.GetContent = this.GetContent;
			
		this.AjustDivs();
		return panel;
	},
	Content: function(where, content) {		
		this._visible($E(content), true);		
		where.appendChild($E(content));
	},
	GetBody: function() {
		return this.obj;		
	},	
	GetContent: function() {
		return this;		
	},	
	SetWidth: function(size) {
		if(size.toString().indexOf('%')!=-1) { 
			var w = $WI.DOM._getWidth(this.obj);
			var size = $WI.DOM._convertP$Px(size, w);	
		}		
		$WI.DOM._setStyle(this, 'width', $WI.DOM._fixPx(size));		
	},
	SetHeight: function(size) {		
		if(size.toString().indexOf('%')!=-1) {
			var h = $WI.DOM._getHeight(this.obj);
			var size = $WI.DOM._convertP$Px(size, h);	
		}		
		$WI.DOM._setStyle(this, 'height', $WI.DOM._fixPx(size));		
	},	
	Write: function(where) {			
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');
		return this;				
	},
	AjustDivs: function() {
		var panels = this._getChildren(this.obj);
		var auto = panels.Search(true, 'auto');
		
		//ajust main div size	
		if(this.obj.parentNode.tagName.toLowerCase() == 'body') {
			var wh = this._getClientWH();
			w = wh.w;
			h = wh.h;
		} else {
			if(this.__name == 'vpanel')
				w = this._getWidth(this.obj.parentNode);
			else
				h = this._getHeight(this.obj.parentNode);
		}
		
		var __total = 0;
		__total = this._getStyleInt(this.obj, (this.__name == 'vpanel') ? 'paddingLeft' : 'paddingTop') + this._getStyleInt(this.obj, (this.__name == 'vpanel') ? 'paddingRight' : 'paddingBottom');

		for(var i=0;i<panels.length;i++) {
			if(!panels[i].auto)
				if(this.__name == 'vpanel') {
					__total += this._getWidth(panels[i]);	
				} else {					
					__total += this._getHeight(panels[i]);	
				}		
		}		

		if(auto != -1 && panels[auto])
			if(this.__name == 'vpanel') {			
				//TO 
			} else if(this.__name == 'hpanel' && __total > 0) {			
				panels[auto].SetHeight(h - __total);
			}
		
	},
	_Panel: function(options){
		this.obj = this._createDOM({objType: 'div', objClass: 'element-panel-static'});	
		if(options.objClass) this._addClass(this.obj, options.objClass);
		if(options.__super)
			this.AddEvent({obj: options.__super, type: 'resizeapp', onevent: this.AjustDivs});
		return this;
	},
	_subPanel: function(options) {	
		var panel = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-panel-static-' + this.__name}, 'insertinto');
		if(options.objClass) this._addClass(panel, options.objClass);
		return panel; 	
	}
});

$WI.Class.Panel = new $WI.Class({	
	VPanel: function() {			
		this.__name = 'vpanel';
		return this._Panel();
	},
	HPanel: function() {
		this.__name = 'hpanel';
		return this._Panel();
	},
	Add: function(options) {
		if(!options) var options = {};
		var panel = this._subPanel(options);	
		panel.obj = this.obj;
		panel.options = options;
		panel.GetContent = this.GetContent;
		panel.SetWidth = this.SetWidth;
		panel.SetHeight = this.SetHeight;
		if(options.width) panel.SetWidth(options.width);
		if(options.height) panel.SetHeight(options.height);		
		this.obj.panels.push(panel);	
			  
		this._ajustDivs();
		
		return panel;
	},
	Content: function(where, content) {		
		this._visible($E(content), true);		
		where.content.appendChild($E(content));
	},
	GetBody: function() {
		return this.obj;		
	},
	SetWidth: function(size) {
		if(size.toString().indexOf('%')!=-1) { 
			var w = $WI.DOM._getWidth(this.obj);
			var size = $WI.DOM._convertP$Px(size, w);	
		}		
		$WI.DOM._setStyle(this, 'width', $WI.DOM._fixPx(size));		
	},
	SetHeight: function(size) {		
		if(size.toString().indexOf('%')!=-1) {
			var h = $WI.DOM._getHeight(this.obj);
			var size = $WI.DOM._convertP$Px(size, h);	
		}		
		$WI.DOM._setStyle(this, 'height', $WI.DOM._fixPx(size));		
	},
	GetContent: function() {
		return this.content;		
	},		
	Write: function(where) {			
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');
		//ajust main 
		this.AjustDivs();
		//COMMENTED OUT HANDLED BY THE MAIN APPLICATION RESIZE EVENT
		//when panel goes into the panel automatically add resize event to them
		//if(this._hasClass(where, 'element-panel-content')) {
			//find very main parent first
			//var _main = this._getParent(where, {byClassName: 'element-panel'});			
			//if(_main&&_main.Class)
				//this.AddEvent({obj: _main.Class, type: 'resized', onevent: this.AjustDivs});
		//}			
		return this;				
	},	
	Resize: function(what, to) {
		if(what.resizer) {						
			if(this.__name == 'hpanel') {
				var h = this._getHeight(what) + this._getHeightBefore(what);			
				this._setStyle(what.resizer, 'top', this._fixPx(to-h));
			} else {
				var w = this._getWidth(what) + this._getWidthBefore(what);			
				this._setStyle(what.resizer, 'left', this._fixPx(to-w));
			}
			this.Fire(null, 'drop', what.resizer);			
		}
	},
	AjustDivs: function(event, _target, obj) {
		var w, h = null;
		//ajust main div size	
		if(this.obj.parentNode.tagName.toLowerCase() == 'body') {
			var wh = this._getClientWH();
			w = wh.w;
			h = wh.h;
		} else {
			if(this.__name == 'vpanel')
				w = this._getWidth(this.obj.parentNode);
			else
				h = this._getHeight(this.obj.parentNode);
		}
		this._applyConfig(this.obj, {width: (w ? this._fixPx(w) : '100%'), height: (h ? this._fixPx(h) : '100%')});
		var __total = 0;
		for(var i=0;i<this.obj.panels.length;i++) {
			if(this.__name == 'vpanel') {
				__total += this._getWidth(this.obj.panels[i]);	
				if(this.obj.panels[i].resizer) 
					__total += this._getWidth(this.obj.panels[i].resizer);		
			} else if(this.__name == 'hpanel') {
				__total += this._getHeight(this.obj.panels[i]);	
				if(this.obj.panels[i].resizer) 
					__total += this._getHeight(this.obj.panels[i].resizer);		
			}
		}
		if(this.__name == 'vpanel') {			
			var el = this.obj.panels[this.obj.panels.length-1];
			if(__total > w) el.SetWidth(this._getWidth(el) - (__total-w)); 
			else if(__total && __total < w) el.SetWidth(this._getWidth(el) + (w-__total));
		} else if(this.__name == 'hpanel' && __total > 0) {			
			var el = this.obj.panels[this.obj.panels.length-1];
			if(__total > h)	el.SetHeight(this._getHeight(el) - (__total-h));
			else el.SetHeight(this._getHeight(el) + (h-__total));			
		}
		if(this.__super && obj != this.__super) this.__super.Resize();	
	},
	_ajustDivs: function() {		
		var __start = 0;
		var w = this._getWidth(this.obj);
		var h = this._getHeight(this.obj);
		for(var i=0;i<this.obj.panels.length;i++) {
			if(this.__name == 'vpanel') {
				//ajust panel
				this._setStyle(this.obj.panels[i], 'left', this._fixPx(__start));
				__start += this._getWidth(this.obj.panels[i]);				
				//ajust resizer
				if(this.obj.panels[i].resizer) {
					this._setStyle(this.obj.panels[i].resizer, 'left', this._fixPx(__start));
					__start += this._getWidth(this.obj.panels[i].resizer);
				}
			} else if(this.__name == 'hpanel') {
				//ajust panel
				this._setStyle(this.obj.panels[i], 'top', this._fixPx(__start));
				__start += this._getHeight(this.obj.panels[i]);				
				//ajust resizer
				if(this.obj.panels[i].resizer) {
					this._setStyle(this.obj.panels[i].resizer, 'top', this._fixPx(__start));
					__start += this._getHeight(this.obj.panels[i].resizer);
				}
			}
		}	
		if(this.__super) this.__super.Resize();
	},
	_Panel: function(){
		this.obj = this._createDOM({objType: 'div', objClass: 'element-panel'});	
		this.obj.Class = this;		
		this.obj.panels = [];		
		return this;
	},
	_subPanel: function(options) {		
		//create main panel layer
		var panel = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-' + this.__name}, 'insertinto');	
		//create content panel layer
		panel.content = this._insertDOM(panel, {objType: 'div', objClass: 'element-panel-content'}, 'insertinto');		
		panel.fixedSize = options.fixedSize; 
		
		if(this.obj.panels.length > 0) {
			//lets get the previous block to assign everyhting to it
			var _panel = this.obj.panels[this.obj.panels.length-1];
			//create an actual resizer layer, and paste it into the space
			_panel.resizer = this._insertDOM(_panel, {objType: 'div', objClass: 'element-panel-resizer-' + this.__name}, 'insertafter');
			_panel.resizer.options = {panel: _panel, _this: this, fixedSize: options.fixedSize};
			if(!_panel.fixedSize) {
				/*
				_panel.resizer.button1 = this._insertDOM(_panel.resizer, {objType: 'div', objClass: 'element-panel-button1-' + this.__name}, 'insertinto');
				_panel.resizer.button2 = this._insertDOM(_panel.resizer, {objType: 'div', objClass: 'element-panel-button2-' + this.__name}, 'insertinto');
				
				//create a mouseover arrows
				this.AddEvent({obj: _panel.resizer, type: 'mouseover', onevent: this._onMouseResizeEvent});
				this.AddEvent({obj: _panel.resizer, type: 'mouseout', onevent: this._onMouseResizeEvent});
				this.AddEvent({obj: _panel.resizer.button1, type: 'mouseover', onevent: this._onMouseResizeEvent});
				this.AddEvent({obj: _panel.resizer.button2, type: 'mouseout', onevent: this._onMouseResizeEvent});
				this.AddEvent({obj: _panel.resizer.button1, type: 'click', onevent: this._onMouseResizeEvent});
				this.AddEvent({obj: _panel.resizer.button2, type: 'click', onevent: this._onMouseResizeEvent});
				*/
				
				if(this.__name == 'vpanel')
					_panel.resizer_obj = $WI.Drag(_panel.resizer, {moveY: false, limits: {left: this._dragLimit, right: this._dragLimit}});
				else 
					_panel.resizer_obj = $WI.Drag(_panel.resizer, {moveX: false, limits: {top: this._dragLimit, bottom: this._dragLimit}});
				_panel.resizer_obj.UseProxy({parent: this.obj, objClass: 'element-panel-resizer element-panel-resizer-proxy'});			
				//create a cover to fix issues with the iframes
				_panel.resizer_obj.AddEvent({type: 'startdrag', obj: _panel.resizer_obj.GetBody(), onevent: this._coverPanels});				
				_panel.resizer_obj.AddEvent({type: 'drop', obj: _panel.resizer_obj.GetBody(), onevent: (this.__name == 'vpanel') ? this._dropVPanel : this._dropHPanel});
			} else {
				this._isDisplay(_panel.resizer, false);
				this._setStyle(_panel.content, 'overflow', 'hidden');
			}
		}			
		return panel; 	
	},
	_getNextIndex: function(index) {
		for(var i=index+1;i<this.obj.panels.length;i++)
			if(!this.obj.panels[i].fixedSize)
				return this.obj.panels[i];
		return null;
	},
	_coverPanels: function(event, _target, obj) {
		var _this = obj.options._this;
		if(_this.obj.panels)
			for(var i=0;i<_this.obj.panels.length;i++) {
				this._insertDOM(_this.obj.panels[i], {objType: 'div', objClass: 'element-panel-cover'}, 'insertinto');
			}
	},
	_coverPanelsDisable: function () {
		if(this.obj.panels)
			for(var i=0;i<this.obj.panels.length;i++) 
				this._apply(this._getChildren(this.obj.panels[i], {byClassName: 'element-panel-cover'}), this._removeDOM);
	},
	_dropHPanel: function(event, _target, obj) {			
		var _this = obj.options._this;
		_this._coverPanelsDisable();//fix covers		
		var panel = obj.options.panel;
		var index = _this.obj.panels.Search(panel);				
		var newy = this._getXY(obj, true).y - _this._getHeightBefore(panel);
		var oldh = this._getHeight(panel);		
		this._setStyle(panel, 'height', this._fixPx(newy));				
		var nextIdx = _this._getNextIndex(index);		
		if(nextIdx) {
			var newh = this._getHeight(nextIdx)-(newy-oldh);
			this._setStyle(nextIdx, 'height', this._fixPx(newh));
		}		
		//fire resized event
		_this._ajustDivs();
		
		this.Fire(null, 'resized', _this);
	},
	_dropVPanel: function(event, _target, obj) {
		var _this = obj.options._this;
		_this._coverPanelsDisable();//fix covers
		var panel = obj.options.panel;
		var index = _this.obj.panels.Search(panel);				
		var newx = this._getXY(obj, true).x - _this._getWidthBefore(panel);
		var oldw = this._getWidth(panel);		
		this._setStyle(panel, 'width', this._fixPx(newx));				
		var nextIdx = _this._getNextIndex(index);		
		if(nextIdx) {
			var neww = this._getWidth(nextIdx)-(newx-oldw);
			this._setStyle(nextIdx, 'width', this._fixPx(neww));
		}		
		_this._ajustDivs();			
		
		//fire resized event
		this.Fire(null, 'resized', _this);	
	},
	_getWidthBefore: function(item) {
		var _width = 0;			
		for(var i=0;i<this.obj.panels.length;i++) {		
			if(this.obj.panels[i] == item) return _width;			
			_width += this._getWidth(this.obj.panels[i]) + this._getWidth(this.obj.panels[i].resizer);					
		}
	},
	_getHeightBefore: function(item) {
		var _height = 0;
		for(var i=0;i<this.obj.panels.length;i++) {		
			if(this.obj.panels[i] == item) return _height;
			_height += this._getHeight(this.obj.panels[i]) + this._getHeight(this.obj.panels[i].resizer);					
		}
	},
	_dragLimit: function(_target, type) {		
		var _this = _target.options._this;
		var _panel = _target.options.panel;									
		if(type=='right'){			
			var _before = _this._getWidthBefore(_panel);	
			var _target_w = this._getWidth(_target);
			var _index = _this.obj.panels.Search(_panel);
			var w = this._getWidth(_panel);
			var w_next = 0;
			var w_next_panel = _this._getNextIndex(_index);	
			if(w_next_panel) w_next = this._getWidth(w_next_panel); 				
			return _before+w_next+w-_target_w;		
		} else if(type=='left') {
			var _before = _this._getWidthBefore(_panel);	
			var _target_w = this._getWidth(_target);
			return _before+_target_w;
		} else if(type=='top') {
			var _before = _this._getHeightBefore(_panel);	
			var _target_h = this._getHeight(_target);
			return _before+_target_h;
		} else if(type=='bottom') {
			var _before = _this._getHeightBefore(_panel);	
			var _target_h = this._getHeight(_target);
			var _index = _this.obj.panels.Search(_panel);
			var h = this._getHeight(_panel);
			var h_next = 0;
			var h_next_panel = _this._getNextIndex(_index);	
			if(h_next_panel) h_next = this._getHeight(h_next_panel); 				
			return _before+h_next+h-_target_h;
		}
	},
	_onMouseResizeEvent: function(event, _target, obj) {
		if(event.type=='mouseover') {
			if(this._remove_buttons_timeout) clearTimeout(this._remove_buttons_timeout);
			var mouseXY = this._getMouseXY(event);			
			this._applyConfig((obj.button1) ? obj.button1 : obj, {left: this._fixPx(mouseXY.x-12)});
			this._applyConfig((obj.button2) ? obj.button2 : obj, {left: this._fixPx(mouseXY.x-12)});
			this._isDisplay((obj.button1) ? obj.button1 : obj, true);
			this._isDisplay((obj.button2) ? obj.button2 : obj, true);
		} else if(event.type=='mouseout') {
			this._remove_buttons_timeout = setTimeout(function(){
				this._isDisplay((obj.button1) ? obj.button1 : obj, false);
				this._isDisplay((obj.button2) ? obj.button2 : obj, false);
			}.Apply(this), 1000);
		} else if(event.type=='click') {			
			var panel = obj.parentNode.options.panel;
			var op = obj.parentNode;
			if(op.__previous) {		//move back resizer		
				this._setStyle(op, 'top', this._fixPx(op.__previous));
				delete op.__previous;				
			} else if(this._hasClass(obj, 'element-panel-button1-hpanel')) {	
				op.__previous = this._getStyleInt(op, 'top');
				this._setStyle(op, 'top', this._fixPx(this._getHeightBefore(panel)));
				this._dropHPanel(event, _target, op);				
			} else if(this._hasClass(obj, 'element-panel-button2-hpanel')) {					
				var index = this.obj.panels.Search(panel);	
				var nextIdx = this._getNextIndex(index);		
				if(nextIdx) {
					op.__previous = this._getStyleInt(op, 'top');
					this._setStyle(op, 'top', this._fixPx(this._getHeightBefore(nextIdx)+this._getHeight(nextIdx)-this._getHeight(op)));						
				}					
			}
			this._dropHPanel(event, _target, op);			
		}
		this._cancelEvent(event);
	}	
});
