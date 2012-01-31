/*********************************************************
*		Slides Scroller CLASS
*		Designed & developed by Dima Svirid, 2008	
*		Class: slides_scroller.js
*	  Extends: system.js
*********************************************************/
$WI.Class.SlidesScroller = new $WI.Class({
	Create: function(options) {
		this.options = options;
		this.currentSlide = 0;		
		this.slides = [];
		this.PAUSE = false;
		this.PREVIEW = false;
		this.pause = 2;				//pause between new slide
		this._left = 0;	
			
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-slides-wrapper', config: options});			
		
		this.obj.scroller = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-slides-scroller'}, 'insertinto');		
			
		this.obj.slider = this._insertDOM(this.obj.scroller, {objType: 'div', objClass: 'element-slides-slider', left: '0px'}, 'insertinto');	
		
		
		//create buttons
		this.obj.leftButton = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-slides-button-left'}, 'insertinto');
		this.obj.leftButton.image = this._insertDOM(this.obj.leftButton, {objType: 'img', objClass: 'element-slides-button-img png', src: '/api2.0/src/images/slides_scroller/controls.png'}, 'insertinto');
		this.obj.rightButton = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-slides-button-right'}, 'insertinto');
		this.obj.rightButton.image = this._insertDOM(this.obj.rightButton, {objType: 'img', objClass: 'element-slides-button-img png', src: '/api2.0/src/images/slides_scroller/controls.png'}, 'insertinto');
		
		
		//add buttons events
		this.AddEvent({obj: this.obj.leftButton, type: 'mousedown', onevent: this._onButtonEvent});
		this.AddEvent({obj: this.obj.rightButton, type: 'mousedown', onevent: this._onButtonEvent});
		//this.AddEvent({obj: this.obj.leftButton, type: 'mouseup', onevent: this._onButtonEvent});
		//this.AddEvent({obj: this.obj.rightButton, type: 'mouseup', onevent: this._onButtonEvent});	
		this.AddEvent({obj: document, type: 'mouseup', onevent: function(){this._onDocumentUpEvent()}.Apply(this)});			
		
		this.AddEvent({obj: this.obj.leftButton, type: 'mouseover', onevent: this._onButtonEvent});	
		this.AddEvent({obj: this.obj.leftButton, type: 'mouseout', onevent: this._onButtonEvent});
		this.AddEvent({obj: this.obj.rightButton, type: 'mouseover', onevent: this._onButtonEvent});	
		this.AddEvent({obj: this.obj.rightButton, type: 'mouseout', onevent: this._onButtonEvent});		
		
	},
	SetControlsImage: function(url) {
		this.obj.leftButton.image.src = url;
		this.obj.rightButton.image.src = url;
	},
	Write: function(where) {	
		this.where = $E(where);
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	},
	InitSlides: function() {
		if(!this.where) {this._isDisplay(this.obj, false);return;}
		var children = this._getChildren(this.where);
		if(children.length==0) {this._isDisplay(this.obj, false);return;}
		for(var i=0;i<children.length;i++) 
			if(!this._hasClass(children[i], 'element-slides-wrapper'))
				this.AddSlide(children[i]);
	},
	AddSlide: function(content) {
		var slide = this._insertDOM(this.obj.slider, {objType: 'div', objClass: 'element-slides-slider-slide', left: this._fixPx(this._left), opacity: (this._isSafari())?.9:1}, 'insertinto');	
		if(typeof content=='string')
			slide.innerHTML = content;
		else {			
			slide.appendChild(content);
			this._isDisplay(content, 'true');	
		}
		this._left += this._getWidth(slide);
		slide._left = this._left;
		
		this.AddEvent({obj: slide, type: 'mouseover', onevent: this._onMouseEvent});	
		this.AddEvent({obj: slide, type: 'mouseout', onevent: this._onMouseEvent});	
		
		this.slides.push(slide);		
	},
	Start: function(where) {			
		if(this._effect||this.PAUSE&&!where) return;
		//this._effect||
		this.children = this._getChildren(this.obj.slider);		
		if(this.children.length==0) return;
		this._cleft = this._getStyleInt(this.obj.slider, 'left');
		
		if(where == 'left')
			this.Back();		
		else
			this.Forward();
	},
	Back: function() {		
		var eln = this.children.length-1;
		var first_child_left = this._getStyleInt(this.children[0], 'left');
		var w = this._getWidth(this.children[eln]);
		var _left = this._cleft + w;
		
		this._insertDOM(this.obj.slider, {newNode: this.children[eln]}, 'insertfirst');		
		this._setStyle(this.children[eln], 'left', this._fixPx(first_child_left-w));	
		
		this._effect = this._Animation({effect: 'SlideOut', motion: 'linear', obj: this.obj.slider, style: 'left', from: this._cleft, to: _left, speed: 10});			
				
		this._effect.onAnimationFinishedEffect = function() {			
				this._construct._effect = null;
				if(this._construct.PRESSED)		
					this._construct.Start('left');		
		}		
	},
	Forward: function() {		
				//$WI.trace(this.PRESSED)
		var w = this._getWidth(this.children[0]);
		var _left = -(w - this._cleft);
		
		this._effect = this._Animation({effect: 'SlideOut', motion: (this.PRESSED)?'linear':'slideOut', obj: this.obj.slider, style: 'left', from: this._cleft, to: _left, speed: (this.PRESSED)?10:50});	
				
		this._effect.onAnimationFinishedEffect = function() {
			var last_child_left = this._construct._getStyleInt(this._construct.children[this._construct.children.length-1], 'left');
			this._construct._insertDOM(this._construct.obj.slider, {newNode: this._construct.children[0]}, 'insertinto');				
			this._construct._setStyle(this._construct.children[0], 'left', this._construct._fixPx(last_child_left + this._construct._getWidth(this._construct.children[this._construct.children.length-1])));	
			//this._construct._left += this._construct._getWidth(this._construct.children[0]);
			//if(!this._construct.PAUSE)
				this._construct._effect = null;
				if(this._construct.timeout) clearTimeout(this._construct.timeout);
				
				if(this._construct.PRESSED)		
					this._construct.Start('right');	
				else
					this._construct.timeout = setTimeout(function(){this.Start()}.Apply(this._construct), this._construct.pause*1000);
		}		
	},
	_onMouseEvent: function(event, _target, obj) {		
		if(event.type=='mouseover') {		
			this.PAUSE = true;		
			this._setStyle(obj, 'opacity', .5);
			if(this.timeout) clearTimeout(this.timeout);
		} else {
			this._setStyle(obj, 'opacity', (this._isSafari())?.9:1);
			this.PAUSE = false;	
			this.timeout = setTimeout(function(){this.Start()}.Apply(this), 1000);
		}
		this._cancelEvent(event);
		return false;
	},
	_onDocumentUpEvent: function(event, _target, obj) {	
		var event = {type: 'mouseup'};
		this._onButtonEvent(event);
	},
	_onButtonEvent: function(event, _target, obj) {		
		if(event.type=='mouseover') {		
			this.PAUSE = true;		
			
		} else if(event.type=='mouseout') {
			this.PAUSE = false;	
			
		} else if(event.type=='mousedown') {
			this._addClass(_target, 'element-slides-button-img-down');
			this.PRESSED = true;	
			
			if(this._hasClass(obj, 'element-slides-button-right'))
				this.Start('right');
				//this._scrollForward();
			else
				this.Start('left');	
								
		} else if(event.type=='mouseup') {
			this.PRESSED = false;	
			this._removeClass(this.obj.leftButton.image, 'element-slides-button-img-down');
			this._removeClass(this.obj.rightButton.image, 'element-slides-button-img-down');
		} 
		this._cancelEvent(event);
		return false;
	},
	_scrollForward: function() {
		if(this._effect) this._effect.stopEffect();
		//this._effect = this._Animation({effect: 'SlideOut', motion: 'linear', obj: this.obj.slider, style: 'left', from: this._cleft, to: _left, speed: 50});	
	}		
});

