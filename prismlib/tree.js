/*********************************************************
*		Dynamic Tree CLASS
*		Designed & developed by Dima Svirid, 2007	
*		Class: tree.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Tree = new $WI.Class({	
	Create: function(options) {
		if(!options) var options = {};
		this.options = options;
		this.options.dataFormat = {type: 'html'};	
		this.selected = [];
		this.allnodes = [];
		this.obj = this._createDOM({objType: 'div', objClass: 'element-tree'});
		this.xml_mask = {title: 'title', icon: 'icon', children: 'children'};
		if(this._isIE()&&!this._isIE8()) this.options.effect = false;
		else this.options.effect = $WI.Check(this.options.effect, true);
		
		this.AddEvent({obj: document, type: 'click', onevent: this._treeDocumentDown});
	},	
	Data: function(options) {	
		this.options.dataFormat = options;		
	},
	LoadData: function(instance, xml) {
		this.RemoveChildren((instance) ? instance : this.obj);		
		if(xml) {this._xmlResponse(xml, xml, instance);return;} //if xml is already passed no need to load
		if(this.system_busy) return; 
		if(instance) {
			instance.loaded = true;
			this._isDisplay(instance.icon, false);
			this._isDisplay(instance.wait, true);			
		}		
		this.system_busy = true;
		if(this.options.dataFormat.type=='ajax') {
			var treeparams = '';
			var tp = this.options.dataFormat.treeparams;
			if(tp&&instance) {
				for(var attr in tp) 			
					if(instance.params[tp[attr]])
						treeparams += '&' + attr + '=' + instance.params[tp[attr]];
			}
			
			this.Request({url: this.options.dataFormat.url, method: 'post', onComplete: this._xmlResponse, instance: instance, parameters: this.options.dataFormat.parameters + treeparams});		
		
		} else if(this.options.dataFormat.type=='rpc') {
			
			//parse parameters
			var parameters = this.options.dataFormat.parameters;
			if(instance)
				for(var i in instance.params)
					if(parameters[i] && instance.params[i]) 
						parameters[i] = instance.params[i]

			this.Rpc().RpcAppend(	{namespace: this.options.dataFormat.namespace, method: this.options.dataFormat.method},
														this.options.dataFormat.parameters)
						  .RpcOnComplete(this._rpcResponse)
							.RpcMessage(this.options.dataFormat.message)		
						  .RpcCall(this, instance)														 
						  ;
		}
	},	
	XMLMask: function(xml_mask) {		
		this.options.xml_mask = xml_mask;
	},	
	TitleMask: function(mask) {		
		this.options.title_mask = mask;
	},
	GetBody: function(){
		return this.obj;
	},	
	GetSelected: function() {
		return this.selected;
	},
	GetNode: function(_name, _value) {
		for(var i=0;i<this.allnodes.length;i++)
			if(this.allnodes[i].params[_name] == _value)
				return this.allnodes[i];
		return null;
	},
	Write: function(where) {	
		if(this.obj) {
			this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');												
		}
	},
	AddNode: function(options) {
		var item = this._createNode(options);
		item.params = options;
		return item;
	}, 
	SelectNode: function(obj) {
		this._selectItem(obj);
	},
	ClearTree: function() {	
		this.selected = [];
		this.allnodes = [];
		this.system_busy = false;
		var children = this._getChildren(this.obj);
		for(var i=0;i<children.length;i++)
			this._removeDOM(children[i]);
	}, 
	RemoveNode: function(node) {	
		this.selected.Remove(node);	
		this.allnodes.Remove(node);	
		if(node.subtree) {
			var children = this._getChildren(node.subtree.content);
			for(var i=0;i<children.length;i++)
				this.RemoveNode(children[i]);
		}
		this._removeDOM(node.subtree);
		this._removeDOM(node);
	}, 
	RemoveChildren: function(node) {	
		if(node && node.subtree) {
			var children = this._getChildren(node.subtree.content);
			for(var i=0;i<children.length;i++)
				this.RemoveNode(children[i]);
		}
	}, 
	DragDrop: function(config) {
		this.dragdrop = true;
		if(!config) var config = {};
			
		if($WI.Class.DragDrop){					
		} else $WI.trace("dragdrop.js Class is required and must be included into the page!");	
	},
	InlineEdit: function() {
		this.inlineedit = true;
	},
	DisableTree: function() {
		if(!this.disable_screen)
			this.disable_screen = this._insertDOM(this.obj, {objType: 'div', backgroundColor: '#000000', position: 'absolute', textAlign: 'center',	top: '0px', left: '0px', zIndex: 10000, width: '100%', height: this._fixPx(this._getHeight(this.obj)), opacity: .7}, 'insertinto');	
	},
	EnableTree: function() {
		if(this.disable_screen)
			this._removeDOM(this.disable_screen);
		this.disable_screen = null;
	},
	OnClickEvent: function(func) {
		this.clickevent = func;
	},
	OnDblClickEvent: function(func) {
		this.dblclickevent = func;
	},
	_rpcResponse: function(xml, text, instance) {		
		var response = this.RpcResponse(xml);
		if(!response)	return;
		this._xmlResponse(response[0], text, instance);	
	},
	_xmlResponse: function(xml, text, instance, subnode) {			
		if(!this.options.xml_mask) return false;				
		var nodes = xml.getNodes('.' + this.options.dataFormat.xpath);	
		var mask = this.options.xml_mask;
		//alert(nodes.length)
		for(var i=0;i<nodes.length;i++) {
			var __title = nodes[i].getNode('./' + mask['title']).getNodeValue();
			var __icon  = nodes[i].getNode('./' + mask['icon']).getNodeValue();
			var __children = nodes[i].getNode('./' + mask['children']).getNodeValue();
			var __custom_css = nodes[i].getNode('./' + mask['custom_css']).getNodeValue();			
			//generate proper title
			var _children = nodes[i].getNodes('./*');
			if(this.options.title_mask) {
				var _title = this.options.title_mask;
				for(var j=0;j<_children.length;j++)
					_title = _title.replace('%' + _children[j].getNodeName() + '%', _children[j].getNodeValue());
			} else 
				var _title = __title;
			var item = this._createNode({parent: instance, title: _title, icon: __icon});
			if(__custom_css&&__custom_css!='') this._addClass(item, __custom_css);
			//set nodes params			
			item.params = {parent: instance};
			for(var j=0;j<_children.length;j++) {
				item.params[_children[j].getNodeName()] = _children[j].getNodeValue();
			}
			if(parseInt(__children) > 0)
				this._visibility(item.node, true);				
			
			//check for the children
			var subchildren = nodes[i].getNode('.' + this.options.dataFormat.xpath);
			if(subchildren.isXmlNode())	{				
				this._xmlResponse(nodes[i], text, item, true);
			}
				
		}		
		
		if(instance && !subnode) {			
			instance.expanded = false;
			var h = this._getHeight(instance.subtree.content);
			this._setStyle(instance.subtree.content, 'top', this._fixPx(-h));
			this._isDisplay(instance.wait, false);
			this._isDisplay(instance.icon, true);	
			this.Fire(null, 'nodefired', instance);		
			
			if(nodes.length==0) this._visibility(instance.node, false);	 		
		}			
		this.system_busy = false;
		
		
	},
	_createNode: function(options) {			
		var item = this._insertDOM((options.parent)?options.parent.subtree.content:this.obj, {objType: 'div', objClass: 'element-tree-item'}, 'insertinto');
		item.node = this._insertDOM(item, {objType: 'div', objClass: 'element-tree-item-node', visibility: 'hidden'}, 'insertinto');
		item.icon = this._insertDOM(item, {objType: 'img', objClass: 'element-tree-item-icon png', src: options.icon}, 'insertinto');
		item.wait = this._insertDOM(item, {objType: 'img', objClass: 'element-tree-item-icon', src: '/prism_resource/images/indicator_arrows.gif', display: 'none'}, 'insertinto');
		item.txt = this._insertDOM(item, {objType: 'div', objClass: 'element-tree-item-text', html: options.title}, 'insertinto');

		item.subtree = this._insertDOM((options.parent)?options.parent.subtree.content:this.obj, {objType: 'div', objClass: 'element-tree-subtree'}, 'insertinto');
		item.subtree.content = this._insertDOM(item.subtree, {objType: 'div', objClass: 'element-tree-subtree-content'}, 'insertinto');

		item.expanded = true;
		item._construct = this;
		
		if(options.parent)
			this._visibility(options.parent.node, true);			

		this.AddEvent({type: 'nodefired', obj: item, onevent: this._onNodeEvent});		
		this.AddEvent({type: 'click', obj: item.node, onevent: {obj: item, fire: 'nodefired'}});
		this.AddEvent({type: 'click', obj: item.icon, onevent: {obj: item, fire: 'nodefired'}});
		this.AddEvent({type: 'mouseover', obj: item, onevent: this._onMouseEvent});
		this.AddEvent({type: 'mouseout', obj: item, onevent: this._onMouseEvent});
		this.AddEvent({type: 'click', obj: item, onevent: this._onMouseEvent});
		this.AddEvent({type: 'dblclick', obj: item, onevent: this._onMouseEvent});
		this.AddEvent({type: 'mousedown',	obj: item, onevent: this._onDragEvent});
		
		if(options.parent) {
		//	this.AddEvent({type: 'fixheight', obj: item, onevent: {obj: options.parent, fire: this._fixSubcontentHeight}});	
			//this.AddEvent({type: 'nodefired', obj: item, onevent: {obj: options.parent, onevent: this._fixSubcontentHeight}});	
		}
		this.allnodes.push(item);
		//this._cancelSelect(null, true, item);
		return item;
	},
	_setDragStatus: function(status) {		
		if(status=='add') { 
			if($WI.REG.Buttons.Ctrl) {
				this._addClass(this.proxy.item.node, 'element-tree-proxy-item-signclone');
				this._removeClass(this.proxy.item.node, 'element-tree-proxy-item-signmove');	
			} else {
				this._addClass(this.proxy.item.node, 'element-tree-proxy-item-signmove');
				this._removeClass(this.proxy.item.node, 'element-tree-proxy-item-signclone');	
			}
		} else {
		 this._removeClass(this.proxy.item.node, 'element-tree-proxy-item-signmove');	
		 this._removeClass(this.proxy.item.node, 'element-tree-proxy-item-signclone');	
		}
	},
	_onDragEvent: function(event, _target, obj) {
		if(!this.dragdrop) return;
		this.proxy =  this._insertDOM(null, {objType: 'div', objClass: 'element-tree-proxy'}, 'insertinto');	
		this.proxy._construct = this;
		this.proxy.reference = obj;
		this.proxy.params = obj.params;
		this._insertDOM(this.proxy, {objType: 'div', objClass: 'element-tree-proxy-shadow', opacity: .1}, 'insertinto');	
		this.proxy.body = this._insertDOM(this.proxy, {objType: 'div', objClass: 'element-tree-proxy-body'}, 'insertinto');

		this.proxy.item = this._insertDOM(this.proxy.body, {objType: 'div', objClass: 'element-tree-item'}, 'insertinto');	
		this.proxy.item.node = this._insertDOM(this.proxy.item, {objType: 'div', objClass: 'element-tree-proxy-item-sign'}, 'insertinto');
		this.proxy.item.icon = this._insertDOM(this.proxy.item, {objType: 'img', objClass: 'element-tree-item-icon png', src: obj.icon.src, left: '22px'}, 'insertinto');
		this.proxy.item.txt = this._insertDOM(this.proxy.item, {objType: 'div', objClass: 'element-tree-item-text', html: obj.txt.innerHTML, left: '42px'}, 'insertinto');
	
		var xy = this._getMouseXY(event);
		this._applyConfig(this.proxy, {						
					top: this._fixPx(xy.y),
					left: this._fixPx(xy.x)
		});			
		var _temp = $WI.Drag(this.proxy);
				_temp._Drag(event, this.proxy, this.proxy);					
				
		this.AddEvent({type: 'drag', obj: this.proxy, onevent: this._onMoveEvent});
		this.AddEvent({type: 'drop', obj: this.proxy, onevent: this._onDropEvent});		
	},
	_onDropEvent: function(event, _target, obj) {			
		//if(this.drag_timeout) clearTimeout(this.drag_timeout);
		
		this._removeDOM(obj); //must be after the Fire event
		/*
		for(var i = _target.parentNode; i; i = i.parentNode) {			
			if(i.nodeType != 1) continue;				
			this.Fire(null, 'treedropevent', i);
		}			*/
		//check same item first
		var ___parents = this._getParents(_target, {byClassName: 'element-tree-subtree', ifnull:
			this._getParents(_target, {byClassName: 'element-grid-body'})
		});
		for(var i=0;i<___parents.length;i++)			
			if(___parents[i].previousSibling&&___parents[i].previousSibling==obj.reference)
				return;		
	
		var ___target = this._getParent(_target, {byClassName: 'element-tree-item', ifnull: 
			this._getParent(_target, {byClassName: 'element-grid', ifnull: _target})
		});
		if(___target==obj.reference)
			return;
			
		//fire drop event on a target
		event.obj = obj;
		var _target = this._getParent(_target, {byClassName: 'element-tree', ifnull: 
			this._getParent(_target, {byClassName: 'element-grid', ifnull: _target})
		});
		this.Fire(event, 'treedropevent', _target);		
	  //setTimeout(function(){document.body.mouseup()}.Apply(this), 2000);
	},
	_onMoveEvent: function(event, _target, obj) {		
		this._cancelEvent(event);				
		$WI.Cursor();
		var xy = this._getXY(obj);
		var _target = this._getParent(_target, {byClassName: 'element-tree', ifnull: 
			this._getParent(_target, {byClassName: 'element-grid', ifnull: _target})
		});
		this._applyConfig(obj, {						
						visibility: 'visible',
						top: this._fixPx(xy.y+10),
						left: this._fixPx(xy.x+10)
				});			
		if(this.EventTypeExists(_target, 'treedropevent'))
			this._setDragStatus('add');
		else
			this._setDragStatus();
		
		//this._isDisplay(obj, false);
		//set timeout to prevent onclick mousemove event
	//	this.drag_timeout = setTimeout(function(){this.__onMoveEvent(event, _target, obj)}.Apply(this), 3000);
	},
	__onMoveEvent: function(event, _target, obj) {		
		
	},
	_unSelectAll: function() {
		for(var i=0;i<this.selected.length;i++) 
			this._removeClass(this.selected[i], 'element-tree-item-selected');
		this.selected = [];
	},
	_selectItem: function(obj, event) {
		if(this.selected.Search(obj)!=-1) {
			/*
			if(this.inlineedit&&!this.edit_field) {
				this.edit_field = new $WI.Class.FormField;
				this.edit_field.Create({type: 'text', width: '150px', value: $V(obj.txt)});					
				this.edit_field.Write(obj);		
				this.edit_field.OnSubmitEvent(function(){$WI.trace('SUMIT')});
				this.edit_field.__txt = obj.txt;
				this._isDisplay(obj.txt, false);
				this.edit_field.GetBody().focus();
				this.edit_field.GetBody().select();
				this._cancelSelect(null, false, obj);
				this._cancelEvent(event);
			}*/
			return;
		}
		this._unSelectAll();
		this.selected.push(obj);
		this._removeClass(obj, 'element-tree-item-over');
		this._addClass(obj, 'element-tree-item-selected');
	},
	_onMouseEvent: function(event, _target, obj) {		
		if(event.type=='mouseover') {
			this._addClass(obj, 'element-tree-item-over');
		} else if(event.type=='mouseout') {
			this._removeClass(obj, 'element-tree-item-over');
		} else if(event.type=='dblclick') {
			if(this.dblclickevent) {
				 if(this._construct) this.dblclickevent.apply(this._construct, [event, obj]);
				 else this.dblclickevent(event, obj);
				 this._cancelEvent(event);
			}
		}	else {
			this._selectItem(obj, event);
			if(this.clickevent) {
				if(this._construct) this.clickevent.apply(this._construct, [event, obj]);
				else this.clickevent(event, obj);
			}
		}
	},
	_treeDocumentDown: function(event, _target, obj) {
		if(this.edit_field) {
			this._isDisplay(this.edit_field.__txt, true);
			this._removeDOM(this.edit_field.GetBody());
			this.edit_field = null;
		}
	},
	_onNodeEvent: function(event, _target, obj) {		
		this._cancelEvent(event);
		
		if((this.options.dataFormat.type=='ajax' || this.options.dataFormat.type=='rpc')&&!obj.loaded) {
			obj.expanded = false;
			return this.LoadData(obj);
		}
		
		//kill prevouos
		if(this._effect) this._effect.Stop();
		
		if(!obj.expanded) {				
			obj.expanded = true;			
			this._isDisplay(obj.subtree, true);		
							
			if(this.options.effect) {
				this._setStyle(obj.subtree, 'overflow', 'hidden');
				
				this._effect = new $WI.Animation(
					{obj: obj.subtree.content, style: 'top', tweening: 'strongIn', from: -this._getHeight(obj.subtree.content), to: 0, speed: 10}
				);
				this.AddEvent({obj: this._effect, type: 'finished', onevent: function(){
					this._setStyle(obj.subtree, 'overflow', 'visible');
					this._addClass(obj.node, 'element-tree-item-node-expended');		
				}});
			} else {
				this._addClass(obj.node, 'element-tree-item-node-expended');	
				this._setStyle(obj.subtree.content, 'top', '0px');		
			}
		} else {
			obj.expanded = false;		
			
			if(this.options.effect) {
				this._setStyle(obj.subtree, 'overflow', 'hidden');	
				
				this._effect = new $WI.Animation(
					{obj: obj.subtree.content, style: 'top', tweening: 'strongIn', from: 0, to: -this._getHeight(obj.subtree.content), speed: 10}
				);
				this.AddEvent({obj: this._effect, type: 'finished', onevent: function(){
					this._isDisplay(obj.subtree, false);
					this._setStyle(obj.subtree, 'overflow', 'visible');	
					this._removeClass(obj.node, 'element-tree-item-node-expended');				
				}});
			}	else { 
				this._isDisplay(obj.subtree, false);		
				this._removeClass(obj.node, 'element-tree-item-node-expended');
			}	
		}	
	}
	
});
