/*********************************************************
*		Slides CLASS
*		Designed & developed by Dima Svirid, 2007	
*		Class: slides.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Slides = new $WI.Class({
	Create: function(options) {
		this.options = options;
		this.currentFrame = 0;
		this.frameDistance = 10;
		this.frames = [];
		this.inProcess = false;
		
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-slides', config: options});			
		
		this.screen = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-slides-screen'}, 'insertinto');
		if(this.options.displayHeight) this._setStyle(this.screen, 'height', this._fixPx(this.options.displayHeight));
		this.screen.film = this._insertDOM(this.screen, {objType: 'div', objClass: 'element-slides-screen-film'}, 'insertinto');
			
	},
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	},
	SlideShow: function(options) {	
		this.slideshow = options;
		this.slideshow.timer = setTimeout(function(){this.NextFrame()}.Apply(this), options.time*1000);
	},
	AddFrame: function(options) {		
		var w = this._getWidth(this.screen);
		var _left = w*this.frames.length + this.frameDistance*this.frames.length;
		var _frame = {};

		_frame.film = this._insertDOM(this.screen.film, {objType: 'div', objClass: 'element-slides-screen-frame', width: this._fixPx(w), left: this._fixPx(_left)}, 'insertinto');
		//assign content
		if(options.content) {
			if(typeof options.content=='string')
				options.content = $E(options.content);
			this._isDisplay(options.content, true);
			this._insertDOM(_frame.film, {newNode: options.content}, 'insertinto');
		}
		//assign button
		var frm = this.frames.length;
		if(options.button) {
			if(!$WI.IsArray(options.button))
				options.button = [options.button];
			
			for(var a=0;a<options.button.length;a++) {
				if(typeof options.button[a]=='string')
					options.button[a] = $E(options.button[a]);
			
				this.AddEvent({obj: options.button[a], type: 'click', onevent: function(){this.SetFrame(frm)}.Apply(this)});
			}				
		}
		
		this.frames.push(_frame);	

		if(this.frames.length==1) {
			this.SetFrame(this.currentFrame);
		}
		return _frame;	
	},	
	NextFrame: function(){
		var frm = ++this.currentFrame;		
		if(frm>this.frames.length-1) frm = 0;
		this.SetFrame(frm);
	},
	PreviousFrame: function(){
		var frm = --this.currentFrame;		
		if(frm<0)	frm = this.frames.length-1;
		this.SetFrame(frm);
	},
	GetActiveFrame: function(){
		return this.frames[this.currentFrame];
	},
	GetSlideFrame: function(num){
		return this.frames[num].film;
	},
	SetWidth: function(newWidth) {	
		this._setStyle(this.screen, 'width', this._fixPx(newWidth));	
		var _left = 0;		
		for(var i=0;i<this.frames.length;i++) {			
			_left = newWidth*i + this.frameDistance*i;
			this._applyConfig(this.frames[i].film, {width: this._fixPx(newWidth), left: this._fixPx(_left)});
		}
	},
	OnSlideChange: function() {			
	},
	OnSlideChangeDone: function() {
	},
	SetContent: function(frm, content) {	
		if(typeof frm!='object') frm = this.frames[frm];
		
		if(typeof content=='string') 
			frm.film.innerHTML = content;
		else
			frm.film.appendChild(content);			
	},		
	SetFrame: function(frm) {				
		if(typeof frm=='object') frm = this.frames.Search(frm);
		//clear current timeout if existed
		if(this.slideshow&&this.slideshow.timer) clearTimeout(this.slideshow.timer);
		this.currentFrame = parseInt(frm);		
		var w = this._getWidth(this.screen);
		var _left = w*frm + this.frameDistance*frm;
		
		//disable previous effect id still running
		if(this._effect) this._effect.stopEffect();
		this.inProcess = true;	

		//cancel if not required
		if(Math.abs(_left)==Math.abs(this._getXY(this.screen.film, true).x)) return;
		
		this._effect = this._Animation({effect: 'SlideOut', obj: this.screen.film, style: 'left', to: -_left, speed: this.options.speed});	
		this._effect.onAnimationFinishedEffect = function() {
			this._construct.inProcess = false;			
			this._construct.OnSlideChangeDone.apply(this._construct, [this._construct.currentFrame]);			
		}				
		
		//set new timeout if slideshow is running
		if(this.slideshow) 
			this.SlideShow(this.slideshow);
		//onslide change event
		this.OnSlideChange();
	}
});

