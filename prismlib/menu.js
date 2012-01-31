/*********************************************************
*		Dynamic Menu CLASS
*		Designed & developed by Dima Svirid, 2007	
*		Class: menu.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Menu = new $WI.Class({	
	Create: function(options) {
		if(!options) var options = {};
		this.options = options;
		if(!this.options.timeout)	this.options.timeout = 500;	
		this.mainmenus = [];
		this.submenus = [];
		this.allitems = [];
		this.options.dataFormat = {type: 'html'};	
		if(this._isIE6()) this.options.effect = false;
		this.obj = this._createDOM({objType: 'div', objClass: 'element-menu'});
		//commented by Dima S. to support multiple showmenu methods
		//this.AddEvent({type: 'showmenu', obj: this, onevent: this.OpenMenu});	
		this.AddEvent({type: 'click', obj: document, onevent: function(){this.CloseAll()}.Apply(this)});	 
	},	
	Data: function(options) {	
		this.options.dataFormat = options;		
	},
	XMLMask: function(xml_mask) {		
		this.options.xml_mask = xml_mask;
	},	
	LoadData: function(event) {
		if(this.options.loaded) return; 
		this.options.loaded = true;
		
		this.options.loading = this.AddItem({parent: this.submenus[0], 
 																			   icon: '/api2.0/src/images/indicator_arrows.gif', 
																				 title: 'Please wait ... loading'});
		
		if(this.options.dataFormat.type=='ajax') {
			var treeparams = '';
			var tp = this.options.dataFormat.treeparams;
			if(tp&&instance) {
				for(var attr in tp) 			
					if(instance.params[tp[attr]])
						treeparams += '&' + attr + '=' + instance.params[tp[attr]];
			}
			
			this.Request({url: this.options.dataFormat.url, method: 'post', onComplete: this._xmlResponse, instance: event, parameters: this.options.dataFormat.parameters + treeparams});		
		
		} else if(this.options.dataFormat.type=='rpc') {
			//parse parameters
			var parameters = this.options.dataFormat.parameters;
			this.Rpc().RpcAppend(	{namespace: this.options.dataFormat.namespace, method: this.options.dataFormat.method},
														this.options.dataFormat.parameters)
						  .RpcOnComplete(this._rpcResponse)
						  .RpcCall(this, event)														 
						  ;
		}
	},	
	HTMLData: function(d) {	
		var n = $E(d);
		if(!n) return;		
		var submen_item = null;
		var descendents = this._getDescendents(n);
		for(var i=0;i<descendents.length;i++) {
				
			//$WI.trace(descendents[i].nodeValue + '|' + descendents[i].nodeName);
			
			if(descendents[i].nodeName.toLowerCase() == 'li') {
				if(descendents[i].id)
					var menu_block = this.AddMenu({button: descendents[i].id});
				else {
					//var menu_block = this.AddMenu({});						
					//submen_item.AddSubMenu(menu_block);
				}				
			} else if(submen_item && descendents[i].nodeName.toLowerCase() == 'ul') {
				
				var menu_block = this.AddMenu({});						
						submen_item.AddSubMenu(menu_block);
			} else {				
				
					if(descendents[i].nodeType == 3 && descendents[i].nodeValue.Trim() != '') {
						submen_item = this.AddItem({parent: menu_block, title: descendents[i].nodeValue, onclick: null, icon: '/prism_resource/images/icons16x16/system_locked.png'});
					}
				
					var _parent = this._getParent(descendents[i], {byTagName: 'a'});
					if(_parent) {
					
					}
				
				
			}
		}				
		return;		
	},
	GetBody: function() {	
		return this.obj;
	},	
	Write: function(where) {	
		if(this.obj) {
			this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');								
		}
	},
	OnClickEvent: function(func) {
		this.clickevent = func;
	},
	OpenMenu: function(event, _target, obj) {			
		this.Fire(event, 'showmenu', this.submenus[0]);
	},
	Deinit: function() {			
		this.ClearMenu();
		this.RemoveEvent({obj: this});
		this.RemoveEvent({type: 'click', obj: document, onevent: function(){this.CloseAll()}.Apply(this)});
		this._removeDOM(this.obj);
	},
	CloseAll: function(){		
		if(this.mainmenus.length==0) this.mainmenus = [this.submenus[0]]; 
		for(var i=0;i<this.mainmenus.length;i++)			 
			this.Fire(null, 'closemenu', this.mainmenus[i]);
	},
	ClearMenu: function(){		
		for(var i=0;i<this.submenus.length;i++) {
			//if(this.submenus[i].button) this.RemoveEvent({obj: this.submenus[i].button});
			this.RemoveEvent({obj: this.submenus[i]});
			this._removeDOM(this.submenus[i]);
		}
		this.allitems = [];
		this.submenus = [];
	},
	ClearSubMenu: function(obj){	
		var _children = this._getChildren(obj.mbody);
		for(var i=_children.length;i>0;i--) 			
			_children[i-1].RemoveItem();
	},
	GetSelectedMenu: function() {
		var selected = [];
		for(var i=0;i<this.allitems.length;i++) 
			if(this.allitems[i].selected)
				selected.push(this.allitems[i]);			
		return selected;
	},
	AddMenu: function(options) {	
		if(!options) var options = {};
		if(!this.submenus) this.submenus = [];
		var menu = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-menu-submenu', config: options, top: '-1000px', left: '-1000px', display: 'none'}, 'insertinto');				
		menu.shadow = this._insertDOM(menu, {objType: 'img', objClass: 'element-menu-submenu-shadow png', src: '/api2.0/src/images/shadow_light.png', width: '100%', height: '100%'}, 'insertinto');
		menu.mbody = this._insertDOM(menu, {objType: 'div', objClass: 'element-menu-submenu-body'}, 'insertinto');	
		menu._construct = this;
		this._cancelSelect(null, true, menu);
		
		this.AddEvent({type: 'selectitem', obj: menu, onevent: this._onMouseEvent});	
		this.AddEvent({type: 'unselectitem', obj: menu, onevent: this._onMouseEvent});	
		
		this.AddEvent({type: 'showmenu', obj: menu, onevent: this._onMenuEvent});	
		this.AddEvent({type: 'closemenu', obj: menu, onevent: this._onMenuEvent});
		
		this.AddEvent({type: 'mouseover', obj: menu, onevent: this._onMouseFullEvent});
		this.AddEvent({type: 'mouseout', obj: menu, onevent: this._onMouseFullEvent});
		
		if(options.button) { 
			menu.button = $E(options.button);
			this.mainmenus.push(menu);
			var __href = $E(options.button).href;
			if(__href && __href != '' && (/javascript:/i).test(__href) == false)
				this.AddEvent({type: 'click', obj: $E(options.button), onevent: function(){location.href=__href}});
			this.AddEvent({type: 'click', obj: $E(options.button), onevent: {obj: menu, fire: 'showmenu'}});
			if(this.options.onMouseOver)
				this.AddEvent({type: 'mouseover', obj: $E(options.button), onevent: {obj: menu, fire: 'showmenu'}});
		}
		this.submenus.push(menu);		
		
		//lets make custom call
		if(options.func) menu.func = options.func;
	
		return menu;
	},
	AddSubMenu: function(submenu) {	
		this.submenu = submenu;
		submenu.parent = this;
		
		if(this.button)
			submenu.button = this.button;
		
		$WI.DOM.AddEvent({type: 'click', obj: this, onevent: {obj: this.submenu, fire: 'showmenu'}});
		$WI.DOM.AddEvent({type: 'closemenu', obj: this.parent, onevent: {obj: this.submenu, fire: 'closemenu'}});
		
		//if(this._construct.options.onMouseOver) {
			//$WI.DOM.AddEvent({type: 'mouseover', obj: this, onevent: {obj: this.submenu, fire: 'showmenu'}});
		//}
				
		$WI.DOM._isDisplay(this.subm, true);		
	},
	AddItem: function(options) {	
		if(!options.title) return this._createSeparator(options);
		var item = this._insertDOM(options.parent.mbody, {objType: 'a', objClass: 'element-submenu-item'}, 'insertinto');	
		if(options.href) item.href = options.href; 
		if(options.type == 'checkbox') {
			item.icon = this._insertDOM(item, {objType: 'div', objClass: 'element-submenu-checkbox'}, 'insertinto');
			this.AddEvent({type: 'click', obj: item, onevent: this.SetStatus});
		} else if(options.type == 'radio') {
			item.icon = this._insertDOM(item, {objType: 'div', objClass: 'element-submenu-radio'}, 'insertinto');
			this.AddEvent({type: 'click', obj: item, onevent: this.SetStatus});
		} else {
			if(options.icon)
				item.icon = this._insertDOM(item, {objType: 'img', objClass: 'element-submenu-item-icon png', src: options.icon}, 'insertinto');
			else
				item.icon = this._insertDOM(item, {objType: 'span', objClass: 'element-submenu-item-icon'}, 'insertinto');
		}
		
		item.txt = this._insertDOM(item, {objType: 'div', objClass: 'element-submenu-item-text', html: options.title}, 'insertinto');
		item.subm = this._insertDOM(item, {objType: 'div', objClass: 'element-submenu-item-right', display: 'none'}, 'insertinto');			
		item.parent = options.parent;
		if(options.type)item.type = options.type;
		if(options.value)item.value = options.value;
		
		if(options.parent&&options.parent.button)
			item.button = options.parent.button;
		
		this.AddEvent({type: 'mouseover', obj: item, onevent: {obj: options.parent, fire: 'selectitem'}});
		this.AddEvent({type: 'mouseout', obj: item, onevent: {obj: options.parent, fire: 'unselectitem'}});		
		//set onclick if loaded by xml
		if(!options.onclick && this.clickevent) options.onclick = this.clickevent;
		
		if(options.onclick && (!options.noclick || options.noclick != 1)) {		
			if(this._construct)
				this.AddEvent({type: 'click', obj: item, onevent: function(event, _target, obj){if(item.disable)return false;this._onItemClick(event, _target, obj);options.onclick.apply(this._construct, [event, item.parent.button, item.parent]);}});
			else
				this.AddEvent({type: 'click', obj: item, onevent: function(event, _target, obj){if(item.disable)return false;this._onItemClick(event, _target, obj);options.onclick(event, item.parent.button, item.parent);}});
		}		
		
		if(options.params) item.params = options.params;
		item.AddSubMenu = this.AddSubMenu;
		item._construct = this;
		item.Disabled = this.Disabled;
		item.RemoveItem = this.RemoveItem;
		item.SetStatus = this.SetStatus;
		item.GetChecked = this.GetChecked;
		//disable the item
		if(options.disabled) item.Disabled();
		if(options.status) item.SetStatus(true);
		if(options.onchange) this.AddEvent({type: 'statuschange', obj: item, onevent: options.onchange});
		
		this.allitems.push(item);
		this._ajustDivs(options.parent.mbody);
		
		//custom call of the function
		if(options.func) {	
			var submenu = this.AddMenu();
			submenu.func = options.func;
			submenu.loading = this.AddItem({parent: submenu, 
											   icon: '/api2.0/src/images/indicator_arrows.gif', 
											 	 title: 'Please wait ... loading'});	
												
			item.AddSubMenu(submenu);
		} 	
		
		return item;
	},
	RemoveItem: function() {		
		this._construct.RemoveEvent({obj: this});
		this._construct.allitems.Remove(this);
		this._construct._removeDOM(this);
	},	
	Disabled: function(status) {		
		if($WI.Check(status, true)) {
			this.disable = true;			
			$WI.DOM._addClass(this.txt, 'element-submenu-item-text-disabled');
			if(this.type == 'checkbox')	$WI.DOM._addClass(this.icon, 'element-submenu-checkbox-disabled');
			else if(this.type == 'radio')	$WI.DOM._addClass(this.icon, 'element-submenu-radio-disabled');
		} else {
			this.disable = false;
			$WI.DOM._removeClass(this.txt, 'element-submenu-item-text-disabled');
			$WI.DOM._removeClass(this.icon, 'element-submenu-checkbox-disabled');
			$WI.DOM._removeClass(this.icon, 'element-submenu-radio-disabled');
		}
	},
	SetStatus: function(status, _target, obj) {		
		//change status for checkbox
		if(typeof status == 'object') {
			if(obj.type == 'radio' && obj.checked) return false;
			if(obj.checked) obj.SetStatus(false);
			else obj.SetStatus(true);
			//fire on change event
			this.Fire(null, 'statuschange', obj);
			return true;
		} 		
		//check if elements belongs to any of the groups			
		if(!_target && this.group && this.group.length > 0)
			for(var i=0;i<this.group.length;i++)		
				if(this.group[i] != this) 
					this.group[i].SetStatus(false, true);
				
		if($WI.Check(status, true)) {
			this.checked = true;
			if(this.type == 'checkbox')	$WI.DOM._addClass(this.icon, 'element-submenu-checkbox-selected');
			else if(this.type == 'radio')	$WI.DOM._addClass(this.icon, 'element-submenu-radio-selected');
		} else {
			this.checked = false;
			$WI.DOM._removeClass(this.icon, 'element-submenu-checkbox-selected');
			$WI.DOM._removeClass(this.icon, 'element-submenu-radio-selected');
		}
	},
	SetGroup: function(arr) {			
		for(var i=0;i<arguments.length;i++) 
			arguments[i].group = arguments;
	},
	GetChecked: function() {				
		if(this.group && this.group.length > 0)
			for(var i=0;i<this.group.length;i++) 
				if(this.group[i].checked)
					return this.group[i];		
		return this;
	},
	_onItemClick: function(event, _target, obj){		
		this._selectItem(obj);
		//fire close menu on all main menu objects
		if(this.mainmenus.length > 0)
			for(var i=0;i<this.mainmenus.length;i++)			 
				this.Fire(null, 'closemenu', this.mainmenus[i]);	
		else
			this.Fire(null, 'closemenu', this.submenus[0]);	
	},
	_selectItem: function(item){
		//unselect all others first
		for(var i=0;i<this.allitems.length;i++) {
			this.allitems[i].selected = false;
			this._removeClass(this.allitems[i], 'element-submenu-item-stay-selected');
		}
		item.selected = true;
		if(this.options.staySelected) this._addClass(item, 'element-submenu-item-stay-selected');		
	},
	_createSeparator: function(options){
		var item = this._insertDOM(options.parent.mbody, {objType: 'div', objClass: 'element-submenu-separator', html: '<font></font>'}, 'insertinto');	
		item.RemoveItem = this.RemoveItem;
		return item;
	},
	_ajustDivs: function(obj){
		var children = this._getChildren(obj);
		var h = 0;
		
		for(var i=0;i<children.length;i++) {
			h+= this._getHeight(children[i]);
		}

		this._setStyle(obj.parentNode, 'height', this._fixPx(h));	
		this._setStyle(obj.parentNode.shadow, 'height', this._fixPx(h));		
	},	
	_onMenuEvent: function(event, _target, obj) {			
		var fire = event;
	  if(typeof fire!='string') fire = event.fire;

  	if(fire=='showmenu'&&obj.style.display!='none')
			this.Fire(event, 'closemenu', obj);			
		
		//show menu
		if(fire=='showmenu') {			
			//fire main menu event when menu opens
			if(obj==this.submenus[0]) {
				this.Fire(null, 'showmenu', this);		
				if(this.options.dataFormat.type=='rpc'||this.options.dataFormat.type=='ajax') this.LoadData(event);
			}				
			
			//close all the main menus if cursor moved to another target
			if(this.was_openned&&obj.parent&&obj.parent.parent&&this.was_openned!=obj.parent.parent) 
				this.Fire(event, 'closemenu', this.was_openned);		
			this.was_openned = obj;
			
			if(this.mainmenus.InArray(obj))
				this.CloseAll();
			//obj._target = _target;
			this._isDisplay(obj, true);
			this._ajustDivs(obj.mbody);					
			
			var _target = this._getParent(_target, {byClassName: 'element-submenu-item', ifnull: _target});		
			//if menu is disabled
			if(_target.disable)	return false;
			
			//lets make custom call
			if(obj.func) this._customFuncCall(obj);
			
			if(!this._hasClass(_target, 'element-submenu-item')) { 
				var xy = this._getXY((obj.button) ? obj.button : _target);	
				var w = 0;
				var menu_w = this._getWidth(obj);
				var menu_h = this._getHeight(obj);
				if(obj&&obj.button) {var h = this._getHeight(obj.button);var button_w = this._getWidth(obj.button);}
				else {var h = this._getHeight(_target);var button_w = this._getWidth(_target);}
				
				var __h = h; //assign dynamic source				
					
				//detect if menu gets our of the screeen by width
				if((menu_w+xy.x+20) > this._getClientWH().w) {
					w = button_w-menu_w;
					if(w>0) w = 0 - w;
				}
				//detect if menu gets out of the screeen by height				
				if((menu_h+xy.y) > this._getClientWH().h || (this.options.direction && this.options.direction == 'top')) {
					__h = -menu_h-10;
					//switching menu to expend to the top from bottom
					//now lets check that it fits the top size also										
					//if(w>0) w = 0 - w;
					
					//check if still goes over the top
					if(__h < 0 ) {						
						if(this.options.direction && this.options.direction == 'top') { //menu is always facing top
							var newheight = xy.y;
						} else {
							var __h = h; 
							var newheight = this._getClientWH().h - xy.y;
						}					
						//set h back to where it was						
						var content = null;	
						var column = 1;				
						var _children = this._getChildren(obj.mbody);
						var __chtotal = 0;
						var menuwidth = this._getWidth(obj);
						
						for(var i=0;i<_children.length;i++) {
							if(!_children[i]) break;						
							if(__chtotal > newheight) { 
								this._ajustDivs((content) ? content : obj.mbody);								
								content = this._insertDOM(obj, {objType: 'div', objClass: 'element-menu-submenu-body', left: this._fixPx(menuwidth*column), width: this._fixPx(menuwidth)}, 'insertinto');	
								__chtotal = 0;column++;
								//increase main width of the menu
								this._setStyle(obj, 'width', this._fixPx(menuwidth*column));
							}
							if(content) {
								this._insertDOM(content, {newNode: _children[i]}, 'insertinto');	
								_children.splice(i, 1);			
								--i;
							}
							__chtotal += this._getHeight(_children[i]);
						}	
						if(content) //run to fix the very first body width
							this._setStyle(obj.mbody, 'width', this._fixPx(menuwidth));					
					}						
					
					
				}				
				
				//run main timeout on menu close, to close menu if its not activated in a while
				this._setOpenTimeout(event);
			} else {										
				var xy = this._getXY(_target);	
				var w = this._getWidth(obj)-3;
				var h = __h = 0;	
				var menu_w = this._getWidth(obj);	
				
				//detect if menu gets our of the screeen
				if((menu_w+xy.x+w) > this._getClientWH().w)
					w = -menu_w;
			}		
						
			if(event.type=='contextmenu') {
				var xy = this._getMouseXY(event);			
				this._applyConfig(obj, {top: this._fixPx(xy.y), left: this._fixPx(xy.x)});
			} else {		
				this._applyConfig(obj, {top: this._fixPx(xy.y+__h), left: this._fixPx(xy.x+w)});
			}
			this._maxZ(obj);
			this._maxZ(obj);
			
			if(_target.auto_timeout)	
				clearTimeout(_target.auto_timeout);	
				
		} else if(obj.style.display=='block') {	//hide menu
			
			//return;//CANCEL HIDE MENU
			this._isDisplay(obj, false);
			this._applyConfig(obj, {top: '-1000px', left: '-1000px'});
			this._setMainTimeout(event, obj, false);			
			//detect if there are more them one mbody move their items back and kill
			var _children = this._getChildren(obj, {byClassName: 'element-menu-submenu-body'});
			if(_children.length > 1) {
				for(var i=1;i<_children.length;i++) {
					var _subchildren = this._getChildren(_children[i], {byClassName: 'element-submenu-item'});
					for(var j=0;j<_subchildren.length;j++) 
						this._insertDOM(_children[0], {newNode: _subchildren[j]}, 'insertinto');
					this._removeDOM(_children[i]);
				}
				this._setStyle(_children[0].parentNode, 'width', this._fixPx(_children[0]));		
			}						
		}
		this._cancelEvent(event);
	},
	_onMouseEvent: function(event, _target, obj) {		
		var _target = this._getParent(_target, {byClassName: 'element-submenu-item', ifnull: _target});

		if(event.type=='mouseover') {
			
			//if menu is disabled
			if(_target.disable)	return false;
			
			this._addClass(_target, 'element-submenu-item-selected');
			this._addClass(_target.subm, 'element-submenu-item-right-selected');
			//open submenu if exists after one second
			
			if(_target.submenu)
				if(this.options.onMouseOver)
					this.Fire(event, 'showmenu', _target.submenu);
				else
					_target.auto_timeout = setTimeout(function(){this.Fire(event, 'showmenu', _target.submenu)}.Apply(this), 1000);
			
			if(obj.parent&&obj.parent.parent)
				this._setSubTimeout(event, obj.parent.parent, false);	
			
			this._setMainTimeout(event, obj, false);		
			
		} else if(event.type=='mouseout') {
			
		
			this._removeClass(_target, 'element-submenu-item-selected');
			this._removeClass(_target.subm, 'element-submenu-item-right-selected');
			
			//if(_target.timeout)
				//clearTimeout(_target.timeout);
			
			if(_target.auto_timeout)	
				clearTimeout(_target.auto_timeout);
			
			this._setMainTimeout(event, obj);		
		}
	},		
	_onMouseFullEvent: function(event, _target, obj) {		
		if(event.type=='mouseover') {			
			this._setMainTimeout(event, obj, false);				
		} else if(event.type=='mouseout') {			
			this._setMainTimeout(event, obj);			
		}
		this._cancelEvent(event);
	},
	_setOpenTimeout: function(event){
		this.timeout = setTimeout(function(){this.Fire(null, 'closemenu', this.submenus[0])}.Apply(this), 3000);
		this._cancelEvent(event);
	},
	_setMainTimeout: function(event, obj, status){
		if($WI.Check(status, true)) {
			this.timeout = setTimeout(function(){this.Fire(null, 'closemenu', this.submenus[0])}.Apply(this), this.options.timeout);
			if(obj) this._setSubTimeout(event, obj);
		}	else if(this.timeout) {			
			if(this.timeout) clearTimeout(this.timeout);
			if(obj) this._setSubTimeout(event, obj, false);
		}
		this._cancelEvent(event);
	},
	_setSubTimeout: function(event, obj, status){		
		if($WI.Check(status, true))
			obj.timeout = setTimeout(function(){this.Fire(null, 'closemenu', obj)}.Apply(this), this.options.timeout);
		else if(obj.timeout)			
			clearTimeout(obj.timeout);
		
		this._cancelEvent(event);
	},
	_rpcResponse: function(xml, text, event) {		
		var response = this.RpcResponse(xml);
		if(!response)	return;
		this._xmlResponse(response[0], text, event);	
	},
	_xmlResponse: function(xml, text, event) {	
		//set status to loaded			
		this.options.loading.RemoveItem();
		this.options.loading = null;
		
		//make rpc call to load main menu
		this._buildSubMenu(xml, this.submenus[0]);

		//reopen menu
		if(event)	this.OpenMenu(event);
	},
	_buildSubMenu: function(menuNode, menu_block, button) {
		var items = menuNode.getNodes('.' + this.options.dataFormat.xpath);			
		var mask = this.options.xml_mask;		
		if(button) button.AddSubMenu(menu_block);			
		for(var i=0;i<items.length;i++) {						
			var __button = this.AddItem({parent: menu_block, 
																	 title: items[i].getNode('./' + mask['title']).getNodeValue(), 
																	 noclick: items[i].getNode('./' + mask['noclick']).getNodeValue(), 
																	 icon: 	items[i].getNode('./' + mask['icon']).getNodeValue(),
																	 value: items[i].getNode('./' + mask['value']).getNodeValue(),
																	 type: 	items[i].getNode('./' + mask['type']).getNodeValue()});
			var subitems = items[i].getNodes('.' + this.options.dataFormat.xpath);
			if(subitems.length > 0) 
				this._buildSubMenu(items[i], this.AddMenu(), __button);
		}				
	},
	_customFuncCall: function(obj) {		
		this.ClearSubMenu(obj);		
		var menu = obj.func.call();
		for(var i=0;i<menu.length;i++) {
			var options = menu[i]; options.parent = obj;
			this.AddItem(options);
		}	
			
	}						
});
