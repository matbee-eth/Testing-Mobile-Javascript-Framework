/*********************************************************
*		Dynamic Grid CLASS
*		Designed & developed by Dima Svirid, 2010	
*		Class: grid2.0.js
*	  Extends: system2.0.js
*********************************************************/
$WI.Class.Grid = new $WI.Class({
	Header: function(harray) {			
		this._prepareGrid();			
		
		this.header.tbl = this._insertDOM(this.header, {objType: 'table', cellSpacing: '0px', cellPadding: '0px', tableLayout: 'fixed'}, 'insertinto');	
		this.main.tbl = this._insertDOM(this.main, {objType: 'table', cellSpacing: '0px', cellPadding: '0px', tableLayout: 'fixed'}, 'insertinto');		
		var row = this._insertDOM(this.header.tbl.tbody, {objType: 'tr'}, 'insertinto');
		var _total = 0;
		for(var i=0; i < harray.length; i++) {		
			var w = $WI.Check(harray[i].width, ($WI.Check(harray[i].hidden, false) ? 0 : 150));
			var th = this._insertDOM(this.header.tbl.tr, {objType: 'th', width: this._fixPx(w)}, 'insertinto');
					th.type = $WI.Check(harray[i].type, "");
					th.hidden = $WI.Check(harray[i].hidden, false);
					th.textAlign = $WI.Check(harray[i].align, null);
			var th2 = this._insertDOM(this.main.tbl.tr, {objType: 'th', width: this._fixPx(w)}, 'insertinto');
			var td = this._insertDOM(row, {objType: 'td'}, 'insertinto');			
					
			this._insertDOM(td, {objType: 'div', html: $WI.Check(harray[i].header, ""), textAlign: (th.textAlign) ? th.textAlign : null}, 'insertinto');			
			//field is hidden
			if(th.hidden) {
				this._display(th, false);this._display(th2, false);this._display(td, false);
			}
			
			_total += w;
			//create rullers
			var ruler = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-grid-ruler'}, 'insertinto');	
					ruler._this = this;		
					ruler.column = i; //asign index of the column
					this.rullers.push(ruler);
			var _ruler = $WI.Drag(ruler, {moveY: false, limits: {left: this._rullerLimit}});
					//_ruler.UseProxy({parent: this.obj, height: '100%', background: 'none', border: 0, borderLeft: '1px dashed red'});
					//_ruler.AddEvent({type: 'drag', obj: _ruler.GetBody(), onevent: this.AjustGrid});	
					_ruler.AddEvent({type: 'startdrag', obj: _ruler.GetBody(), onevent: function(event, _target, obj) {
						obj._this._ajustTables();
						obj._this._addClass(obj, 'element-grid-ruler-drag');
					}});
					_ruler.AddEvent({type: 'drag', obj: _ruler.GetBody(), onevent: this.AjustGrid});	
					_ruler.AddEvent({type: 'drop', obj: _ruler.GetBody(), onevent: function(event, _target, obj) {
						this._removeClass(obj, 'element-grid-ruler-drag');
					}});	
		}			
		this._setStyle(this.header.tbl, 'width', this._fixPx(_total));
		this._setStyle(this.main.tbl, 'width', this._fixPx(_total));
	},		
	Write: function(where) {	
		if(this.obj)
			this._insertDOM((where&&$E(where))?$E(where):null, {newNode: this.obj}, 'insertinto');	
		
		this._ajustRulers();
		this.AjustGrid();
	},
	Deinit: function() {	
		for(var i=0; i < this.rullers.length; i++) this.RemoveEvent({obj: this.rullers[i]}); //remove rullers events
		this.RemoveEvent({obj: this.main}); //
		this.RemoveEvent({obj: this.obj}); //
		this.RemoveEvent({obj: this}); //
	},
	Data: function(data) {	
		this._prepareGrid();		
		
		if($WI.IsArray(data))  //load data from array 
			this._loadArray(data);
		else //load from the xml		
			this.options.dataFormat = data;		
			
	},
	XMLMask: function() {		
		this.options.xml_mask = arguments;
	},	
	Multiple: function() {		
		this.options.multiple = true;
	},	
	ClearGrid: function() {		
		this._removeChildren();
	},
	ReloadData: function(xml) {		
		this._removeChildren();
		this.LoadData(xml);
	},
	RemoveRow: function() {			
		for(var j=this.selected.length-1; j>= 0; j--) { 
			var __child = this.selected[j];
			this.selected.Remove(__child);
			this._removeDOM(__child);
		}
		return;		
	},	
	LoadData: function(xml, from, to) {
		//this.preloader = this._insertDOM(this.main, {objType: 'div', objClass: 'element-grid-loading', opacity: .3, html: 'Please wait ... loading ...'}, 'insertinto');	
		if(xml) {this._xmlResponse(xml);return;} //if xml is already passed no need to load
		//if(from) this.options.dataFormat.parameters.fromrecord = from; else this.options.dataFormat.parameters.fromrecord = 1;
		//if(to) this.options.dataFormat.parameters.torecord = to;
		//else if(this.options.dataFormat.limit) this.options.dataFormat.parameters.torecord = this.options.dataFormat.limit;   
		if(this.options.dataFormat.type=='ajax') {
			this.Request({url: this.options.dataFormat.url, method: 'post', onComplete: this._xmlResponse, parameters: this.options.dataFormat.parameters});					
		} else if(this.options.dataFormat.type=='rpc') {
			this.Rpc().RpcAppend(	{namespace: this.options.dataFormat.namespace, method: this.options.dataFormat.method},
														this.options.dataFormat.parameters)
						  .RpcOnComplete(this._rpcResponse)
							.RpcCache(this.options.dataFormat.cache)
						  .RpcCall(this)														 
						  ;
		}
	},		
	GetBody: function() {
		return this.obj;
	},
	GetTotalRows: function() {
		return parseInt(this.main.tbl.rows.length-1);
	},	
	GetValue: function(col, row) { //row can be a number or object		
		//if row is not passed choose currently selected one
		if(!row && this.selected[0] && this.selected[0].cells[col])	{	
			return this.selected[0].cells[col].title;
		} else if(row && $WI.IsNumeric(row) && this.main.tbl.rows[row+1])	{
			if(this.main.tbl.rows[row+1].cells[col])
				return this.main.tbl.rows[row+1].cells[col].title;
		} else if(row && typeof row == 'object' && row.cells[col])	{
			return row.cells[col].title;
		}			
		return null;
	},
	SortBy: function(col) {	
		this.options.sortby = col;
	},
	SelectRowByValue: function(col, val) {
		var rows = this.main.tbl.rows;
		for(var j=1; j< rows.length; j++) 
			if(rows[j].cells[col].title == val)
				this._selectItem(rows[j]);			
	},
	AjustGrid: function(event, _target, obj) {			
		var _this = this;
		//fix all the columns
		if(obj && this._hasClass(obj, 'element-grid-ruler')) {
			_this = obj._this;
			var cell = _this.header.tbl.rows[0].cells[obj.column];
			var w = this._fixPx(this._getStyleInt(obj, 'left') - _this._getWidthBefore(cell) + 2);
			this._setStyle(cell, 'width', w);
			this._setStyle(_this.main.tbl.rows[0].cells[obj.column], 'width', w);
		}
		//_this._ajustTables();
		_this._ajustRulers();
			
		//lets ajust height of the body
		this._setStyle(_this.main, 'height', this._fixPx(this._getHeight(_this.obj) - this._getHeight(_this.header)));
	},
	UnSelectAll: function(obj){
		for(var j=0; j< this.selected.length; j++) {
			if(!obj) this._unselectItem(this.selected[j]);					
		}
	},	
	DragDrop: function(config) {		
		if(!config) var config = {};	
		this.dragdrop = config;	
			
		if($WI.Class.DragDrop){		
			this.AddEvent({type: 'mousedown',	obj: this.obj, onevent: function(event, _target, obj) {
				var drag = $WI.DragDrop(event, _target, obj, {Class: this});
			}});
			this.AddEvent({obj: this.obj, type: 'ondropevent', onevent: this._onDropEvent});			
		} else $WI.trace("dragdrop.js Class is required and must be included into the page!");	
	},
	GetDragObject: function(_target) {
		var row = this._getParent(_target, {byTagName: 'tr'});
		var div = this._getParent(_target, {byTagName: 'div'});
		if(row && this._hasClass(div, 'element-grid-body')) { //also check if item comes from the body
			var val = this.GetValue(this.dragdrop.title, row);
			var icon = this.GetValue(this.dragdrop.icon, row);
			return {title: val, icon: (icon) ? icon : '/prism_resource/images/spacer.gif'};
		}		
		return null;
	},
	_onDropEvent: function(event, _target, obj) {
		event.params = this.dragdrop.params;
		if(this.dragdrop.onevent) 
			if(this.dragdrop._construct)
				this.dragdrop.onevent.apply(this.dragdrop._construct, [event, _target, obj]);
			else
				this.dragdrop.onevent(event, _target, obj);
	},
	_getWidthBefore: function(col) {
		var cels = this.header.tbl.rows[0].cells;
		var w = 0;
		for(var j=0; j< cels.length; j++) 
			if(col==this.header.tbl.rows[0].cells[j])	break;
			else w += this._getStyleInt(this.header.tbl.rows[0].cells[j], 'width');
		return w - this.main.scrollLeft;
	},
	_prepareGrid: function() {
		if(!this.obj) {
			this.rullers = [];
			this.selected = [];	
			this.options = {dataFormat: {type: 'array'}, multiple: false};
			this.obj = this._createDOM({objType: 'div', objClass: 'element-grid'});			
			this.header = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-grid-header'}, 'insertinto');		
			this.main = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-grid-body'}, 'insertinto');
			this.AddEvent({type: 'click', obj: this.main, onevent: this._onMouseEvent});
			this.AddEvent({type: 'dblclick', obj: this.main, onevent: this._onMouseEvent});	
			this.AddEvent({type: 'mouseover', obj: this.main, onevent: this._onMouseEvent});	
			this.AddEvent({type: 'mouseout', obj: this.main, onevent: this._onMouseEvent});
			this.AddEvent({obj: this.main, type: 'scroll', onevent: function() {
				this.header.scrollLeft = this.main.scrollLeft;
				this._ajustRulers();
			}});//add event to scroll header together	
			this._cancelSelect(null, true, this.obj);
		}
	},
	_removeChildren: function() {		
		var rows = this.main.tbl.rows;
		for(var j=rows.length; j>1; j--)
			this._removeDOM(rows[j-1]);

		this.selected = [];
	},
	_xmlResponse: function(xml, text) {		
		if(!this.options.xml_mask) return false;		
		if(this.preloader) this._removeDOM(this.preloader);//remove prelaoder		
		var nodes = xml.getNodes(this.options.dataFormat.xpath);	
		var mask = this.options.xml_mask;
		//this.options.total_records = 1000;
		var rowdata;
		var data = [];
		for(var i=0;i<nodes.length;i++) {
			rowdata = [];
			for (var j=0;j<mask.length;j++) {
				rowdata.push(nodes[i].getNode('./' + mask[j]).getNodeValue());
			}
			data.push(rowdata);
		}			
		this._loadArray(data);
		this.Fire(null, 'loaded', this);		
	},
	_rpcResponse: function(xml, text) {		
		var response = this.RpcResponse(xml);
		if(!response)	return;
		this._xmlResponse(response[0]);	
	},
	_loadArray: function(data){

		for(var i=0; i<data.length; i++) {		
			var row = this._insertDOM(this.main.tbl.tbody, {objType: 'tr', objClass: ''}, 'insertinto');	
			for(var j=0; j < data[i].length; j++) {					
				var col = this.header.tbl.rows[0].cells[j];
				if(!col) continue;
				var td = this._insertDOM(row, {objType: 'td', objClass: '', html: (col.type=='image') ? ('<img src="'+data[i][j]+'" onerror="this.src=\'/api2.0/src/images/spacer.gif\'" />') : data[i][j], textAlign: (col.textAlign) ? col.textAlign : null}, 'insertinto');	
				td.title = (data[i][j]) ? data[i][j].toString().replace(/<\/?[^>]+(>|$)/g, '') : '';
				if(col.hidden) this._display(td, false);
			}
		
		}	
		this.AjustGrid();	
		
		//if($WI.Check(this.options.sortby, null) !== null)//
			//with(this)
				//this._getChildren(this.main.tbl.tbody).sort(_sortNoCase);
	},
	_onMouseEvent: function(event, _target, obj) {	
		var row = this._getParent(_target, {byTagName: 'tr', ifnull: null});		
		if(row) 
			switch(event.type) {
				case 'mouseover' :
					this._addClass(row, 'element-grid-mouseover');
				break;
				case 'mouseout' :
					this._removeClass(row, 'element-grid-mouseover');
				break;
				case 'click' :
					this._selectItem(row);				
				break;
				case 'dblclick' :
					this.UnSelectAll(_target);
					this.Fire(null, 'dblclickrow', this);			
				break;
			}
			
	},
	_selectItem: function(obj) {			
		//unselect first if not multiple type
		if(!this.options.multiple)
			this.UnSelectAll();
		
		this.selected.push(obj);
		this._addClass(obj, 'element-grid-selected');
		this.Fire(null, 'selectrow', this);	
	},
	_unselectItem: function(obj) {	
		this.selected.Remove(obj);				
		this._removeClass(obj, 'element-grid-selected');
	},		
	_rullerLimit: function(_target, type){
		var _this = _target._this;
		if(type=='left'){	//calculate left limit
			if(_this.rullers[_target.column-1]) 
				return parseInt(this._getXY(_this.rullers[_target.column-1], true).x);				
			else 
				return 10;
		}
	},
	_ajustTables: function(event, _target, obj) {
		var _this = this;
		//fix all the columns
		if(obj && obj.className=='element-grid-ruler') _this = obj._this;
		
		this._setStyle(_this.header.tbl, 'width', this._fixPx(50));
		this._setStyle(_this.main.tbl, 'width', this._fixPx(50));
		/*
		var cels = _this.header.tbl.rows[0].cells;
		var w = 0;
		for(var j=0; j< cels.length; j++) {
			w += this._getStyleInt(cels[j], 'width');
		}
		if(w) {			
			this._setStyle(_this.header.tbl, 'width', this._fixPx(w));
			this._setStyle(_this.main.tbl, 'width', this._fixPx(w));
		}*/
	},
	_ajustRulers: function() {
		var _left = 0; 		
		for(var r=0;r<this.rullers.length;r++) {			
			_left += this._getStyleInt(this.header.tbl.rows[0].cells[r], 'width');
			this._setStyle(this.rullers[r], 'left', this._fixPx(_left-this.main.scrollLeft-2));
		}
	},
	_sortNoCase: function(a, b) {		
		alert(a)
		alert(GetValue)
		alert(this.GetValue(this.options.sortby, a))
		var a = this.GetValue(this.options.sortby, a);
		var b = this.GetValue(this.options.sortby, b);
		$WI.trace(a + '|' + b)
		if (a.toLowerCase()==b.toLowerCase()) return 0;
		else if (a.toLowerCase()<b.toLowerCase()) return -1;
		else return 1;
	}
});
