/***********************************************************
* Effects CLASS
*	Designed & developed by Dima Svirid, 2009	
*	Extends: animation2.0.js
*	Class: effects.js
************************************************************/
$WI.Effect = function(options) {	
		return new $WI.Class.Effect();
};
$WI.Class.Effect = new $WI.Class({	
	ProxyMove: function(from, to) {		
		//find from coords		
		var w = this._getWidth(from);
		var h = this._getHeight(from);
		var xy = this._getXY(from);
		//find to coords
		var wt = this._getWidth(to);
		var ht = this._getHeight(to);
		var xyt = this._getXY(to);
		
		var the_proxy = this._insertDOM(from.parentNode, {objType: 'div', backgroundColor: '#000000', opacity: .3, position: 'absolute', width: this._fixPx(w), height: this._fixPx(h), left: this._fixPx(xy.x), top: this._fixPx(xy.y)}, 'insertinto');
		this._maxZ(the_proxy);
		
		the_proxy.effect = new $WI.Animation([					
			{obj: the_proxy, style: 'width', from: w, to: wt, speed: 10},
			{obj: the_proxy, style: 'height', from: h, to: ht, speed: 10},
			{obj: the_proxy, style: 'left', from: xy.x, to: xyt.x, speed: 10},
			{obj: the_proxy, style: 'top', from: xy.y, to: xyt.y, speed: 10}
		]);
		this.AddEvent({obj: the_proxy.effect, type: 'finished', onevent: function(){this._removeDOM(the_proxy)}});
		return this;		
	},
	Grow: function(from, to) {			
		var wf = this._getWidth(from);
		var hf = this._getHeight(from);
		var w = this._getWidth(to);
		var h = this._getHeight(to);
		
		alert(wf + '|' + w)

		var startPos = this._getXY(from);
		var endPos = {x: startPos.x-(w-wf)/2, y: startPos.y-(h-hf)/2};		
		
		var effect = new $WI.Animation([					
					{obj: from, tween: 'tweenOut', style: 'width', start: wf, end: w, speed: 5},
					{obj: from, tween: 'tweenOut', style: 'height', start: hf, end: h, speed: 5},
					{obj: from, tween: 'tweenOut', style: 'top', start: startPos.y, end: endPos.y, speed: 5},
					{obj: from, tween: 'tweenOut', style: 'left', start: startPos.x, end: endPos.x, speed: 5}
				]);
		return effect;
	},
	ClassApply: function(options) {				
		setTimeout(function(){
			this._addClass(options.obj, options.objClass);
			setTimeout(function(){
				this._removeClass(options.obj, options.objClass);
				this.__times = $WI.Check(this.__times, 0);this.__times++;
				if(this.__times < $WI.Check(options.repeat, 1))
					this.ClassApply(options);											
			}.Apply(this), (options.timeout) ? options.timeout : 500);
		}.Apply(this), (options.timeout) ? options.timeout : 500);		
		return true;
	}		
});
