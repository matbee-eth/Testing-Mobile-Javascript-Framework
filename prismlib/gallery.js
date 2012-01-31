/*********************************************************
*		Gallery CLASS
*		Designed & developed by Dima Svirid, 2007	
*		Class: gallery.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Gallery = new $WI.Class({
	Create: function(options) {
		this.options = options;
		this.currentFrame = 0;
		this.frameDistance = 10;
		this.frames = [];
		
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-gallery', config: options});	
		
		this.comments = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-gallery-comments', config: (options.comments)?options.comments:null}, 'insertinto');
		
		this.screen = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-gallery-screen'}, 'insertinto');
		if(this.options.displayHeight) this._setStyle(this.screen, 'height', this._fixPx(this.options.displayHeight));
		this.screen.film = this._insertDOM(this.screen, {objType: 'div', objClass: 'element-gallery-screen-film'}, 'insertinto');
		this.thumbs = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-gallery-thumbs'}, 'insertinto');
		this.thumbs._left = 0;
		this.thumbs._top = 0;
		
		this.controls = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-gallery-controls', config: (options.controls)?options.controls:null}, 'insertinto');
		this.controls.left = this._insertDOM(this.controls, {objType: 'div', objClass: 'element-gallery-controls-left'}, 'insertinto');
		this.controls.info = this._insertDOM(this.controls, {objType: 'div', objClass: 'element-gallery-controls-info'}, 'insertinto');
		this.controls.right = this._insertDOM(this.controls, {objType: 'div', objClass: 'element-gallery-controls-right'}, 'insertinto');
		
		this.AddEvent({obj: this.controls.left, type: 'click', onevent: this.PreviousFrame});
		this.AddEvent({obj: this.controls.right, type: 'click', onevent: this.NextFrame});
	},
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	},
	SetCustom: function(what, where) {	
		var obj = this._insertDOM($E(where), {objType: 'div', objClass: 'element-gallery'}, 'insertinto');
		this._set(what, obj);	
	},
	SlideShow: function(options) {	
		this.slideshow = options;
		this.slideshow.timer = setTimeout(function(){this.NextFrame()}.Apply(this), options.time*1000);
	},
	AddFrame: function(options) {		
		var w = this._getWidth(this.screen);
		var _left = w*this.frames.length + this.frameDistance*this.frames.length;
		var _frame = {};
				
				//create preview block
				_frame.preview = this._insertDOM(this.thumbs, {objType: 'div', objClass: 'element-gallery-preview', config: (this.options.thumbs)?this.options.thumbs:null}, 'insertinto');
				 this._insertDOM(_frame.preview, {objType: 'img', objClass: 'element-gallery-preview-image', src: options.preview}, 'insertinto');
				 this.AddEvent({obj: _frame.preview, type: 'click', onevent: this._setFrame});
				 this.AddEvent({obj: _frame.preview, type: 'mouseover', onevent: this._mouseEvent});
				 this.AddEvent({obj: _frame.preview, type: 'mouseout', onevent: this._mouseEvent});
				 
		//ajust preview thumbnail
		var wtumbs = this._getWidth(this.thumbs);
		var wt = this._getWidth(_frame.preview);
		var ht = this._getHeight(_frame.preview);
		var marginLeft = this._getStyleInt(_frame.preview, 'marginLeft')
		var marginTop = this._getStyleInt(_frame.preview, 'marginTop');	
		
		if(this.frames.length==0) this.thumbs._left = 0;
		else this.thumbs._left += (wt+marginLeft);		
		
		if((this.thumbs._left+wt)>wtumbs) {this.thumbs._top += (ht+marginTop);this.thumbs._left=0}
		
		this._applyConfig(_frame.preview, {left: this._fixPx(this.thumbs._left), top: this._fixPx(this.thumbs._top)});				 
		//ajust thumbnail block
		this._applyConfig(this.thumbs, {height: this._fixPx(this.thumbs._top+ht+marginTop)});
		
		//Fix firefox bug with the parent height for thumbs		
		this._applyConfig(this.thumbs, {height: this._fixPx(this.thumbs._top+ht+marginTop)});
				 
		//create main picture spot in a file line
		_frame.film = this._insertDOM(this.screen.film, {objType: 'div', objClass: 'element-gallery-screen-frame', width: this._fixPx(w), left: this._fixPx(_left)}, 'insertinto');
		_frame.loading = this._insertDOM(_frame.film, {objType: 'div', objClass: 'element-gallery-screen-loading', html: 'please wait ... loading'}, 'insertinto');
		_frame.imageUrl = options.picture;		
		_frame.comments = options.comments;
		this.frames.push(_frame);	
		this._setInfo();
		if(this.frames.length==1) {
			this.SetFrame(this.currentFrame);
			this._setComments();
			//create cursor if required
			if(this.options.cursor)
				this._createCursor();
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
	SetFrame: function(frm) {	
		//clear current timeout if existed
		if(this.slideshow&&this.slideshow.timer) clearTimeout(this.slideshow.timer);
		this.currentFrame = parseInt(frm);		
		var w = this._getWidth(this.screen);
		var _left = w*frm + this.frameDistance*frm;
		
		//disable previous effect id still running
		if(this._effect) this._effect.stopEffect();		
		this._effect = this._Animation({effect: 'SlideOut', obj: this.screen.film, style: 'left', to: -_left});	
		this._effect.onAnimationFinishedEffect = function() {
						_this = this._construct;
						_this._isDisplay(_this.frames[_this.currentFrame].loading, true);
						_this._loadImage();
						this._construct.OnSlideChangeDone.apply(this._construct, [this._construct.currentFrame]);			
				}	
		
		this._setInfo();
		this._setComments();
		//move cursor if needed/custom: 'SlideOut', 
		if(this.cursor) {
			//disable previous effect id still running
			if(this._effect_cursor) this._effect_cursor.stopEffect();
			this._effect_cursor = this._Animation({effect: 'Move', obj: this.cursor, to: this.frames[this.currentFrame].preview, speed: 30});
			this._maxZ(this.cursor);	
		}
		//set new timeout if slideshow is running
		if(this.slideshow) 
			this.SlideShow(this.slideshow);
		
		this.OnSlideChange();
	},
	OnSlideChange: function() {			
	},
	OnSlideChangeDone: function() {
	},
	SetPhotoPagesMask: function(mask) {
		this.options.photos_mask = mask;
	},
	_createCursor: function() {	
		var w = this._getWidth(this.frames[0].preview);
		var h = this._getHeight(this.frames[0].preview);
		var xy = this._getXY(this.frames[0].preview, true);		
		this.cursor = this._insertDOM(this.thumbs, {objType: 'div', objClass: 'element-gallery-thumb-cursor', config: (this.options.cursor)?this.options.cursor:null}, 'insertinto');		
		
		this._applyConfig(this.cursor, {top: this._fixPx(xy.y), left: this._fixPx(xy.x)});
		
		var border = this._getStyleInt(this.cursor, 'borderWidth'); 
		this._applyConfig(this.cursor, {width: this._fixPx(w-border-2), height: this._fixPx(h-border-2)});

		this._maxZ(this.cursor);		
	},
	_setInfo: function() {	
		if(!this.options.photos_mask || this.options.photos_mask =='') this.options.photos_mask = '%current_slide% of %total_slides%';
		var label = this.options.photos_mask.replace(/%current_slide%/, parseInt(this.currentFrame+1)).replace(/%total_slides%/, this.frames.length);
		this.controls.info.innerHTML = label;
	},
	_setComments: function() {			
		if(!this.frames.length) return;
		var children = this._getChildren(this.comments);
		for(var c=0;c<children.length;c++)
			this._removeDOM(children[c]);		
		
		if(!this.frames[this.currentFrame].comments) return;
		if(typeof this.frames[this.currentFrame].comments=='object') {
			this._isDisplay(this.frames[this.currentFrame].comments, true);
			this._insertDOM(this.comments, {newNode: this.frames[this.currentFrame].comments}, 'insertinto');
		} else
			this.comments.innerHTML = this.frames[this.currentFrame].comments;
	},
	_setFrame: function(event, _target, obj) {	
		for(var i=0;i<this.frames.length;i++) {
			if(this.frames[i].preview==obj)
				this.SetFrame(i);
		}
	},
	_loadImage: function() {	
		var children = this._getChildrenByClassName(this.frames[this.currentFrame].film, {byClassName: 'element-gallery-screen-image'});
		if(children.length>0) {this._showImage();return;}
		var imgurl = this.frames[this.currentFrame].imageUrl + '?cache=' + $WI.Random();		
		this.frames[this.currentFrame].film.image = this._insertDOM(this.frames[this.currentFrame].film, {objType: 'img', objClass: 'element-gallery-screen-image', src: imgurl, opacity: 0, onload: this._showImage}, 'insertinto');
	},
	_showImage: function() {	
		//lets strech an image
		if(this.options.stretching && this.options.stretching == 'uniform') {
			var _w = this._getWidth(this.frames[this.currentFrame].film.image);
			var _h = this._getHeight(this.frames[this.currentFrame].film.image);		
			if(_w > _h)	this._setStyle(this.frames[this.currentFrame].film.image, 'width', '100%');
			else this._setStyle(this.frames[this.currentFrame].film.image, 'height', '100%');
		} else if(!this.options.stretching || this.options.stretching == 'fill') {
			this._applyConfig(this.frames[this.currentFrame].film.image, {width: '100%', height: '100%'});
		} 			
		
		this._removeDOM(this.frames[this.currentFrame].loading);
		if(this._getStyleInt(this.frames[this.currentFrame].film.image, 'opacity')!=1)
			this._Animation({effect: 'AlphaIn', obj: this.frames[this.currentFrame].film.image, speed: 10});
	},
	_mouseEvent: function(event, _target, obj) {	
		if(this.options.effect&&this.options.effect=='Zoom') {
			if(!this.options.zoom) this.options.zoom = 20; 
			if(event.type=='mouseover') {			
				this._maxZ(obj);
				this._Animation({effect: 'ZoomIn', obj: obj, zoom: this.options.zoom});		
			}
			else
				this._Animation({effect: 'ZoomOut', obj: obj, zoom: this.options.zoom});			
			
		}	else {
			if(event.type=='mouseover')			
				this._Animation({effect: 'AlphaOut', obj: obj, to: 50, speed: 10});
			else
				this._Animation({effect: 'AlphaIn', obj: obj, speed: 10});	
		}	
	}		
});

