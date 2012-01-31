/*********************************************************
*		Slider CLASS
*		Designed & developed by Dima Svirid, 2009	
*		Class: slider.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Slider = new $WI.Class({
	Create: function(options) {
		this.options = options;
		this.current_point = 0;
 
		this.obj = this._createDOM({objType: 'div', objClass: 'element-slider', config: options});			
		
		this.obj.slider_route = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-slider-route'}, 'insertinto');
		
		if(options.width)	this._setStyle(this.obj.slider_route, 'width', this._fixPx(options.width));
		if(options.height)	this._setStyle(this.obj.slider_route, 'height', this._fixPx(options.height));		
		
		
		this.obj.slider_cursor = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-slider-cursor'}, 'insertinto');	
		if(options.cursor) 
			this._insertDOM(this.obj.slider_cursor, {objType: 'img', objClass: 'png', display: 'block', src: options.cursor}, 'insertinto');
		
		if($WI.Check(this.options.scroll, 'x') == 'y') {
			this._addClass(this.obj.slider_cursor, 'element-slider-cursor-y');
			this._addClass(this.obj.slider_route, 'element-slider-route-y');
		}
		
		
		
		if($WI.Check(this.options.scroll, 'x') == 'x')
			var _scroll = $WI.Drag(this.obj.slider_cursor, {moveY: false, limits: {left: this._scrollerLimit, right: this._scrollerLimit}});
		else
			var _scroll = $WI.Drag(this.obj.slider_cursor, {moveX: false, limits: {top: this._scrollerLimit, bottom: this._scrollerLimit}});
		
		
		this.AddEvent({type: 'click', obj: this.obj.slider_route, onevent: this._onRouteClick});
		
		_scroll.AddEvent({type: 'startdrag', obj: this.obj.slider_cursor, onevent: this._onStartDrag});
		_scroll.AddEvent({type: 'drop', obj: this.obj.slider_cursor, onevent: this._onDrop});
		
	},
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');
		
		//create steps
		if(this.options.values) {
			if($WI.Check(this.options.scroll, 'x') == 'y') {
				var size = this._getHeight(this.obj.slider_route);										
			} else {
				var size = this._getWidth(this.obj.slider_route);
			}
			for(var s=0;s<this.options.values.length;s++) {				
				var step = size/(this.options.values.length-1);	
				if($WI.Check(this.options.scroll, 'x') == 'y')
					var step_div = this._insertDOM(this.obj.slider_route, {objType: 'div', objClass: 'element-slider-step element-slider-step-y', top: this._fixPx(this.GetPointPx(s))}, 'insertinto');
				else
					var step_div = this._insertDOM(this.obj.slider_route, {objType: 'div', objClass: 'element-slider-step', left: this._fixPx(this.GetPointPx(s))}, 'insertinto');
				
				if(s==0 || s==(this.options.values.length-1)) this._addClass(step_div, 'element-slider-step-edges');
				
			}
		}
	},	
	GetValue: function() {
		var val = 0;
		var point = this.GetPoint();
		if(this.options.values) 
			if(this.options.values.Search(point) != -1)
				val = this.options.values.Search(point);

		return val;
	},
	SetPoint: function(point) {
		if(this.options.values) 
			if(this.options.values.Search(point) != -1)
				point = this.options.values.Search(point);

		return this.SetValue(point, true);
	},
	SetValue: function(val, internal) {
		if(!val&&val!=0) var val = this.GetPoint();
		
		if(this.options.values) 
			if(this.options.values.Search(val) != -1)
				val = this.options.values.Search(val);
	
		//if(val == this.current_point || !val && this.GetPoint() == this.current_point) return;		

		if(this._effect) this._effect.Stop();		
		var newvalue = Math.ceil(this.GetPointPx(val)-this._getHeight(this.obj.slider_cursor)/2);
		if($WI.Class.Animation) {
			this._effect = new $WI.Animation({tweening: 'strongOut', obj: this.obj.slider_cursor, style: ($WI.Check(this.options.scroll, 'x') == 'y')?'top':'left', from: ($WI.Check(this.options.scroll, 'x') == 'y')?this._getStyleInt(this.obj.slider_cursor, 'top'):this._getStyleInt(this.obj.slider_cursor, 'left'), to: newvalue, speed: 5});	
			this.AddEvent({obj: this._effect, type: 'finished', onevent: function(){
				if(internal)
					this.Fire(null, 'change', this.obj)
			}});
		}	else {
			this._setStyle(this.obj.slider_cursor, ($WI.Check(this.options.scroll, 'x') == 'y')?'top':'left', this._fixPx(newvalue));
			if(internal)
				this.Fire(null, 'change', this.obj);	
		}
		
		this.current_point = (val) ? val : this.GetPoint();
	},
	ScrollObj: function(obj) {
		if(!obj) return;
		var scrolled = obj;	
		var scroll = this.obj;		
		var w = this._getWidth(scrolled);
		var ws = this._getWidth(scroll);
		var wt = this._getWidth(this.obj.slider_cursor);
		var period = (w-ws)/(ws-wt);
		var xys = this._getStyleInt(this.obj.slider_cursor, 'left');
		var newxy = xys*period - wt;
		//if((ws-wt)<=newxy) newxy = w-ws;
		
		//$WI.trace(wt + '|' + w + '|' + ws + '|' + period + '|' + newxy + '|' + xys);
		
		this._setStyle(scrolled, 'left', this._fixPx(-newxy));	 	
	},
	GetBody: function() {		
		return this.obj;
	},
	GetScrollObj: function() {		
		return this.obj.slider_cursor;
	},		
	GetPoint: function(move) {		
		var step = 1;
		var point = 0;
		if($WI.Check(this.options.scroll, 'x') == 'y') {
			var size = this._getHeight(this.obj.slider_route);
			var c_size = this._getHeight(this.obj.slider_cursor);		
			if(!move)	var move = this._getStyleInt(this.obj.slider_cursor, 'top');									
		} else {
			var size = this._getWidth(this.obj.slider_route);
			var c_size = this._getWidth(this.obj.slider_cursor);
			if(!move)	var move = this._getStyleInt(this.obj.slider_cursor, 'left');	
		}
		if(this.options.values)	step = size/(this.options.values.length-1);
		point = Math.round((move+c_size/2)/step);

		return point;
	},
	GetPointPx: function(point) {
		//if(!this.options.values || this.options.values.length == 0) 
			//return parseInt(this.);
		
		if($WI.Check(this.options.scroll, 'x') == 'y') {
			var size = this._getHeight(this.obj.slider_route);
			var c_size = this._getHeight(this.obj.slider_cursor);		
			var move = this._getStyleInt(this.obj.slider_cursor, 'top');									
		} else {
			var size = this._getWidth(this.obj.slider_route);
			var c_size = this._getWidth(this.obj.slider_cursor);
			var move = this._getStyleInt(this.obj.slider_cursor, 'left');	
		}
		var step = size/(this.options.values.length-1);
		
		//get the point first
		if($WI.Check(point, -1) < 0) {				
			var point = this.GetPoint();
		} 
		
		return (point==(this.options.values.length)) ? size : step*point;
	},
	_onRouteClick: function(event, _target, obj) {
		var mouseXY = this._getMouseXY(event);
		var xy = this._getXY(obj);
		var hc = this._getHeight(this.obj.slider_cursor);		
		this.SetPoint(this.GetPoint(mouseXY.y - xy.y - hc/2));
	},
	_onStartDrag: function(event, _target, obj) {
		if(obj._construct._effect) obj._construct._effect.Stop();		
	},
	_onDrop: function(event, _target, obj){		
		if(!obj._construct.options.values || obj._construct.options.values.length == 0)
			return;		
		obj._construct.SetPoint(obj._construct.GetPoint());		
	},	
	_scrollerLimit: function(_target, type){		
		if(type=='right'){
			return this._getWidth(_target._construct.obj)-this._getWidth(_target)+this._getWidth(_target._construct.obj.slider_cursor)/2;
		} else if(type=='bottom'){			
			return this._getHeight(_target._construct.obj.slider_route)-this._getHeight(_target)+this._getHeight(_target._construct.obj.slider_cursor)/2;
		} else if(type=='left'){			
			return -this._getWidth(_target._construct.obj.slider_cursor)/2;
		} else if(type=='top'){			
			return -this._getHeight(_target._construct.obj.slider_cursor)/2;
		}
	}		
});

