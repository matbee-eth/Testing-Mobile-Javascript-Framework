/*********************************************************
*		DRAG & DROP CLASS	*	W,H,X,Y - static, w,h,x,y - dynamic
*		Designed & developed by Dima Svirid, 2007	
*		Class: dragdrop.js
*	  Extends: system.js
*********************************************************/
$WI.Drag = function(el, options) {
	return new $WI.Class.DragDrop().initDD(el, options);
};
$WI.Resize = function(el, options) {
	return new $WI.Class.DragDrop().initRE(el, options);
};
$WI.Draw = function(el, options) {
	return new $WI.Class.DragDrop().initDR(el, options);
};
$WI.DragDrop = function(event, _target, obj, options) { //obj is main parent event assigned too
	return new $WI.Class.DragDrop().initDragDrop(event, _target, obj, options);
};

$WI.Class.DragDrop = new $WI.Class({	
	Drag: function(el, config) {	
		this.initDD(el, config);
	}, 
	Resize: function(el, config) {	
		this.initRE(el, config);
	},	
	UseProxy: function(config) {	
		this.proxy = {};
		this.proxy.config = config;
	},
	CreateDDProxy: function(config) {
		if(config.newNode) this.proxyDD = config.newNode.call(); //call custom method to create custom proxy
		else {
			if(!config) var config = {};
			this.proxyDD = this.objDoc.createElement("div");			
			if(config) this._applyConfig(this.proxyDD, config);	
		}		
		this._addClass(this.proxyDD, 'element-drag-proxy');
		this._applyConfig(this.proxyDD, {opacity: .5, position: 'absolute', cursor: 'move', top: '0px'});
		this._insertDOM((config.parent)?config.parent:this.objDoc.body, {newNode: this.proxyDD}, 'insertfirst');		
		this._maxZ(this.proxyDD);
	},	
	GetBody: function(){
		return this.obj; 
	},	
	GetProxy: function(){		
		return this.objActive['proxy'];
	},	
	init: function() {	
		if(this.config.objDoc) this.objDoc = this.config.objDoc;
		else this.objDoc = D;
		this._registerDDEvents();	
		this.RegisterActiveObj({obj: this.obj, resize: $WI.Check(this.config.resize, true), move: $WI.Check(this.config.move, true)});
	},
	initDragDrop: function(event, _target, obj, config) {	
		if ((event.which && event.which == 3) || (event.button && event.button == 2)) return;

		if(!config) config = {};
		if(!config.Class || !config.Class.GetDragObject) return;
		var options = config.Class.GetDragObject.apply(config.Class, [_target]);
		if(options) {
			if(!$WI.IsArray(options)) options = [options];
			this.eventobject = obj;
			this.eventtarget = _target;
			this.eventclass = config.Class;
			this.eventvisible = false;
			var proxy =  this._insertDOM(null, {objType: 'div', objClass: 'element-dragdrop-proxy'}, 'insertinto');	
			this._insertDOM(proxy, {objType: 'div', objClass: 'element-dragdrop-proxy-shadow', opacity: .1}, 'insertinto');	
			proxy.body = this._insertDOM(proxy, {objType: 'div', objClass: 'element-dragdrop-proxy-body'}, 'insertinto');		
			
			proxy.item = this._insertDOM(proxy.body, {objType: 'div', objClass: 'element-dragdrop-proxy-item'}, 'insertinto');	
			proxy.item.node = this._insertDOM(proxy.item, {objType: 'div', objClass: 'element-dragdrop-proxy-item-sign'}, 'insertinto');
			proxy.item.icon = this._insertDOM(proxy.item, {objType: 'img', objClass: 'element-dragdrop-proxy-icon', src: options[0].icon}, 'insertinto');
			proxy.item.txt = this._insertDOM(proxy.item, {objType: 'div', objClass: 'element-dragdrop-proxy-text', html: options[0].title}, 'insertinto');						
			
			var xy = this._getMouseXY(event);
						
			this._applyConfig(proxy, {						
						top: this._fixPx(xy.y),
						left: this._fixPx(xy.x),
						visibility: 'hidden',
						width: this._fixPx(this._getWidth(proxy.item.txt) + 50)
			});				
			
			var _temp = this.Drag(proxy);this._Drag(event, proxy, proxy);			
			
			this.AddEvent({type: 'drag', obj: proxy, onevent: function(event, _target, obj) {
				this._cancelEvent(event);				
				$WI.Cursor();
				
				if(!this._visible(obj)) setTimeout(function(){$WI.DOM._visible(obj, true)}, 250); //make a delay
				
				this._applyConfig(obj, {						
						top: this._fixPx(this._getStyleInt(obj, 'top') + 10),
						left: this._fixPx(this._getStyleInt(obj, 'left') + 10)
				});								
				
				var _target = this._getParent(_target, {byEventType: 'ondropevent'});	
				if(_target)
					this._addClass(obj.item.node, 'element-dragdrop-proxy-item-signmove');
				else
					this._removeClass(obj.item.node, 'element-dragdrop-proxy-item-signmove');
			}});
			this.AddEvent({type: 'drop', obj: proxy, onevent: function(event, _target, obj) {
				this._removeDOM(obj); //must be after the Fire event
				
				this.RemoveEvent({obj: obj, type: 'startdrag'});
				this.RemoveEvent({obj: obj, type: 'drag'});
				this.RemoveEvent({obj: obj, type: 'drop'});
				
				if(this.eventtarget==_target) return; //no drag even has been performed, do nothing
				
				var _target = this._getParent(_target, {byEventType: 'ondropevent'});	
				if(_target) {
					event.reference = this.eventtarget;
					event.Class = this.eventclass;
					this.Fire(event, 'ondropevent', _target);			
				}		
			}});	
		
		}	
	},
	initDR: function(event, config) {	
		if(config.objDoc) this.objDoc = config.objDoc;
		else this.objDoc = D;
		
		var mouseXY = this._getMouseXY(event);
		
		this.CreateDDProxy({objDoc: config.objDoc, position: 'absolute', border: '1px solid #000000', backgroundColor: '#cccccc', left: this._fixPx(mouseXY.x), top: this._fixPx(mouseXY.y)});
		this.initDD(this.proxyDD, config);	
		this.AddEvent({type: 'drop', obj: this.proxyDD, onevent: this._removeDDProxy});
				
		$WI._append(this.proxyDD, {resizeX: true, resizeY: true, moveX: false, moveY: false, minWidth: 5, minHeight: 5});

		this._Drag(event, this.proxyDD, this.proxyDD);	
		
		return this;
	},
	initDD: function(el, config) {	
		this.handler = [];
		if(!this.config)this.config={};	
		if(config)$WI._append(this.config, config);
		if(!this.obj) this.obj = $E(el);		
		
		//this variable is required to manage objects with shadow
		if(!this.proxyParams) this.proxyParams = {top: 0, left: 0, right: 0, bottom: 0};
		
		if(this.config.handler&&!$WI.IsArray(this.config.handler)) this.handler.push($E(this.config.handler));	
		else if(this.config.handler&&$WI.IsArray(this.config.handler)) this.handler = this.config.handler;		 
		else if(el) this.handler.push($E(el));
		else if(this.obj) this.handler.push(this.obj);
		else return null;		
		
		this.obj.style.position = "absolute";
		this._maxZ();		
		
		for(var i=0;i<this.handler.length;i++) 
			this.AddEvent({type: 'mousedown',	obj: this.handler[i], onevent: {obj: this.obj, fire: 'startdrag'}});			

		this.init();		
		return this;
	},
	initRE: function(el, config) {	
		var _obj = this;			
		if(!this.config)this.config={};	
		if(config)$WI._append(this.config, config);
		
		if(el&&$E(el)) this.obj = $E(el);
		else if(!this.obj) return false;
		
		if(!this.config.parentClass) 			
			this.config.parentClass = 'element-resize-controls';
		
		//this variable is required to manage objects with shadow
		if(!this.proxyParams) this.proxyParams = {top: 0, left: 0, right: 0, bottom: 0};
		
		//handle images first		
		if(this.obj.tagName.toLowerCase()=='img') {
			var newNode = this._insertDOM(null, {objType: 'div', position: 'absolute', width: this._fixPx(this._getWidth()), height: this._fixPx(this._getHeight())});
			this._applyConfig(this.obj, {width: '100%', height: '100%', position: 'static', overflow: 'visible'});				
			this.obj = this._insertDOM(this.obj, {newNode: newNode}, 'replaceAppend');
		} 		
			
		//Enable resize by Y
		if($WI.Check(this.config.resizeY, true)) {
			if($WI.Check(this.config.resizeTop, true)) {
				var top_ns = this._insertDOM(this.obj, {objType: 'span', html: '<font />', objClass: this._createClass(['-top'], {main: this.config.parentClass, after: (this.config.afterClass)?'element-resizeable-top'+this.config.afterClass:''})}, 'insertinto');	
				$WI._append(top_ns, {resizeX: false, resizeY: true, moveX: false, moveY: true, reverse: true});
				this.AddEvent({type: 'mousedown',	obj: top_ns, onevent: {obj: this.obj, fire: 'startdrag'}});
			}
			if($WI.Check(this.config.resizeBottom, true)) {
				var bottom_ns = this._insertDOM(this.obj, {objType: 'span', html: '<font />', objClass: this._createClass(['-bottom'], {main: this.config.parentClass, after: (this.config.afterClass)?'element-resizeable-bottom'+this.config.afterClass:''})}, 'insertinto');				
				$WI._append(bottom_ns, {resizeX: false, resizeY: true, moveX: false, moveY: false});			
				this.AddEvent({type: 'mousedown',	obj: bottom_ns, onevent: {obj: this.obj, fire: 'startdrag'}});
			}
		}
		//Enable resize by X
		if($WI.Check(this.config.resizeX, true)) {
			if($WI.Check(this.config.resizeLeft, true)) {
				var left_we = this._insertDOM(this.obj, {objType: 'span', html: '<font />', objClass: this._createClass(['-left'], {main: this.config.parentClass, after: (this.config.afterClass)?'element-resizeable-left'+config.afterClass:''})}, 'insertinto');
				$WI._append(left_we, {resizeX: true, resizeY: false, moveX: true, moveY: false, reverse: true});
				this.AddEvent({type: 'mousedown',	obj: left_we, onevent: {obj: this.obj, fire: 'startdrag'}});
			}
			if($WI.Check(this.config.resizeRight, true)) {
				var right_we = this._insertDOM(this.obj, {objType: 'span', html: '<font />', objClass: this._createClass(['-right'], {main: this.config.parentClass, after: (this.config.afterClass)?'element-resizeable-right'+this.config.afterClass:''})}, 'insertinto');				
				$WI._append(right_we, {resizeX: true, resizeY: false, moveX: false, moveY: false});			
				this.AddEvent({type: 'mousedown',	obj: right_we, onevent: {obj: this.obj, fire: 'startdrag'}});
			}
		}
		if($WI.Check(this.config.resizeX, true)&&$WI.Check(this.config.resizeY, true)) {
			var bottom_ne = this._insertDOM(this.obj, {objType: 'span', html: '<font />', objClass: this._createClass(['-right-bottom'], {main: this.config.parentClass, after: (this.config.afterClass)?'element-resizeable-right-bottom'+this.config.afterClass:''})}, 'insertinto');	
			$WI._append(bottom_ne, {resizeX: true, resizeY: true, moveX: false, moveY: false});
			this.AddEvent({type: 'mousedown',	obj: bottom_ne, onevent: {obj: this.obj, fire: 'startdrag'}});
		}
		
		this.init();
		return this;
	},
	RegisterActiveObj: function(config) {		
		if(!$WI.IsArray(config)) var config = [config]; 
		if(!this.objActive) this.objActive = [];
		for(var a=0;a<config.length;a++){
			var op = this._objExists(config[a].obj);			
			if(!op&&!$WI.IsNumeric(op))
				this.objActive.push(config[a]);
			else 
				$WI._append(this.objActive[op], config[a], false);				
		}
	},
	AlwaysOnTop: function(obj) {		
		if(!this.always_on_top) this.always_on_top = [];
		if(obj.isArray) this.always_on_top = this.always_on_top.concat(obj);
		else this.always_on_top.push(obj);
	},
	_objExists: function(obj) {				
		if(!this.objActive) return false;
		if(this.objActive.length==0)
			return false;
		else
			for(var b=0;b<this.objActive.length;b++)				
				if(this.objActive[b].obj==obj)	
					return b;				
	},	
	_registerDDEvents: function(obj) {
		if(!obj) var obj = this.obj;		
		var startdrag = {type: 'startdrag', obj: obj, onevent: this._Drag};
		var drag = {type: 'drag', obj: obj, onevent: this._moveMouse};
		var drop = {type: 'drop', obj: obj, onevent: this._upMouse};
		//register events
		if(!this.EventExists(startdrag)) this.AddEvent(startdrag);	
		if(!this.EventExists(drag)) this.AddEvent(drag);
		if(!this.EventExists(drop)) this.AddEvent(drop);			
	},
	_Drag: function(event, _target, obj) {		
		
		//cancel all events if drag and drop functionality is disabled
		if($WI.Check(this.disabled, false))	{
			this._eventCanceled();
			return;		
		}
		
		this._setDragObjCords();
		this._setDragObjWH();
		this._setDragLimits(_target);
		
		//set resize attributes
		this.obj.dcrl = {resizeX: _target.resizeX, resizeY: _target.resizeY, moveX: _target.moveX, moveY: _target.moveY, reverse: _target.reverse}

  	this._cancelSelect(event, true, document.body);
		this._setMouseXY(event);
		if(!this.proxy&&($WI.Check(this.obj.dcrl.moveX,true)||$WI.Check(this.obj.dcrl.moveY,true)))this._maxZ();		
		if(this.proxy) {
			this.proxy.proxyInUse = true;
			this.CreateDDProxy((this.proxy.config)?this.proxy.config:{});
			this._visible(this.proxyDD, false);
		}
		else this.proxyDD = this.obj;		
		this._ajustDrag();	
		
		//move items to the top		
		if(this.always_on_top)
			for(var i=0;i<this.always_on_top.length;i++) 
				this._maxZ(this.always_on_top[i]);
		
		//IMPORTANT! this cancel event is needed for IE fix in case of DRAG and RESIZE functionality
		this._cancelEvent(event);					
	},	
	_setDragLimits: function(_target){
		this.obj.lmts = {};		
		//set left limit using custom method
		if(!this.config.limits) this.config.limits = {};		
		if(this.config.limits.left||this.config.limits.left==0) {
			if($WI.IsFunc(this.config.limits.left))
				this.obj.lmts.left = parseInt(this.config.limits.left.apply(this, [_target, 'left']));
			else 
				this.obj.lmts.left = parseInt(this.config.limits.left);
		}
		//set right limit using custom method
		if(this.config.limits.right||this.config.limits.right==0) {
			if($WI.IsFunc(this.config.limits.right))
				this.obj.lmts.right = parseInt(this.config.limits.right.apply(this, [_target, 'right']));
			else 
				this.obj.lmts.right = parseInt(this.config.limits.right);
		}
		//set top limit using custom method
		if(this.config.limits.top||this.config.limits.top==0) {
			if($WI.IsFunc(this.config.limits.top))
				this.obj.lmts.top = parseInt(this.config.limits.top.apply(this, [_target, 'top']));
			else 
				this.obj.lmts.top = parseInt(this.config.limits.top);
		}
		//set bottom limit using custom method
		if(this.config.limits.bottom||this.config.limits.bottom==0) {
			if($WI.IsFunc(this.config.limits.bottom))
				this.obj.lmts.bottom = parseInt(this.config.limits.bottom.apply(this, [_target, 'bottom']));
			else 
				this.obj.lmts.bottom = parseInt(this.config.limits.bottom);
		}
		//set min width limit using custom method
		if(this.config.limits.minWidth||this.config.limits.minWidth==0) {
			if($WI.IsFunc(this.config.limits.minWidth))
				this.obj.lmts.minWidth = parseInt(this.config.limits.minWidth.apply(this, [_target, 'min-width']));
			else 
				this.obj.lmts.minWidth = parseInt(this.config.limits.minWidth);
		}
		//set max width limit using custom method
		if(this.config.limits.maxWidth||this.config.limits.maxWidth==0) {
			if($WI.IsFunc(this.config.limits.maxWidth))
				this.obj.lmts.maxWidth = parseInt(this.config.limits.maxWidth.apply(this, [_target, 'max-width']));
			else 
				this.obj.lmts.maxWidth = parseInt(this.config.limits.maxWidth);
		}
		//set min height limit using custom method
		if(this.config.limits.minHeight||this.config.limits.minHeight==0) {
			if($WI.IsFunc(this.config.limits.minHeight))
				this.obj.lmts.minHeight = parseInt(this.config.limits.minHeight.apply(this, [_target, 'min-height']));
			else 
				this.obj.lmts.minHeight = parseInt(this.config.limits.minHeight);
		}
		//set max height limit using custom method
		if(this.config.limits.maxHeight||this.config.limits.maxHeight==0) {
			if($WI.IsFunc(this.config.limits.maxHeight))
				this.obj.lmts.maxHeight = parseInt(this.config.limits.maxHeight.apply(this, [_target, 'max-height']));
			else 
				this.obj.lmts.maxHeight = parseInt(this.config.limits.maxHeight);
		}
	},
	_setMouseXY: function(event) {
		var mousePos = this._getMouseXY(event);
		this.mouseX = mousePos.x;
		this.mouseY = mousePos.y;
	},
	_setDragObjCords: function() {		
		var xy = this._getXY(this.obj, true);
		this.X = xy.x;
		this.Y = xy.y;
	},		
	_setDragObjWH: function() {
		for(var o=0;o<this.objActive.length;o++){
			this.objActive[o].W = this._getWidth(this.objActive[o].obj);
			this.objActive[o].H = this._getHeight(this.objActive[o].obj);
		}
	},
	_getDragXY: function() {		
		return {x: parseInt(this.mouseXY.x - (this.mouseX - this.X)), y: parseInt(this.mouseXY.y - (this.mouseY - this.Y))};
	},
	_getDragWH: function(o) {		
		return {obj: o.obj, w: parseInt(this.mouseXY.x - (this.mouseX - o.W)), h: parseInt(this.mouseXY.y - (this.mouseY - o.H)), W: o.W, H: o.H, reverse: o.reverse}
	},
	_ajustDrag: function() {		
		if(this.proxy) {			
			var proxyBorder = this._getStyleInt(this.proxyDD, 'borderLeftWidth');
			var w = this._getWidth(this.obj) - proxyBorder*2 - this.proxyParams.left - this.proxyParams.right;
			var h = this._getHeight(this.obj) - proxyBorder*2 - this.proxyParams.top - this.proxyParams.bottom;	
			var xy = this._getXY(this.obj, true);
	
			this.objActive['proxy'] = {obj: this.proxyDD, move: this.objActive[0].move, resize: this.objActive[0].resize, w: w, h: h, W: w, H: h};			
			
			this._applyConfig(this.proxyDD, {																				
												width: this._fixPx(this.objActive['proxy'].w),
												height: this._fixPx(this.objActive['proxy'].h),																				
												left: this._fixPx(xy.x + this.proxyParams.left),
												top: this._fixPx(xy.y + this.proxyParams.top)																		
												});
			if(this.proxy.config) this._applyConfig(this.proxyDD, this.proxy.config);
		}		
		this.AddEvent({type: 'mousemove', obj: this.objDoc, onevent: {obj: this.obj, fire: 'drag'}});
		this.AddEvent({type: 'mouseup', obj: this.objDoc, onevent: {obj: this.obj, fire: 'drop'}});
	},
	_moveWindowProxy: function() {		
		var co, x, y, w, h, step;			
		if((this.proxy&&this.proxy.proxyInUse)||(this.proxyDD&&$WI.Check(this.eventvisible, true)))this._visible(this.proxyDD, true);
		for(var o=0;o<this.objActive.length;o++) {
			(this.proxy&&this.proxy.proxyInUse)?co=this.objActive['proxy']:co=this.objActive[o];	
		
			//Move object by X	
			if($WI.Check(this.obj.dcrl.moveX,true)&&$WI.Check(co.move,false)&&$WI.Check(this.config.moveX, true)) {
				x = parseInt(this.mouseXY.x - (this.mouseX - this.X) + this.proxyParams.left);	
				
				//$WI.trace(this.X + '|' + x + '|' + (this.X+x-this.config.step));
				
				if((this.X+x-this.config.step)<0) return

					if($WI.IsNumeric(this.obj.lmts.left)&&x<this.obj.lmts.left)
						x = this.obj.lmts.left;
					else if($WI.IsNumeric(this.obj.lmts.right)&&x>this.obj.lmts.right)
						x = this.obj.lmts.right;				
				this._setStyle(co.obj, 'left', this._fixPx(x));
			}
			//Move object by Y	
			if($WI.Check(this.obj.dcrl.moveY,true)&&$WI.Check(co.move,false)&&$WI.Check(this.config.moveY, true)) {
				y = parseInt(this.mouseXY.y - (this.mouseY - this.Y) + this.proxyParams.top);				
					if($WI.IsNumeric(this.obj.lmts.top)&&y<this.obj.lmts.top)
						y = this.obj.lmts.top;
					else if($WI.IsNumeric(this.obj.lmts.bottom)&&y>this.obj.lmts.bottom)
						y = this.obj.lmts.bottom;
				this._setStyle(co.obj, 'top', this._fixPx(y));
			}
					
			//Resize object by W	
			if($WI.Check(this.obj.dcrl.resizeX,false)&&$WI.Check(co.resize,false)) {
				if($WI.Check(this.obj.dcrl.reverse,false))
					w = parseInt(this.mouseX - (this.mouseXY.x - co.W));
				else
					w = parseInt(this.mouseXY.x - (this.mouseX - co.W));
				if($WI.IsNumeric(this.obj.lmts.minWidth)&&w<this.obj.lmts.minWidth)
					w = this.obj.lmts.minWidth;
				else if($WI.IsNumeric(this.obj.lmts.maxWidth)&&w>this.obj.lmts.maxWidth)
					w = this.obj.lmts.maxWidth;

				if(this.config.step) {
					step = this.config.step*parseInt(w/this.config.step);
					if(w>=step)
						this._setStyle(co.obj, 'width', this._fixPx(step-this._getStyleInt(co.obj, 'paddingLeft')-this._getStyleInt(co.obj, 'paddingRight')));					
				} else 
					this._setStyle(co.obj, 'width', this._fixPx(w-this._getStyleInt(co.obj, 'paddingLeft')-this._getStyleInt(co.obj, 'paddingRight')));					
			}			
			//Resize object by H	
			if($WI.Check(this.obj.dcrl.resizeY,false)&&$WI.Check(co.resize,false)) {
				if($WI.Check(this.obj.dcrl.reverse,false))
					h = parseInt(this.mouseY - (this.mouseXY.y - co.H));
				else
					h = parseInt(this.mouseXY.y - (this.mouseY - co.H));
				if($WI.IsNumeric(this.obj.lmts.minHeight)&&h<this.obj.lmts.minHeight)
					h = this.obj.lmts.minHeight;
				else if($WI.IsNumeric(this.obj.lmts.maxHeight)&&h>this.obj.lmts.maxHeight)
					h = this.obj.lmts.maxHeight;

				if(this.config.step) {
					step = this.config.step*parseInt(h/this.config.step);
					if(h>=step)
						this._setStyle(co.obj, 'height', this._fixPx(step));					
				} else 
					this._setStyle(co.obj, 'height', this._fixPx(h));					
			}				
			
			if(this.proxy&&this.proxy.proxyInUse&&o==0) break;			
		}
	},	
	_setObjectByProxy: function() {		
		for(var o=0;o<this.objActive.length;o++)
			this._applyConfig(this.objActive[o].obj, {																		
											width: this._fixPx(this.objActive[o].w),
											height: this._fixPx(this.objActive[o].h),
											top: this._fixPx(this.objActive[o].y),
											left: this._fixPx(this.objActive[o].x)																			
											});
	},	
	_moveMouse: function(event, _target, obj) {		
		var cm = this._getMouseXY(event);
		this.mouseXY = this._getMouseXY(event);					
		this._moveWindowProxy();	
		//required by IE 6 to drag image zone
		this._cancelEvent(event);
	},
	_eventCanceled: function() {	
	},
	_upMouse: function(event, _target, obj) {		
		this._cancelSelect(event, false, document.body);

		if(this.proxy&&this.proxy.proxyInUse) {
			this.proxy.proxyInUse = false;
			this.mouseXY = this._getMouseXY(event);
			this._removeDDProxy();
			this.proxyDD = null;
			if(this.objActive['proxy']) delete this.objActive['proxy'];
			this._moveWindowProxy();			
		}						

		this.obj.dcrl = {};
			
		this.RemoveEvent({obj: this.objDoc, type: 'mouseup', onevent: {obj: this.obj}});		
		this.RemoveEvent({obj: this.objDoc, type: 'mousemove', onevent: {obj: this.obj}});	

		this._cancelEvent(event);
	},	
	_removeDDProxy: function() {		
		this._removeDOM(this.proxyDD);
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

