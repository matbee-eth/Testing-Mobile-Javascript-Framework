/*********************************************************
*		WINDOWS 2.0 CLASS
*		Designed & developed by Dima Svirid, 2008	
*		Class: windows2.0.js
*	  Extends: system.js, dragdrop.js
*********************************************************/
$WI.Class.Window = new $WI.Class({
	Create: function(options) {			
		if(!options) var options = {};
		this.options = options;		
		this.dragdrop = true;
		
		if(this.options.top) this.options.top = this._fixPx(parseInt(this.options.top)+this._getScrollXY().y);
		if(this.options.left) this.options.left = this._fixPx(parseInt(this.options.left)+this._getScrollXY().x);
		
		if(this.options.right) {
			delete this.options.left;
			this.options.right = this._fixPx(parseInt(this.options.right)-this._getScrollXY().x);
		}
		if(this.options.bottom) {
			delete this.options.top;
			this.options.bottom = this._fixPx(parseInt(this.options.bottom)-this._getScrollXY().y);
		}
		
		
		//if(this.__window_options.right) delete this.__window_options.left;
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-window-v2', config: this.options});	
		
		//IE6 Object Priority Fix
		if(this._isIE6())
			this._insertDOM(this.obj, {objType: 'iframe', position: 'absolute', width: '100%', height: '100%', frameBorder: 0, top: '2px'}, 'insertinto');
		
		//header	
		this.header = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-window-header'}, 'insertinto');
		this.header.right = this._insertDOM(this.header, {objType: 'div', objClass: 'element-window-header-right'}, 'insertinto');
		this.header.center = this._insertDOM(this.header.right, {objType: 'div', objClass: 'element-window-header-center'}, 'insertinto');
		this.header.icon = this._insertDOM(this.header.center, {objType: 'img', objClass: 'element-window-header-icon png', src: this.options.icon, display: 'none', align: 'left'}, 'insertinto');

		if(this.options.icon)
			this._isDisplay(this.header.icon, true);
	
		this.header.txt = this._insertDOM(this.header.center, {objType: 'div', objClass: 'element-window-header-label', html: (this.options.label)?this.options.label:''}, 'insertinto');
	
		var buttons = this._insertDOM(this.header, {objType: 'div', objClass: 'element-window-header-buttons'}, 'insertinto');
		this.header.minimize = this._insertDOM(buttons, {objType: 'div', objClass: 'element-window-header-button element-window-header-button-min'}, 'insertinto');		
		this.header.maximize = this._insertDOM(buttons, {objType: 'div', objClass: 'element-window-header-button element-window-header-button-max'}, 'insertinto');		
		this.header.closeit = this._insertDOM(buttons, {objType: 'div', objClass: 'element-window-header-button element-window-header-button-close'}, 'insertinto');		
		
		this.AddEvent({type: 'maximizewindow', obj: this, onevent: this._onButtonEvent});
		this.AddEvent({type: 'minimizewindow', obj: this, onevent: this._onButtonEvent});
		this.AddEvent({type: 'closewindow', obj: this, onevent: this._closeWindowEvent});
		
		this.AddEvent({type: 'mousedown', obj: this.header.closeit, onevent: this.CloseWindow});
		
		//this.AddEvent({type: 'mousedown', obj: this.header.closeit, onevent: {fire: 'closewindow', obj: this}});
		this.AddEvent({type: 'mousedown', obj: this.header.minimize, onevent: {fire: 'minimizewindow', obj: this}});
		this.AddEvent({type: 'mousedown', obj: this.header.maximize, onevent: {fire: 'maximizewindow', obj: this}});
		
		this.AddEvent({type: 'mouseover', obj: this.header.minimize, onevent: this._onButtonEvent});
		this.AddEvent({type: 'mouseout', obj: this.header.minimize, onevent: this._onButtonEvent});
		this.AddEvent({type: 'mouseover', obj: this.header.maximize, onevent: this._onButtonEvent});
		this.AddEvent({type: 'mouseout', obj: this.header.maximize, onevent: this._onButtonEvent});
		this.AddEvent({type: 'mouseover', obj: this.header.closeit, onevent: this._onButtonEvent});
		this.AddEvent({type: 'mouseout', obj: this.header.closeit, onevent: this._onButtonEvent});
		
		//this.AddEvent({type: 'dblclick', obj: this.header, onevent: {fire: 'maximizewindow', obj: this}});
		
		if(this.options.windowType=='layer') { 
			this._setStyle(this.obj, 'position', 'absolute');
			this.options.drag=false;
			this._isDisplay(this.header, false);
		}
		
		this.wrapper = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-window-wrapper'}, 'insertinto');		
		
		//body
		this.body = this._insertDOM(this.wrapper, {objType: 'div', objClass: 'element-window-body'}, 'insertinto');
		this.body.right = this._insertDOM(this.body, {objType: 'div', objClass: 'element-window-body-right'}, 'insertinto');
		this.body.center = this._insertDOM(this.body.right, {objType: 'div', objClass: 'element-window-body-center', overflow: 'hidden'}, 'insertinto');
		
		this.body.center.content = this._insertDOM(this.body.center, {objType: 'div', objClass: 'element-window-body-content', overflow: 'hidden', config: (this.options.textArea)?this.options.textArea:{}}, 'insertinto');
		
		if(this.options.scroll)	{
			this._setStyle(this.body.center, 'overflow', this.options.scroll);
			if(this._isIE6())
				this._setStyle(this.body.center, 'marginRight', '18px');
		}
		if(this.options.scrollX)	this._setStyle(this.body.center, 'overflowX', this.options.scrollX);
		if(this.options.scrollY) {
			this._setStyle(this.body.center, 'overflowY', this.options.scrollY);
			if(this._isIE6())
				this._setStyle(this.body.center, 'marginRight', '18px');
		}
				
		//footer
		this.footer = this._insertDOM(this.wrapper, {objType: 'div', objClass: 'element-window-footer'}, 'insertinto');
		this.footer.right = this._insertDOM(this.footer, {objType: 'div', objClass: 'element-window-footer-right'}, 'insertinto');
		this.footer.center = this._insertDOM(this.footer.right, {objType: 'div', objClass: 'element-window-footer-center'}, 'insertinto');
		this.footer.icon = this._insertDOM(this.footer.center, {objType: 'img', objClass: 'element-window-footer-icon png', src: '/api2.0/src/images/indicator_arrows.gif', display: 'none', align: 'left'}, 'insertinto');	
		this.footer.txt = this._insertDOM(this.footer.center, {objType: 'div', objClass: 'element-window-footer-label'}, 'insertinto');
		
		this.objActive = [{obj: this.wrapper, resize: true}, {obj: this.body, resize: true}];
		
		if(this.header)
			this._cancelSelect(this.header);
		if(this.footer)
			this._cancelSelect(this.footer);

		//handle window buttons options
		this.Minimize($WI.Check(this.options.minwindow, true));
		this.Maximize($WI.Check(this.options.maxwindow, true));		
		this.Close($WI.Check(this.options.closewindow, true));		
			
  	return this.obj;	  
	},	
	Content: function(content) {			
		if(typeof content == 'string') var content = $E(content);
		if(content) {
			this._insertDOM(this.body.center.content, {newNode: content}, 'insertinto');
			this._visible(content, true);
		}
	},
	CloseWindow: function(event, _target, obj) {		
		if($WI.Check(this.options.closewindow, true) == false) return;
		if($WI.Check(this.options.hideMode, false)) {
			this._isDisplay(this.shadow, false);
			this._isDisplay(this.obj, false);			
		} else {		
			this._closeWindow();				
		}		
		this.Fire(null, 'closewindow', this);
		if(event)	this._cancelEvent(event);
	},
	ShowWindow: function(event, _target, obj) {
		if($WI.Check(this.options.hideMode, false)) {		
			this._isDisplay(this.shadow, true);
			this._isDisplay(this.obj, true);	
		} else {
			this.Create(this.options);
			this.Write();
		}
		this.Fire(null, 'openwindow', this);
		if(event)	this._cancelEvent(event);
	},
	OnWindowOpen: function(obj, _this) {		
	},
	OnWindowClosed: function(obj, _this) {			
	},
	OnWindowDrop: function(event) {		
		this.AddEvent({obj: this.obj, type: 'drop', onevent: event});
	},
	OnWindowDrag: function(event) {		
		this.AddEvent({obj: this.obj, type: 'drag', onevent: event});
	},
	Animation: function(options) {		
		options.onOpen = this.OnWindowOpen;
		this.Write(null, {OnWindowOpen: true});	
		options.obj = this.obj;		
		this._Animation(options);		
	},	
	RegisterActiveObj: function(config) {
		if(this.dragdrop)
			this.dragdrop.RegisterActiveObj(config);
		else 
			this.objActive.push(config);
	},
	GetBody: function() {
		return this.obj;
	},
	GetContent: function() {
		return this.body.center.content;
	},		
	SetHeaderIcon: function(icon) {	
		if(!this.header) return;
		this._isDisplay(this.header.icon, true);
		this.header.icon.src = icon;		
	},
	GetTitle: function() {	
		return this.header.txt.innerHTML;
	},
	SetTitle: function(txt) {	
		return this.SetTitleText(txt);
	},
	SetTitleText: function(txt) {	
		if(!this.header) return;
		this.header.txt.innerHTML = (txt)?txt:'';
	},
	SetFooterText: function(txt) {	
		this.footer.txt.innerHTML = (txt)?(txt=='wait')?'Please wait...loading':txt:'';
	},
	EnableFooterIcon: function(status) {	
		this._isDisplay(this.footer.icon, ($WI.Check(status, true))?true:false);
	},	
	Close: function(status) {	
		var status = $WI.Check(status, true);
		this.options.closewindow = status;
		if(status) this._removeClass(this.header.closeit, 'element-window-header-button-close-disabled');
		else this._addClass(this.header.closeit, 'element-window-header-button-close-disabled');		
	},
	Maximize: function(status) {	
		var status = $WI.Check(status, true);
		this.options.maximize = status;
		if(status) this._removeClass(this.header.maximize, 'element-window-header-button-max-disabled');
		else this._addClass(this.header.maximize, 'element-window-header-button-max-disabled');	
	},
	Minimize: function(status) {	
		var status = $WI.Check(status, true);
		this.options.minimize = status;
		if(status) this._removeClass(this.header.minimize, 'element-window-header-button-min-disabled');
		else this._addClass(this.header.minimize, 'element-window-header-button-min-disabled');
	},
	IsFullscreen: function() {	
		return (this.wrapper.fullscreen) ? true : false;
	},
	Write: function(where, options) {		
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		

		if((!this.options.top||!this.options.left) && !this.options.right && !this.options.bottom)
			this._centerObject(this.GetBody());		
		
		if($WI.Check(this.options.drag, true)&&$WI.Class.DragDrop) {			
			var opts = {handler: [this.header, this.footer]};
			$WI._append(opts, this.options);
			this.dragdrop = $WI.Drag(this.obj, opts);
			if(this.options.proxy)
				this.dragdrop.UseProxy({objClass: this.options.proxy});				
			
			if($WI.Check(this.options.resize,true))
				this.dragdrop.Resize(this.obj, {parentClass: 'element-resizeable'});		

			this.dragdrop.RegisterActiveObj(this.objActive);	
			
			//add drag events
			this.AddEvent({obj: this.obj, type: 'startdrag', onevent: this._onDragEvent});
			this.AddEvent({obj: this.obj, type: 'drag', onevent: this._onDragEvent});
			this.AddEvent({obj: this.obj, type: 'drop', onevent: this._onDragEvent});
		}
			
		
		this.body.overflow_type = this._getStyle(this.body.center, 'overflow');
		this.body.overflow_type_x = this._getStyle(this.body.center, 'overflowX');
		this.body.overflow_type_y = this._getStyle(this.body.center, 'overflowY');
		
		//create shadow
		if($WI.Check(this.options.shadow, true))
			this.shadow = this._insertDOM((where&&$E(where))?$E(where):null, {objType: 'img', src: '/api2.0/src/images/shadow_sharp.png', objClass: 'element-window-v2-shadow png'}, 'insertinto');
		
		this.AjustDivs();
			
		this.Fire(null, 'windowopened', this);
		
		if(this.options.fullscreen) this.OnMaximizeWindow();
	
		//disable screen first for dialog windows
		if(this.options.windowType == 'dialog') {
			this.AddEvent({obj: this, type: 'openwindow', onevent: function(){$WI.Screen.DisableScreen({enableOnClick: false});this._maxZ();}});
			this.AddEvent({obj: this, type: 'closewindow', onevent: function(){$WI.Screen.EnableScreen();}});
		}		
		this.Fire(null, 'openwindow', this);		
		this.MaxZIndex();
	},
	MaxZIndex: function() {
		this._maxZ(this.obj);
		this._setStyle(this.shadow, 'zIndex', this._getStyleInt(this.obj, 'zIndex')-1);
	},
	CenterWindow: function() {
		this._centerObject(this.GetBody());
		this.AjustDivs();
	},
	AjustDivs: function(){
		var h = this._getHeight(this.obj);
		var hh = this._getHeight(this.header);
		var hf = this._getHeight(this.footer);
		var shadow_size = 5; 
		
		if(!this.wrapper.closed) {
			this._applyConfig(this.wrapper, {height: this._fixPx(h-hh), width: 'auto'});	
			this._applyConfig(this.body, {height: this._fixPx(h-hh-hf), width: 'auto'});	
		}
		
		if(this.shadow) {		
			this._applyConfig(this.shadow, {left: ((this.options.left!=null||this.options.right==null) ? this._fixPx(this._getStyleInt(this.obj, 'left')-shadow_size) : null), top: ((this.options.top!=null||this.options.bottom==null) ? this._fixPx(this._getStyleInt(this.obj, 'top')-shadow_size) : null), right: ((this.options.right!=null) ? this._fixPx(this._getStyleInt(this.obj, 'right')-shadow_size) : null), bottom: ((this.options.bottom!=null) ? this._fixPx(this._getStyleInt(this.obj, 'bottom')-shadow_size) : null), width: this._fixPx(this._getStyleInt(this.obj, 'width')+shadow_size*2), height: this._fixPx(this._getStyleInt(this.obj, 'height')+shadow_size*2)});
			
		}
		
		
	},
	AjustHeight: function() {	
		var cH = this._getHeight(this.obj);
		var bH = this._getHeight(this.GetContent());
		var bpTH = this._getStyleInt(this.GetContent(), 'paddingTop');
		var bpBH = this._getStyleInt(this.GetContent(), 'paddingBottom');
		var tP = 0;
		if(this.options.textArea&&this.options.textArea.padding) tP = parseInt(this.options.textArea.padding);
		this._setStyle(this.GetContent(), 'overflow', 'visible');
		this._setStyle(this.GetContent(), 'height', 'auto');
		var oH = this._getHeight(this.GetContent());	
		this._setStyle(this.obj, 'height', this._fixPx(cH+(oH-bH)+tP+bpTH+bpBH));
		this.AjustDivs();
	},
	ResizeWindow: function(options) {			
		if(options._height)
			this._setStyle(this.obj, 'height', this._fixPx(this._getStyleInt(this.obj, 'height')+options._height));
		this.AjustDivs();
	},	
	HideWindowLayer: function(event, _target, obj) {			
		this._isDisplay(this.obj, false);
		this._isDisplay(this.shadow, false);
	},
	OnMaximizeWindow: function(event, _target, obj) {			
		//currently in fullscreen lets move back
		if(this.wrapper.fullscreen) {
			//set status
			var __data = this.wrapper.fullscreen;
			this.wrapper.fullscreen = null;
			this.dragdrop.disabled = false;
			this._isDisplay(this.shadow, true);
			this._applyConfig(this.obj, {top: this._fixPx(__data.top), left: this._fixPx(__data.left), width: this._fixPx(__data.width), height: this._fixPx(__data.height)});	
		
		} else {
			//set status
			var xy = this._getXY(this.obj);
			this.wrapper.fullscreen = {width: this._getWidth(this.obj), height: this._getHeight(this.obj), left: xy.x, top: xy.y};	
			this.dragdrop.disabled = true;
			//this.Minimize(false);
			this._isDisplay(this.shadow, false);				
			this.SetMaxWindow();
		}			
		this.AjustDivs();	
		this.Fire(null, 'resized', this);
	},
	OnMinizeWindow: function(event, _target, obj) {			
		if(obj.wrapper.closed) {				
			this._isDisplay(obj.wrapper, true);
			this._setStyle(this.GetBody(), 'height', this._fixPx(obj.wrapper.closed));
			obj.wrapper.closed = null;		
		}	else {
			obj.wrapper.closed = this._getHeight(this.GetBody());
			this._isDisplay(obj.wrapper, false);
			this._setStyle(this.GetBody(), 'height', this._fixPx(this._getHeight(obj.header)));			
		}	
		this.AjustDivs();	
	},
	_onButtonEvent: function(event, _target, obj) {		
		if(event && event.type=='mouseover') {
			switch(obj) {
				case this.header.minimize:
					this._addClass(obj, 'element-window-header-button-min-mouseover')
					break;
				case this.header.maximize:
					this._addClass(obj, 'element-window-header-button-max-mouseover')
					break;
				case this.header.closeit:
					this._addClass(obj, 'element-window-header-button-close-mouseover')
					break;
			}
		} else if(event && event.type=='mouseout') {
			switch(obj) {
				case this.header.minimize:
					this._removeClass(obj, 'element-window-header-button-min-mouseover')
					break;
				case this.header.maximize:
					this._removeClass(obj, 'element-window-header-button-max-mouseover')
					break;
				case this.header.closeit:
					this._removeClass(obj, 'element-window-header-button-close-mouseover')
					break;
			}			
		} else if(event && event.fire=='minimizewindow') {		
			
			if($WI.Check(this.options.minimize, true) == false) return;
			
			this.OnMinizeWindow(event, _target, obj);			
			
			this._cancelEvent(event);
			
		} else if(event && event.fire=='maximizewindow') {		
			//event true is passed to force fullscreen if maximazi is disabled
			if($WI.Check(this.options.maximize, true) == false) return;
			
			this.OnMaximizeWindow(event, _target, obj);			
			
			this._cancelEvent(event);
		}		
		return false;
	},
	SetMaxWindow: function() {
		var _parent = this.obj.parentNode;
		if(_parent.tagName.toLowerCase() == 'body') {
			var display = this._getClientWH();
			var w = display.w;
			var h = display.h;
		} else {
			var w = this._getWidth(_parent);
			var h = this._getHeight(_parent);
		}					
		this._applyConfig(this.obj, {top: '0px', left: '0px', width: this._fixPx(w), height: this._fixPx(h)});
	},
	_closeWindow: function() {
		this._visible(this.obj, false);
		this._visible(this.shadow, false);
		this._removeDOM(this.obj);
		this._removeDOM(this.shadow);		
	},
	_onDragEvent: function(event, _target, obj, fire) {
		if(this.dragdrop.disabled) return;
		if(event.fire=='startdrag') {
			this._isDisplay(this.shadow, false);
			if($WI.Check(this.options.drageffect, true)) {	//requred to disable drag effect in some cases
				this._setStyle(this.body.center, 'overflow', 'hidden');	
				this._isDisplay(this.body.center.content, false);
				this._setStyle(this.obj, 'opacity', .6);
			}
		} else if(event.fire=='drop') {
			if($WI.Check(this.options.drageffect, true)) { //requred to disable drag effect in some cases
				this._setStyle(this.obj, 'opacity', 1);
				if(this.body.overflow_type)	this._setStyle(this.body.center, 'overflow', this.body.overflow_type);	
				if(this.body.overflow_type_x)	this._setStyle(this.body.center, 'overflowX', this.body.overflow_type_x);
				if(this.body.overflow_type_y)	this._setStyle(this.body.center, 'overflowY', this.body.overflow_type_y);
				this._isDisplay(this.body.center.content, true);
			}

			this.options.right = null;this.options.bottom = null;//reset
			this._isDisplay(this.shadow, true);
			this.AjustDivs();	
			
			//lets detect if window was resized and fire RESIZED event on a object
			var w = this._getWidth(this.GetBody());
			var h = this._getHeight(this.GetBody());
			if(	w != parseInt(this.options.width) ||
					h != parseInt(this.options.height)) {
				this.options.width = this._fixPx(w);
				this.options.height = this._fixPx(h);
				//fire resize event
				this.Fire(null, 'resized', this);
			}
			
		
		} else if(event.fire=='drag') {					
			
		}
	},
	_closeWindowEvent: function(event, _target, obj) {						
	}
});
