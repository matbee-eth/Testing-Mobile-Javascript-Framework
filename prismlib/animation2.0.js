/***********************************************************
* ANIMATION CLASS 2.0
*	Designed & developed by Dima Svirid, 2007 - 2009	
*	Class: animation2.0.js
************************************************************/
$WI.Animation = function(options) {
	var effects = [];
	if($WI.IsArray(options)) {
		for(var i=0; i<options.length; i++) {
			var effect = new $WI.Class.Animation().Effect(options[i]);
			effects.push(effect);
		}
		//assign to groups
		for(var i=0; i<effects.length; i++)
			effects[i].group = effects;
		return effects[0];
	} else
		return new $WI.Class.Animation().Effect(options);
};
$WI.Class.Animation = new $WI.Class({	
	Effect: function(options) {		
		this._setOptions(options);
		if(!this.options.style) return;
		this._effect = true;	
		this.group = null;
		this.time = 0;
		this.position = this.options.from;
		this.finish = this.options.to;
		this.difference = this.finish - this.options.from;	
		this._easeEffect = $WI.Method.Animation[this.options.tweening];
		$WI.REG.__ANIMATION_OBJ_REGISTRY.push(this);		
		return this;		
	},
	Stop: function(){
		this._effect = false;
		$WI.REG.__ANIMATION_OBJ_REGISTRY.Remove(this);
	},
	_setOptions: function(options){
		 this.options = {
		 	speed: 50,
			tweening: 'linear'
		 }
		 $WI._append(this.options, options);
	},
	_animate: function(){		
		if(this._effect){
			if(this.time < this.options.speed) {
				this.time++;
				this.position = this._easeEffect(this.time, this.options.from, this.difference, this.options.speed, 50, 1.06);
				this._setStyle(this.options.obj, this.options.style, (this.options.style=='opacity') ? this.position/100 : this._fixPx(this.position));
				if(this.group) this.Fire(null, 'changed', this.group[0]); //always fire only for one element of the group 
				else this.Fire(null, 'changed', this);
			}	else {			
				this.Stop();
				if(this.group) {
					if(this.group.Search(true, '_effect') == -1) //if all the effects are done
						this.Fire(null, 'finished', this.group[0]);
				} else this.Fire(null, 'finished', this);
			}
		}
	}	
});
$WI.Method.Animation = {
	Run: function() {
		var _reg = $WI.REG.__ANIMATION_OBJ_REGISTRY;
		for(var i=0; i<_reg.length; i++){
			_reg[i]._animate();
		}
	},
	// simple linear tweening
	linear: function (t, b, c, d) {
		return c*t/d + b;
	},
	// accelerating from zero velocity
	tweenIn: function (t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	// decelerating to zero velocity
	tweenOut: function (t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},	
	tweenInOut: function (t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},	
	// Strong tweeining in - accelerating from zero velocity
	strongIn: function (t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	// Strong tweeining out - decelerating to zero velocity
	strongOut: function (t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},	
	strongInOut: function (t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	//elastic in
	elasticIn: function (t, b, c, d, a, p) {
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},	
	//elastic out
	elasticOut: function (t, b, c, d, a, p) {
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},	
	elasticInOut: function (t, b, c, d, a, p) {
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	// bounce in
	bounceIn: function (t, b, c, d, s) {
		return c - $WI.Method.Animation.bounceOut (d-t, 0, c, d) + b;
	},
	// bounce out
	bounceOut: function (t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},	
	bounceInOut: function (t, b, c, d) {
		if (t < d/2) return $WI.Method.Animation.bounceIn (t*2, 0, c, d) * .5 + b;
		return $WI.Method.Animation.bounceOut (t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
};
$WI.REG.__ANIMATION_OBJ_REGISTRY = [];
setInterval('$WI.Method.Animation.Run()', 20);
