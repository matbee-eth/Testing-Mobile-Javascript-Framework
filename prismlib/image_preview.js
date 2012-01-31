/*********************************************************
*		Image Preview CLASS
*		Designed & developed by Dima Svirid, 2007	
*		Class: image_preview.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Preview = new $WI.Class({
	Image: function(options) {		
		this.options = options;
		this.borders = 100;
		$WI.Screen.DisableScreen({onDisable: function(){this._onScreenDisable(options)}.Apply(this), onEnable: function(){this.enableScreen()}.Apply(this), enableOnClick: true});
	},
	_loadImage: function(options) {
		this.img = this._insertDOM(this.frame, {objType: 'img', src: options.src + '?cache=' + $WI.Random(), opacity: 0, onload: this._showImage}, 'insertinto');
		this.menu = this._insertDOM(this.frame, {objType: 'div', objClass: 'element-image-preview-menu'}, 'insertinto');			
		//var comments_button = this._insertDOM(this.menu, {objType: 'img', objClass: 'buttons', src: '../../api2.0/src/images/image_viewer/comments.png'}, 'insertinto');		
		var close_button = this._insertDOM(this.menu, {objType: 'img', objClass: 'png', src: '/api2.0/src/images/image_preview/close.png'}, 'insertinto');		
		
		this.AddEvent({obj: close_button, type: 'click', onevent: function(){$WI.Screen.EnableScreen()}});	
	},
	_showImage: function() {		
		this._removeDOM(this.loading);
		//ajust image to fit the screen
		var w = this._getWidth(this.img);
		var h = this._getHeight(this.img);
		var client = this._getClientWH();
		if((h+this.borders)>client.h) {
			this._setStyle(this.img, 'height', this._fixPx(client.h-this.borders));
			this._setStyle(this.img, 'width', null);
		}
		
		if((w+this.borders)>client.w) {
			this._setStyle(this.img, 'width', this._fixPx(client.w-this.borders));
			this._setStyle(this.img, 'height', null);
		}		
		
		var _effect = new $WI.Effect().Grow(this.frame, this.img);
		
		/*
		var _effect = this._Animation({effect: 'Grow', obj: this.frame, to: this.img});				
				_effect.onAnimationFinishedEffect = function() {
					_effect._construct._Animation({effect: 'AlphaIn', obj: _effect._construct.img, speed: 10});
					_effect._construct._applyConfig(_effect._construct.img, {width: '100%', height: '100%'});
				}		*/
		if($WI.Class.DragDrop) {
			var frameRuler = $WI.Drag(this.frame);
				//frameRuler.AddEvent({type: 'drag', obj: this.frame, onevent: this.ajustScreen});		
		}		
		if(this.options.description)
			this._description();			
	},
	_description: function() {
		this.description = this._insertDOM(this.frame, {objType: 'div', objClass: 'element-image-preview-description-text', html: this.options.description}, 'insertinto');	
	},	
	enableScreen: function() {
		if(this.frame)this._removeDOM(this.frame);
	},
	ajustScreen: function() {
		if(!this.screen) return;
		var scrl = this._getPageWH();

		this._applyConfig(this.screen, {width: this._fixPx(scrl.pageW), height: this._fixPx(scrl.pageH)});
	},
	_onScreenDisable: function(options){
		this._createFrame();
		this._loadImage(options);
	},
	_createFrame: function() {
		this.frame = this._insertDOM(null, {objType: 'div', objClass: 'element-image-preview'}, 'insertinto');			
		var scroll = this._getScrollXY();
				
		var client = this._getClientWH();
		var w = this._getWidth(this.frame);
		var h = this._getHeight(this.frame);
   
		this._applyConfig(this.frame, {top: this._fixPx(scroll.y+client.h/2-h/2), left: this._fixPx(scroll.x+client.w/2-w/2)});		
		this.loading = this._insertDOM(this.frame, {objType: 'img', src: '/api2.0/src/images/indicator_circle.gif', position: 'relative', left: '35%', top: '30%'}, 'insertinto');	
		this._maxZ(this.frame);
	}	
});

var preview = new $WI.Class.Preview;
		