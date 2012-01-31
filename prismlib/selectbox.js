/*********************************************************
*		Custom Single and Multiple Select Box CLASS, with the search functionality
*		Designed & developed by Dima Svirid, 2008	
*		Class: selectbox.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Selectbox = new $WI.Class({
	Create: function(options) {			
		if(!options) var options = {};
		this.options = options;	
		this.selected = [];
		this.just_selected = null;
		this.obj = this._createDOM({objType: 'div', objClass: 'element-selectbox', width: this._fixPx(this.options.width)});	
		this.obj._this = this;
		this.obj.area = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-selectbox-textarea'}, 'insertinto');	
		//this.obj.input = this._insertDOM(this.obj.area, {objType: 'input', type: 'text', value: 'Hello world!', objClass: 'element-selectbox-input'}, 'insertinto');
		this.obj.input = this._insertDOM(this.obj.area, {objType: 'div', objClass: 'element-selectbox-inputdiv'}, 'insertinto');
		this.obj.data = this._insertDOM(this.obj.area, {objType: 'input', type: 'hidden', name: this.options.name}, 'insertinto');		
		
		this.obj.drop = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-selectbox-dropdown', display: 'none', config: (this.options.drop)?this.options.drop:null}, 'insertinto');		
		
		if(this._isIE6())	//IE6 transparency hack
			this._insertDOM(this.obj.drop, {objType: 'iframe', position: 'absolute', width: '103%', height: '100%', frameBorder: 0}, 'insertinto');
		
		this.obj.drop.options = this._insertDOM(this.obj.drop, {objType: 'div', objClass: 'element-selectbox-options'}, 'insertinto');
		//this.obj.drop.shadow = this._insertDOM(this.obj.drop, {objType: 'img', src: '/api2.0/src/images/shadow_sharp.png', objClass: 'element-selectbox-dropdown-shadow png'}, 'insertinto');
		this.obj.drop.shadow = this._insertDOM(this.obj.drop, {objType: 'div', objClass: 'element-selectbox-dropdown-shadow', opacity: .2}, 'insertinto');

		this.AddEvent({obj: this, type: 'openbox', onevent: this._onBoxEvent});
		this.AddEvent({obj: this, type: 'closebox', onevent: this._onBoxEvent});
		this.AddEvent({obj: this, type: 'selectoption', onevent: function(){}});
		this.AddEvent({obj: this.obj, type: 'click', onevent: this._onBoxEvent});
		this.AddEvent({obj: document.body, type: 'click', onevent: this._onDocumentClick});
		this.AddEvent({obj: this.obj, type: 'mouseover', onevent: this._onTimeoutEvent});
		this.AddEvent({obj: this.obj, type: 'mouseout', onevent: this._onTimeoutEvent});
		this.AddEvent({obj: this.obj.drop, type: 'mouseover', onevent: this._onTimeoutEvent});
		this.AddEvent({obj: this.obj.drop, type: 'mouseout', onevent: this._onTimeoutEvent});
		this.AddEvent({obj: this.obj.drop, type: 'click', onevent: this._onMouseEvent});
		
		if(this.options.search) {
			this.AddEvent({obj: this.obj.area, type: 'dblclick', onevent: this._onDblSearchEvent});
			this.AddEvent({obj: this, type: 'selectoption', onevent: this._onHideSearchEvent});
		}
		
		this._cancelSelect(null, true, this.obj);
		this._cancelSelect(null, true, this.obj.drop);
		
	},		
	Deinit: function() {
		this.RemoveEvent({obj: this.obj.drop});
		this.RemoveEvent({obj: this.obj});
		this.RemoveEvent({obj: this});
		this.RemoveEvent({obj: document.body, type: 'click', onevent: {obj: this, fire: 'closebox'}});
		this._removeDOM(this.obj.drop);
		this._removeDOM(this.obj);
	},
	XMLMask: function(xml_mask) {		
		this.options.xml_mask = xml_mask;
	},	
	Data: function(options) {	
		this.options.dataFormat = options;		
	},
	ReloadData: function(event, xml, text) {		
		this.RemoveAll();
		this.LoadData(event, xml, text);
	},
	LoadData: function(event, xml, text) {
		if(this.options.loaded) return; 
		if(xml) {this._xmlResponse(xml);return;} 
		
		this.options.loaded = true;
		
		this.obj.input.innerHTML = 'Loading';
		
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
	Write: function(where) {		
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	},	
	GetBody: function(){
		return this.obj;
	},
	GetDropDown: function(){
		return this.obj.drop;
	},
	GetValue: function(){
		return this.obj.data.value;
	},
	GetSelected: function(){
		return this.just_selected;
	},
	GetOptions: function(){
		return this._getChildren(this.obj.drop.options);
	},
	GetOption: function(index){
		var children = this._getChildren(this.obj.drop.options);
		return children[index];
	},
	GetOptionIndex: function(id) {
		var children = this._getChildren(this.obj.drop.options);
		for(var i=0;i<children.length;i++)
			if(children[i].value==id)
				return i;
		return -1;
	},
	AddOption: function(options) {
		if(!options||(!options.text&&!options.value)) { //create separator
			var row = this._insertDOM(this.obj.drop.options, {objType: 'div', objClass: 'element-selectbox-separator'}, 'insertinto');
		} else {
			var row = this._insertDOM(this.obj.drop.options, {objType: 'a', objClass: 'element-selectbox-row', height: (this.options.rowHeight) ? this._fixPx(this.options.rowHeight) : null}, 'insertinto');					
			if(options.content && typeof options.content == 'object')
				row.appendChild(options.content);
			else if(options.content)
				row.innerHTML = options.content;
			else 
				row.innerHTML = options.text;
			
			row.checkbox = this._insertDOM(row, {objType: 'div', objClass: (options.icon) ? 'element-selectbox-row-icon' : 'element-selectbox-row-checkbox'}, 'insertinto');
			//set icon
			if(options.icon) 
				this._setStyle(row.checkbox, 'background', 'url('+options.icon+')');

			if(options.content && $E(options.content)) {
				this._insertDOM(row, {newNode: $E(options.content)}, 'insertinto');	
				this._isDisplay(options.content, true);		
				this._addClass(row, 'element-selectbox-row-text-wrap');			
			}		
				
			row.txt = options.text;
			row.value = options.value;			
		}		
		return row;
	},	
	SelectOption: function(val, mark) {
		if(typeof val == 'object') this._onMouseEvent({type: 'click'}, val, val, mark);
		else {
			var children = this._getChildren(this.obj.drop.options);
			for(var i=0;i<children.length;i++) {			
				if(children[i].value==val)
					this._onMouseEvent({type: 'click'}, children[i], children[i], mark);
			}
		}
	},
	MarkOption: function(val) { //does the same as Select but does not fire main select event
		this.SelectOption(val, true);
	},
	UnSelectAll: function() {
		for(var i=0;i<this.selected.length;i++)
			this._unSelectRow(this.selected[0]);
	},
	RemoveOption: function(option) {
		this._unSelectRow(option);
		this._removeDOM(option);		
	},
	RemoveAll: function() {
		this.options.loaded = false;
		var children = this._getChildren(this.obj.drop.options);
		for(var i=0;i<children.length;i++)
			this.RemoveOption(children[i]);
	},
	AjustDivs: function() {
		return this._ajustDivs();
	},
	IsSelected: function(id) {
		return (this.selected.Search(id, 'value')!= -1) ? true : false;
	},
	_onDocumentClick: function(event, _target, obj) {
		this.Fire(event, 'closebox', this);
		this._onHideSearchEvent();
	},
	_findMaxWidth: function(row) {
		var children = this._getChildren(this.obj.drop.options);
		var __width;
		var __max = this._getWidth(children[0]);
		if(__max)
			for(var i=1;i<children.length;i++) {			
				__width = this._getWidth(children[i]);
				__max = Math.max(__max,__width);
			}
		return __max;
	},
	_ajustDivs: function() {		
		this._setStyle(this.obj.drop.options, 'height', 'auto');
		
		var xy = this._getXY(this.obj);
		var _xy = this._getScrollXY();
		var client = this._getClientWH();
		var __max = this._findMaxWidth();
		var w = this._getWidth(this.obj);
		var h = this._getHeight(this.obj);
		var wo = __max;
		var ho = this._getHeight(this.obj.drop.options) - this._getStyleInt(this.obj.drop.options, 'paddingTop')*2;
		var to = xy.y+h;
		var lo = xy.x;
		var wd = this._getWidth(this.obj.drop);
		var __wDiff = client.w - lo + _xy.x;
		var __hDiff = client.h - to + _xy.y;
		
		if(__wDiff<wo) wo = __wDiff - 10; 
		if(__hDiff<ho) ho = __hDiff - 10; 
		if(wo<w) wo = w - 4;
		this._applyConfig(this.obj.drop, {width: this._fixPx(wo), top: this._fixPx(to), left: this._fixPx(xy.x), height: this._fixPx(ho)});
		this._applyConfig(this.obj.drop.options, {height: this._fixPx(ho)});	
	},
	_onTimeoutEvent: function(event, _target, obj) {
		if(event.type=='mouseover') {
			if(this.timeout) clearTimeout(this.timeout);
			this._addClass(obj, 'element-selectbox-mouseover');
		} else if(event.type=='mouseout') {
			this.timeout = setTimeout(function(){this.Fire(null, 'closebox', this);}.Apply(this), 500);
			this._removeClass(obj, 'element-selectbox-mouseover');
		}
	},
	_unSelectRow: function(obj) {
		if(obj.separator) return;
		var index = this.selected.Search(obj);	
		if(index==-1)	return;		
		this.selected.splice(index, 1);				
		this._removeClass(obj, 'element-selectbox-row-selected');
		this._removeClass(obj.checkbox, 'element-selectbox-row-checkbox-selected');
	},
	_onMouseEvent: function(event, _target, obj, mark) {	
		var obj = this._getParent(_target, {byClassName: 'element-selectbox-row', ifnull: _target});
		if(obj.separator || !this._hasClass(obj, 'element-selectbox-row')) return;
		if(event.type=='click') {
			//single selection mode
			if($WI.Check(this.options.multiple, true) == false)
				this.UnSelectAll();
							
			var index = this.selected.Search(obj);			
			if(index==-1) { 	//select
				this.selected.push(obj);
				this._addClass(obj, 'element-selectbox-row-selected');
				this._addClass(obj.checkbox, 'element-selectbox-row-checkbox-selected');				
			} else {					//unselect
				this._unSelectRow(obj);
			}			
			this._populateData();
			this.just_selected = obj.value;
			if(!mark)
				this.Fire(event, 'selectoption', this);			
		}
	},
	_onDblSearchEvent: function(event, _target, obj) {		 
		this._display(obj, false);
		this.searchfield = this._insertDOM(this.obj, {objType: 'input', type: 'text'}, 'insertinto');
		this.searchfield.focus();
		this.AddEvent({obj: this.searchfield, type: 'keyup', onevent: function() {
			if((typeof this.options.search).toLowerCase() == 'function')
				this.options.search.apply(this, [this.searchfield.value]);
			else {
				var options = this._getChildren(this.obj.drop.options);
				for(var i=0;i<options.length;i++) {
					var rexp = eval("/" + this.searchfield.value + "/ig");	
					if(this.searchfield.value == '' || new RegExp(rexp).exec(options[i].value) || new RegExp(rexp).exec(options[i].txt))
						this._display(options[i], true);
					else
						this._display(options[i], false);
				}			
				this._ajustDivs();		
				this.Fire(null, 'openbox', this);	
			}
		}});		
	},
	_onHideSearchEvent: function() {
		if(this.searchfield) { 
			this.RemoveEvent({obj: this.searchfield});
			this._removeDOM(this.searchfield);				
			this._apply(this._getChildren(this.obj.drop.options), this._display, true);				
			this._display(this.obj.area, true);
		}
	},
	_onBoxEvent: function(event, _target, obj) {		
		if(event.fire=='openbox') {			
			//copy drop down to the body tag
			if(this.obj.drop.parentNode.tagName.toLowerCase() != 'body') {
				document.body.appendChild(this.obj.drop);	
				var w = this._getStyleInt(this.obj, 'width');
				this._applyConfig(this.obj.area, {width: this._fixPx(w-20)});																						
			}			
			this._isDisplay(this.obj.drop, true);
			this._ajustDivs();
			this._maxZ(this.obj.drop);		
		} else if(event.fire=='closebox' || event.fire == 'closebox' ) {			
			this._applyConfig(this.obj.drop.options, {height: ''});
			this._isDisplay(this.obj.drop, false);
		} else if(event&&event.type=='click') {		
			
			if(this._hasClass(_target, 'element-selectbox-row', true)||this._hasClass(_target, 'element-selectbox-row-checkbox', true)) {
				this._cancelEvent(event);
				return false;
			}	
			
			if(obj.tagName.toLowerCase()=='body' || this._display(this.obj.drop))
				this.Fire(null, 'closebox', this);
			else
				this.Fire(null, 'openbox', this);			
			
			if(obj.tagName.toLowerCase()!='body')
				this._cancelEvent(event);
		}
	},
	_populateData: function() {
		var selected_values = [];
		var selected_text = [];
		for(var i=0;i<this.selected.length;i++) {
			selected_values.push(this.selected[i].value);
			selected_text.push(this.selected[i].txt);
		}
		this.obj.data.value = selected_values.join(',');
		this.obj.input.innerHTML = selected_text.join(', ');
	},
	_rpcResponse: function(xml, text, event) {		
		var response = this.RpcResponse(xml);
		if(!response)	return;
		this._xmlResponse(response[0], text, event);	
	},
	_xmlResponse: function(xml, text, event) {	
		//set status to loaded			
		this.obj.input.innerHTML = '';
		
		//make rpc call to load main options
		var items = xml.getNodes('.' + this.options.dataFormat.xpath);
		var mask = this.options.xml_mask;		
		
		for(var i=0;i<items.length;i++) 			
			if(items[i].getNode('./' + mask['value']).getNodeValue() == ''||items[i].getNode('./' + mask['text']).getNodeValue() == '')
				this.AddOption();
			else
				this.AddOption({text: items[i].getNode('./' + mask['text']).getNodeValue(),
												icon: (items[i].getNode('./' + mask['icon'])) ? items[i].getNode('./' + mask['icon']).getNodeValue() : null,
											 	value: items[i].getNode('./' + mask['value']).getNodeValue()
												});
		//reopen selectbox
		//if(event)	this.OpenMenu(event);
		
		this.Fire(null, 'loaded', this);
	}				
});
