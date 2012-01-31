/*********************************************************
*		CUSTOM INTERFACE ELEMENTS CLASS
*		Designed & developed by Dima Svirid, 2007-2009	
*		Class: elements.js
*	  Extends: system.js
*********************************************************/

/*********************************************************
*		Fieldset element
*********************************************************/
$WI.Class.Fieldset = new $WI.Class({	
	Create: function(options) {	
		var __legend = '';
		if(options.icon) __legend += '<img src="' + options.icon + '" align="absmiddle" />&nbsp;&nbsp;';
		if(options.legend) __legend += options.legend;
		this.obj = this._createDOM({objType: 'fieldset', objClass: 'element-fieldset'});
		this.obj.legend = this._insertDOM(this.obj, {objType: 'legend', objClass: 'element-fieldset-legend', html: __legend}, 'insertinto');
		this.obj.content = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-fieldset-content'}, 'insertinto');
		return this.obj;	  
	},
	GetLegend: function() {		
		return this.obj.legend;
	},	
	GetBody: function() {		
		return this.obj.content;
	},
	Write: function(where) {		
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	}
});

/*********************************************************
*		Form field element
*********************************************************/
$WI.Class.FormField = new $WI.Class({	
	Create: function(options) {	
		this.options = options;		
		this.obj = this._insertDOM(null, {objType: (this.options.type=='textarea')?'textarea':'input', type: (this.options.type=='textarea')?null:this.options.type, objClass: (this.options.type=='textarea'||this.options.type=='text'||this.options.type=='password')?'element-form-field':'', config: options});
		if(this.options.type=='text'||this.options.type=='password') this.obj.setAttribute('autocomplete', 'off');		
		if(this.options.mandatory) this._addClass(this.obj, 'element-form-field-mandatory');
		if(this.options.type=='checkbox'||this.options.type=='radio') this.obj.checked = $WI.Check(this.options.checked, false); 
		
		if(this.options.type == 'textarea'||this.options.type == 'text'||this.options.type == 'password')
		{
			this.AddEvent({obj: this.obj, type: 'focus', onevent: function(){this._addClass(this.obj, 'element-form-field-onfocus')}});
			this.AddEvent({obj: this.obj, type: 'blur', onevent: function(){this._removeClass(this.obj, 'element-form-field-onfocus')}});
		}
		
		return this.obj;	  
	},
	Disabled: function(status) {		
		if($WI.Check(status, true)) {
			this.disabled = true;
			this.obj.disabled = true;
		} else {
			this.disabled = false;
			this.obj.disabled = false;
		}
	},	
	GetName: function(){
		return this.obj.name;
	},
	GetValue: function(){
		return $V(this.obj);
	},
	SetValue: function(val) {
		return $V(this.obj, val);
	},
	GetBody: function() {
		return this.obj;
	},	
	Write: function(where) {		
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	},
	AutoSubmit: function(onevent){
		if(this.disable) return;
		if(onevent) {
			this.onautoevent = onevent;
			this.AddEvent({obj: this.obj, type: 'keyup', onevent: this.__autoSubmit});
		}
	},
	OnSubmitEvent: function(func) {	
		if(this.disable) return;
		var _func = function() {
			if($WI.REG.Buttons.Enter) {
				func();
				$WI.REG.Buttons = {}; //reset
			}
		};
		this.AddEvent({obj: this.obj, type: 'keypress', onevent: _func});	
	},
	OnBlurEvent: function(func) {	
		if(this.disable) return;
		this.AddEvent({obj: document, type: 'blur', onevent: func});	
	},
	__autoSubmit: function(event, _target, obj) {
		if(this.timeout) clearTimeout(this.timeout);
		this.timeout = setTimeout(function(){			
			if(this.onautoevent) this.onautoevent.apply(this, [event, _target, obj]);
		}.Apply(this), 2000);	
	}
});

