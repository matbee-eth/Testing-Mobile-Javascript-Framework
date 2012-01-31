/*********************************************************
*		TOOLTIP CLASS
*		Designed & developed by Dima Svirid, 2008	
*		Class: tooltip.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Tooltip = new $WI.Class({
	Create: function(options) {		
		if(!options) return;
		this.options = options;		
		//create close button by default
		this.options.closebutton = $WI.Check(this.options.closebutton, true);		
		
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-tooltip'});			
		
		if($WI.Check(this.options.shadow, true))
			this.shadow = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-tooltip-shadow', opacity: .1}, 'insertinto');		
	
		this.obj.content = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-tooltip-content', top: this._fixPx(30)}, 'insertinto');	
		this.obj.content.txtobj = this._insertDOM(this.obj.content, {objType: 'div', objClass: 'element-tooltip-text'}, 'insertinto');	
		this.obj.content.txt = this._insertDOM(this.obj.content.txtobj, {objType: 'div', objClass: 'element-tooltip-text-wrapper', html: (this.options.html)?this.options.html:''}, 'insertinto');	
		
		if($WI.Check(this.options.shadow, true))
			this.arrow = this._insertDOM(this.obj.content, {objType: 'div', objClass: 'element-tooltip-arrow', top: this._fixPx(-10)}, 'insertinto');
		//assign custom content
		if(this.options.content) this.Content(this.options.content);
		if(this.options.iframe)	this.Iframe(this.options.iframe);
		
		if(this.options.closebutton)
			this.EnableClose();
	},	
	Remove: function(){
		//return;
		if($WI.Check(this.options.cache, true)) 
			this._applyConfig(this.obj, {display: 'none', left: '-1000px', top: '-1000px', zIndex: -1000});			
		else
			this._removeDOM(this.obj);
	},
	GetBody: function() {
		return this.obj;
	},
	GetContent: function() {
		return this.obj.content.txt;
	},
	Content: function(content) {
		this._visible($E(content), true);		
		var block = this._insertDOM(this.obj.content.txt, {newNode: (typeof content=='string')?$E(content):content}, 'insertinto');	
		return block;
	},
	Iframe: function(src) {
		var content = this._insertDOM(this.obj.content.txt, {objType: 'iframe', frameBorder: 0, src: src, width: '100%', height: '100%'}, 'insertinto');
		return content;
	},		
	LoadContent: function(url) {
		if(!$WI.Class.Ajax||!this._display(this.obj)||this.options.loadContentLoaded == true) return;		
		this.GetContent().innerHTML = '<strong>Please wait ... loading</strong>';
		$WI.Ajax({url: url, onComplete: this._loadContentResponse, cache: true, instance: this});
	},
	Write: function(where) {		
		if(!this.obj) return;
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
		
		this.AddEvent({obj: this.obj, type: 'mouseover', onevent: this._onMouseEvent});	
		this.AddEvent({obj: this.obj, type: 'mouseout', onevent: this._onMouseEvent});	
		this._prepare();
	},		
	EnableClose: function() {
		this.closebutton = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-tooltip-closebutton'}, 'insertinto');
		this.AddEvent({obj: this.closebutton, type: 'click', onevent: this.Remove});	
	},
	CloseAllTooltips: function(_exclude) {
		for(var i=0;i<$WI.GLOBAL_TOOLTIP_REGISTRY.length;i++) {
			var ___tooltip = $WI.GLOBAL_TOOLTIP_REGISTRY[i].TOOLTIP_REGISTRY;
			if(_exclude&&_exclude==___tooltip) continue;
			if(this._display(___tooltip.GetBody())) {
				___tooltip.Remove();
			}
		}
	},
	AjustDivs: function(event, _target, obj) {			
		var mousepos = null;		
		var w = this._getWidth(this.obj);
		var h = this._getHeight(this.obj);
		var screen = this._getClientWH();
		var distance = 10;
		
		mousepos = this._getMouseXY((event)?event:this.options.event);	
		var posx = mousepos.x - distance;
		var posy = mousepos.y - distance;
		
		//remove padding if loading iframe
		if(this.options.iframe) {
			this._applyConfig(this.obj.content.txt, {padding: '0px'});
			this._applyConfig(this.obj.content.txtobj, {overflow: 'visible'});
		}
		
		//set static sizes
		if(this.options.width) w = parseInt(this.options.width);	
		if(this.options.height) h = parseInt(this.options.height);	
				
		//fix with
		if(this.options.maxWidth) {
			var _maxw = parseInt(this.options.maxWidth);			
			if(w > _maxw) w = _maxw;
		}
		this._setStyle(this.obj, 'width', this._fixPx(w));
		this._setStyle(this.obj.content, 'width', this._fixPx(w));
		
		//fix with
		if(this.options.maxHeight) {
			var _maxh = parseInt(this.options.maxHeight);			
			if(h > _maxh) h = _maxh;		
		}
		this._setStyle(this.obj, 'height', this._fixPx(h));
		if(h>40)
			this._setStyle(this.obj.content, 'height', this._fixPx(h-40));		
		
		//now lets calculate if tooltip goes over the screen
		if(parseInt(posx + w) > screen.w)	{
			posx -= (w);		
			if(this.closebutton) this._setStyle(this.closebutton, 'left', '5px');	
			if(this.arrow) this._setStyle(this.arrow, 'right', '5px');	
		}
		
		//apply location
		if(posx<0) posx = 0;if(posy<0) posy = 0;
		this._applyConfig(this.obj, {top: this._fixPx(posy), left: this._fixPx(posx)});
		
		//ajust shadow
		var ___w = this._getWidth(this.obj.content);
		var ___h = this._getHeight(this.obj.content);	
		
		this._applyConfig(this.shadow, {width: this._fixPx(___w), height: this._fixPx(___h)});
		return;	
	},	
	_onMouseEvent: function(event, _target, obj) {
		if(event.type=='mouseout') {
			this.remove_loaded_tooltip = setTimeout(function(){this.Remove();}.Apply(this), 500);
		} else if(event.type=='mouseover') {
			if(this.remove_loaded_tooltip) clearTimeout(this.remove_loaded_tooltip);
		}
		this._cancelEvent(event);
	},
	_prepare:	function() {
		this._isDisplay(this.obj, true);
		this.AjustDivs();
		//load dynamic content
		if(this.options.loadContent)
			setTimeout(function(){this.LoadContent(this.options.loadContent);}.Apply(this), 1000); 			
		this._maxZ(this.obj);
	},
	_loadContentResponse: function(xml, text, instance) {		
		instance._visibility(instance.GetContent(), false);
		instance.GetContent().innerHTML = xml.getNodeValue("//tooltip_content");
		var children = instance._getChildren(instance.GetContent());
		//this.options.loadContentLoaded
		if(children[0]) {
			var ___w = instance._getWidth(children[0]) + ((instance._isIE())?10:25);
		} else return false;
		/*
		var _effect = new $WI.Animation({obj: instance.obj, style: 'width', tweening: 'SlideOut', to: ___w, speed: 10});
		$WI.Event.AddEvent({obj: _effect, type: 'changed', onevent: function(){
			//this.AjustDivs();
			$WI.trace(this.AjustDivs)
		}});
		*/
		/*
		$WI.Event.AddEvent({obj: _effect, type: 'finished', onevent: function(){alert('DONE')}});
		_effect.onAnimationFinishedEffect = function() {			 
		 	var children = this._construct._getChildren(this._construct.GetContent());
			if(children[0]) 
				var ___h =  this._construct._getHeight(children[0]) + 10;			
			else return false;
			 var _effect = this._construct._Animation({effect: 'SlideOut', obj: this._construct.obj, style: 'height', to: ___h, speed: 10});
			 _effect.onAnimationChangedEffect = function() {						
					this._construct.AjustDivs();
					this._construct._visibility(this._construct.GetContent(), true);
				};
		};	*/	
	}
});
$WI.Tooltip = function(options) {
	if(!$WI.GLOBAL_TOOLTIP_REGISTRY) $WI.GLOBAL_TOOLTIP_REGISTRY = [];
	if(!$WI.GLOBAL_TOOLTIP_REGISTRY.OBJECTS) $WI.GLOBAL_TOOLTIP_REGISTRY.OBJECTS = [];	
 	
	if(options&&options.event) options._target = $WI.Event._getTarget(options.event);
	
	if(options&&options._target&&$WI.GLOBAL_TOOLTIP_REGISTRY.InArray(options._target)) {
		var _temp = options._target.TOOLTIP_REGISTRY;
				if(options.event) _temp.options.event = options.event;
				_temp._prepare(options);
	} else {
		var _temp = new $WI.Class.Tooltip;
				_temp.Create(options);
				_temp.Write();
			if(options&&$WI.Check(options.cache, true)) {
				$WI.GLOBAL_TOOLTIP_REGISTRY.push(options._target);
				options._target.TOOLTIP_REGISTRY = _temp;
			}	
	}	
	//close all tooltops before showing a new one
	_temp.CloseAllTooltips(_temp);
	return _temp;
};
