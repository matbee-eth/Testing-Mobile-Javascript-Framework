/*********************************************************
*		MultiHero CLASS
*		Designed & developed by Dima Svirid, 2010	
*		Class: multihero.js
*	  Extends: system2.0.js
*********************************************************/
$WI.Class.MultiHero = new $WI.Class({
	Create: function(options) {
		this.options = options;
		this.obj = options.data;
		
		//create buttons block
		this.buttons = this._insertDOM(this.obj, {objType: 'table', objClass: 'element-multihero-buttons'}, 'insertlast');
				
		this.frames = this._getChildren(this.obj, {byClassName: 'element-multihero-frame'});		
		for(var i=0;i<this.frames.length;i++) {
			var linkto = this.frames[i].getAttribute('link');			
			this._display(this.frames[i], false);			
			this._insertDOM(this.frames[i], {objType: 'div', objClass: 'element-multihero-background', opacity: .9}, 'insertlast');
			var button = this._insertDOM(this.buttons.tr, {objType: 'td', html: i+1}, 'insertinto');
			button.frm = i;
			this.AddEvent({obj: button, type: 'click', onevent: function(event, _target, obj){
				this.SetFrame(obj.frm);
				this._cancelEvent(event);
			}});
			if(linkto)
				this.AddEvent({obj: this.frames[i], type: 'click', onevent: function(event, _target, obj){
					location.href = obj.getAttribute('link');
				}});
		}
		
		this.SetFrame(0);		
	},
	Write: function(where) {
		if(where)
			this._insertDOM($E(where), null, 'insertinto');
		
		this._display(this.obj, true);	
		
		this._cancelSelect(null, true, this.obj);
		
	},
	SetLoader: function(status){		
		if(status && !this.loader) 
			this.loader = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-multihero-loader'}, 'insertinto');
		else if(!status) {
			this._removeDOM(this.loader);
			this.loader = null;
		}			
	},
	SetFrame: function(frm) {		
		if($WI.Check(frm, -1) == -1) frm = (this.frame_selected>=0) ? (this.frame_selected+1) : 0;
		if(frm >= this.frames.length) frm = 0;
		
		if(this.frame_selected == frm) return;
		var frame = this.frames[frm];
		this.frame_previous = this.frame_selected;
		this.frame_selected = frm;
		
		//unselect the others
		if(this.buttons.rows[0]) {
			for(var i=0;i<this.buttons.rows[0].cells.length;i++)
				this._removeClass(this.buttons.rows[0].cells[i], 'selected');
			//lets mark the proper button first		
			this._addClass(this.buttons.rows[0].cells[frm], 'selected');
		}
		
		//disable the other frames
		for(var i=0;i<this.frames.length;i++) {
			var children = this._getChildren(this.frames[i], {byTagName: 'a'});			
			for(var c=0;c<children.length;c++) 
				if(i != this.frame_selected) 
					this._display(children[c], false);
				else 
					this._display(children[c], true);
		}
		
		if(frame.img) {			
			this._setStyle(frame.img, 'opacity', 0.01);
		  this.__effect(frame.img);
		} else {
			this.SetLoader(true);
			var imgsrc = this.frames[frm].getAttribute('image');	
			frame.img	= this._insertDOM(this.frames[frm], {objType: 'img', opacity: .01}, 'insertinto');
			this.AddEvent({obj: frame.img, type: 'load', onevent: function(){
				this.SetLoader(false);
				this.__effect(frame.img);
			}});
			frame.img.src = imgsrc;
						
			
			/*
			this._effect = this._Animation({effect: 'AlphaOut', motion: 'linear', obj: img, from: 0, to: 1, speed: 10});				
			this._effect.onAnimationFinishedEffect = function() {			
					//this._construct._effect = null;
					//if(this._construct.PRESSED)		
					//	this._construct.Start('left');		
			}		
			*/

		}
		this.current_index = $WI.Check(this.current_index, 1);
		this._setStyle(frame, 'zIndex', this.current_index++);
		this._display(frame, true);	
	},
	__effect: function(img) {
		var frametokill = this.frame_previous;
		
		//stop previous effect
		if(this._effect)
		  this._effect.Stop();
		
		this._effect = new $WI.Animation({obj: img, style: 'opacity', tweening: 'linear', from: 0, to: 100, speed: 5});				
		this.AddEvent({obj: this._effect, type: 'finished', onevent: function(){
			this.__effectComplete(frametokill);
		}});
	},
	__effectComplete: function(frametokill) {
	  if(this._effect && frametokill >= 0) {
			this._setStyle(this.frames[frametokill].img, 'opacity', 0);
		}
		
		if(this.options.interval) {
			if(this.interval) clearTimeout(this.interval);
			this.interval = setTimeout(function(){this.SetFrame()}.Apply(this), this.options.interval*1000);
		}
		
	}
});








