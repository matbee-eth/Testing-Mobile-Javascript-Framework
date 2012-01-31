/*********************************************************
*		Mini Gallery CLASS
*		Designed & developed by Dima Svirid, 2008	
*		Class: mini_gallery.js
*	  Extends: system.js
*********************************************************/
$WI.Class.MiniGallery = new $WI.Class({
	Create: function(options) {
		this.options = options;
		this.currentClip = 0;
		this.clips = [];
		
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-mini-gallery'});	
		
		this.obj.player = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-mini-gallery-player'}, 'insertinto');	
		this.obj.clips = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-mini-gallery-clips'}, 'insertinto');	
		
		if(this.options.playerWidth) this._setStyle(this.obj.player, 'width', this._fixPx(this.options.playerWidth));
		if(this.options.playerHeight) this._setStyle(this.obj.player, 'height', this._fixPx(this.options.playerHeight));
	},
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	},	
	PlayClip: function(clip) {
		if($WI.IsNumeric(clip)) clip = this.clips[clip]; 
		this._playClip(null, null, clip);			
	},
	SetDefaultPicture: function(url) {
		var _default = this._insertDOM(this.obj.player, {objType: 'img', src: url, objClass: 'element-mini-gallery-default-picture'}, 'insertinto');	
		this.AddEvent({obj: _default, type: 'click', onevent: function(){this.PlayClip(0);}.Apply(this)});
	},
	SetDefaultWatermark: function(url) {
		var _default = this._insertDOM(this.obj.player, {objType: 'img', src: url, objClass: 'element-mini-gallery-default-watermark png'}, 'insertinto');		
		this.AddEvent({obj: _default, type: 'click', onevent: function(){this.PlayClip(0);}.Apply(this)});
	},
	AddClip: function(options) {		
		var _clip = this._createClip(options);		
		this.obj.clips.appendChild(_clip);
				
		this.AddEvent({obj: _clip, type: 'click', onevent: this._playClip});
		this.AddEvent({obj: _clip, type: 'mouseover', onevent: this._mouseEvent});
		this.AddEvent({obj: _clip, type: 'mouseout', onevent: this._mouseEvent});
		
		_clip.url = options.url;		
		this.clips.push(_clip);
		return _clip;
	},		
	_playClip: function(event, _target, obj) {
		var _children = this._getChildren(this.obj.clips);
		for(var i=0;i<_children.length;i++)
			this._removeClass(_children[i], 'element-mini-gallery-clip-click');		
		
		this._addClass(obj, 'element-mini-gallery-clip-click');
		
		var options = {};
		if(this.options.playerWidth) options.width = this.options.playerWidth;
		if(this.options.playerHeight) options.height = this.options.playerHeight;
		$WI.DigitalAsset.Write(obj.url, this.obj.player, options);
	},
	_createClip: function(options) {
		var _clip = this._createDOM({objType: 'div', objClass: 'element-mini-gallery-clip'});	
		var _title = options.title;
		if(options.description) _title += '<div class="element-mini-gallery-description">' + options.description + '</span>';
		
		if(options.thumb == '')
			this._insertDOM(_clip, {objType: 'div', objClass: 'element-mini-gallery-thumb element-mini-gallery-thumb-no-preview'}, 'insertinto');
		else
			this._insertDOM(_clip, {objType: 'img', objClass: 'element-mini-gallery-thumb', src: options.thumb}, 'insertinto');
		this._insertDOM(_clip, {objType: 'div', objClass: 'element-mini-gallery-title', html: _title}, 'insertinto');
		return _clip;
	},	
	_mouseEvent: function(event, _target, obj) {	
		if(event.type=='mouseover')			
			this._addClass(obj, 'element-mini-gallery-clip-mouseover');
		else
			this._removeClass(obj, 'element-mini-gallery-clip-mouseover');
	}		
});