/*********************************************************
*		Button element
*********************************************************/
$WI.Class.Button = new $WI.Class({	
	Create: function(options) {	
		this.options = options;
		
		this.obj = this._insertDOM(null, {objType: 'table', cellSpacing: '0px', cellPadding: '0px', objClass: 'element-button', config: options.config});	
		var	tdl = this._insertDOM(this.obj.tr, {objType: 'td'}, 'insertinto');
		this.obj.left = this._insertDOM(tdl, {objType: 'div', objClass: 'element-button-left element-button-image'}, 'insertinto');
		
		var	tdi = this._insertDOM(this.obj.tr, {objType: 'td'}, 'insertinto');
		this.obj.icon = this._insertDOM(tdi, {objType: 'div', objClass: 'element-button-icon element-button-image'}, 'insertinto');
		if(options.icon) 
			this._insertDOM(this.obj.icon, {objType: 'img', objClass: 'png', src: options.icon, marginTop: '2px', width: '16px', height: '16px'}, 'insertinto');
		
		if(!options.icon) 
			this._setStyle(this.obj.icon, 'width', '1px');
		
		var	tdc = this._insertDOM(this.obj.tr, {objType: 'td'}, 'insertinto');
		this.obj.center = this._insertDOM(tdc, {objType: 'input', type: 'button', objClass: 'element-button-center element-button-image', value: (options.title)?options.title:'', paddingBottom: (this._isFF())?'2px':'0px', paddingLeft: (this._isSafari())?'3px':'0px', paddingRight: (this._isSafari())?'3px':'0px', width: (options.width)?this._fixPx(options.width):''}, 'insertinto');
		
		if(!options.title) {
			this._setStyle(this.obj.icon, 'paddingLeft', '0px');
			this._setStyle(this.obj.center, 'padding', '0px');
			this._setStyle(this.obj.center, 'width', '1px');
		}
							
		var	tdr = this._insertDOM(this.obj.tr, {objType: 'td'}, 'insertinto');
		this.obj.right = this._insertDOM(tdr, {objType: 'div', objClass: 'element-button-right element-button-image'}, 'insertinto');		
		
		this.objs = ['left', 'icon', 'center', 'right'];	

		this._buttonMouseOver = function(){				
			if(this.disable) return;
			for(var i=0;i<this.objs.length;i++)			
				this._addClass(this.obj[this.objs[i]], 'element-button-' + this.objs[i] + '-mouseover');	
		};
		this._buttonMouseDown = function(){				
			if(this.disable) return;
			for(var i=0;i<this.objs.length;i++)			
				this._addClass(this.obj[this.objs[i]], 'element-button-' + this.objs[i] + '-mousedown');	
		};
		this._buttonMouseUp = function(){				
			//if(this.disable) return;
			for(var i=0;i<this.objs.length;i++)			
				this._removeClass(this.obj[this.objs[i]], 'element-button-' + this.objs[i] + '-mousedown');	
		};
		this._buttonMouseOut = function(){				
			//if(this.disable) return;
			for(var i=0;i<this.objs.length;i++) {		
				this._removeClass(this.obj[this.objs[i]], 'element-button-' + this.objs[i] + '-mouseover');	
				this._removeClass(this.obj[this.objs[i]], 'element-button-' + this.objs[i] + '-mousedown');	
			}				
		};		
		//assign proper events
		this.AddEvent({obj: this.obj, type: 'mouseover', onevent: this._buttonMouseOver});
		this.AddEvent({obj: this.obj, type: 'mouseout', onevent: this._buttonMouseOut});
		this.AddEvent({obj: this.obj, type: 'mousedown', onevent: this._buttonMouseDown});
		this.AddEvent({obj: this.obj, type: 'mouseup', onevent: this._buttonMouseUp});
		
		//run abstraction
		if(this.__create) this.__create();
		
		return this.obj;	  
	},
	Write: function(where) {		
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	},
	GetBody: function() {
		return this.obj;
	},
	GetButton: function() {
		return this.obj;
	},
	SetValue: function(val) {
		$V(this.obj.center, val);
	},
	SetIcon: function(icon) {
		if(this.obj.icon)
			this.obj.icon.firstChild.src = icon;		
	},
	OnClickEvent: function(func) {	
		this.obj.OnClickEventFunc = func;	
		this.AddEvent({obj: this.obj, type: 'click', onevent: this.__onClickEvent});	
	},
	Disabled: function(status) {		
		if(!this.obj.center) return;
		if($WI.Check(status, true)) {
			this._buttonMouseDown();
			this.disable = true;
			this.obj.center.disabled = true;
		} else {
			this._buttonMouseUp();
			this._buttonMouseOut();
			this.obj.center.disabled = false;
			this.disable = false;
		}
	},	
	__onClickEvent: function(event, _target, obj) {	
		if(this.disable) return;
		obj.OnClickEventFunc();	
	} 	
});
/*********************************************************
*		Button link element
*********************************************************/
$WI.Class.ButtonLink = new $WI.Class({	
	__create: function(options) {	
		this._addClass(this.obj.left, 'element-button-image-link');
		this._addClass(this.obj.icon, 'element-button-image-link');
		this._addClass(this.obj.center, 'element-button-image-link');
		this._addClass(this.obj.right, 'element-button-image-link');
	}
});
$WI.extend($WI.Class.ButtonLink, $WI.Class.Button);
/*********************************************************
*		Button menu element
*********************************************************/
$WI.Class.ButtonMenu = new $WI.Class({	
	__create: function(options) {	
		this._addClass(this.obj.left, 'element-button-image-link');
		this._addClass(this.obj.icon, 'element-button-image-link');
		this._addClass(this.obj.center, 'element-button-image-link');
		this._addClass(this.obj.right, 'element-button-image-link');
		if($WI.Class.Menu) {
			this.obj.menu = this._insertDOM(this.obj.center.parentNode, {objType: 'td', objClass: 'element-button-center element-button-image'}, 'insertafter');
			var menu_button = this._insertDOM(this.obj.menu, {objType: 'div', objClass: 'element-button-menu'}, 'insertinto');
			this._addClass(this.obj.menu, 'element-button-image-link');
			this.objs.push('menu');
			
			this.obj.menu.cls = new $WI.Class.Menu;
			this.obj.menu.cls.Create({});
			this.obj.menu.cls.Write();						
		}
	},
	GetMenu: function() {
		return this.obj.menu.cls;
	},
	AddMenu: function(options){
		return this.GetMenu().AddMenu(options);
	},
	AddItem: function(options){
		return this.GetMenu().AddItem(options);
	}
});
$WI.extend($WI.Class.ButtonMenu, $WI.Class.Button);
