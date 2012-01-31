/*********************************************************
*		Dynamic Grid CLASS
*		Designed & developed by Dima Svirid, 2007	
*		Class: grid.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Grid = new $WI.Class({
	Header: function(harray) {		
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-grid', config: {}});				
		this.options = {dataFormat: {type: 'array'}, multiple: false};
		this.rullerWidth = 4;								//width of the ruller, separator between columns
		this.scrollerWH = {w: 15, h: 15};		//scroller width and height
		this.rullers = [];
		this.columns = [];
		this.selected = [];	
		this.loaded = [];		//saved just the number of the row
		this.headerdata = harray;
		this.gridsConn = [];								//drag and drop object
		this.selection = {columnId: 0};								//selection settings			
				
		//this.headerdata.unshift({header: '#', width: 25, sortable: false, autonumber: true});
		
		this.headerBody = this._insertDOM(null, {objType: 'div', objClass: 'element-grid-header'});	
		var cwidth = 0;
		for(var i=0; i< this.headerdata.length; i++) {
			if(!this.headerdata[i].width) this.headerdata[i].width = 150;
			var headr = this._insertDOM(this.headerBody, {objType: 'div', objClass: 'element-grid-header-column', width: this._fixPx(this.headerdata[i].width)}, 'insertinto');		
			this._insertDOM(headr, {objType: 'div', objClass: 'element-grid-header-text', html: this.headerdata[i].header, display: (this.headerdata[i].hidden)?'none':'block', textAlign: $WI.Check(this.headerdata[i].align, 'left')}, 'insertinto');			
			
			this.headerdata[i].obj = headr;
			this.headerdata[i].obj.index = i;
			
			if(this.headerdata[i].hidden)
				this.headerdata[i].width = 0;
			
			if(this.headerdata[i].sortable) {
				this.AddEvent({type: 'mouseover', obj: headr, onevent: this._headerAction});	
				this.AddEvent({type: 'mouseout', obj: headr, onevent: this._headerAction});
				this.AddEvent({type: 'click', obj: headr, onevent: this._headerAction});		
			}
		} 
		
		this.AddEvent({type: 'ajusting', obj: this.obj, onevent: this.AjustGrid});			
		  
	},	
	Data: function(data) {	
		if(!this.mainBody) {
			this.mainBody = this._insertDOM((this.mobj) ? this.mobj : null, {objType: 'div', objClass: 'element-grid-body-view'}, 'insertinto');		
			this.gridBody = this._insertDOM(this.mainBody, {objType: 'div', objClass: 'element-grid-body'}, 'insertinto');	
			this.AddEvent({type: 'click', obj: this.gridBody, onevent: this._onSelectEvent});
			this.AddEvent({type: 'dblclick', obj: this.gridBody, onevent: this._onDblClickItem});		
		}		
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
	ReloadData: function() {		
		this._removeChildren();
		this.LoadData();
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
	Write: function(where) {		
		if(where)	this.obj.where = where;
		this.main = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-grid-main'}, 'insertinto');		
		
		this.mobj = this._insertDOM(this.main, {objType: 'div', objClass: 'element-grid-container'}, 'insertinto');
		
		this.AddEvent({obj: this.main, type: 'mousewheel', onevent: this._scrollGrid});
		
		//set rulers
		for(var i=0; i< this.headerdata.length; i++) {
		var ruler = this._insertDOM(this.mobj, {objType: 'div', objClass: 'element-grid-ruler', width: this._fixPx(this.rullerWidth), display: (this.headerdata[i].hidden)?'none':'block'}, 'insertinto');				
				ruler.column = i;
				ruler._this = this;			
				this.rullers.push(ruler);
				
			//default sorting
			if(this.headerdata[i].sortby)
				this._headerAction({type: 'click'}, this.headerdata[i].obj, this.headerdata[i].obj);	
		
		}
		
		this._insertDOM(this.mobj, {newNode: this.headerBody}, 'insertinto');	
		if(this.mainBody) this._insertDOM(this.mobj, {newNode: this.mainBody}, 'insertinto');	
				
		this.scrollerBody = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-grid-scroller-body'}, 'insertinto');	
		this.scroller = this._insertDOM(this.scrollerBody, {objType: 'div', objClass: 'element-grid-scroller'}, 'insertinto');		
		this.AddEvent({obj: this.scrollerBody, type: 'scroll', onevent: this._scrollGrid});
				
		this._insertDOM((where&&$E(where))?$E(where):null, {newNode: this.obj}, 'insertinto');	
		this._setStyle($E(where), 'overflow', 'hidden');
		
		this._ajustHeaderWidth(); 	
		this._enableRulers();
	},	
	GetBody: function() {
		return this.obj;
	},
	GetTotalRows: function() {
		return (this.columns[0]&&this.columns[0].rows) ? this.columns[0].rows.length : 0;
	},	
	GetValue: function(col, row) {		
		//if row is not passed choose currently selected one
		if(!row && this.selected[col])		
			return this.selected[col].value;
		else if(row && $WI.IsNumeric(row) && this.columns[col])	{
			if(this.columns[col].rows[row])
				return this.columns[col].rows[row].value;
		}			
		return null;
	},
	SortBy: function(config) {	
		//starts from 1...
		if(config&&config.column&&config.order&&this.headerdata[config.column].sortable)
			this.headerdata[config.column].sortby = config.order;
	},
	SelectRowByValue: function(col, val) {
		var col = this.columns[col];
		if(col&&col.rows&&col.rows.length)
			for(var j=0; j< col.rows.length; j++) 
				if(col.rows[j].value==val)
					this._selectItem(col.rows[j]);			
	},
	Selection: function(config) {	
		//starts from 1...
		if(config&&config.columnId&&$WI.IsNumeric(config.columnId)&&config.columnId<=this.headerdata.length)
			this.selection.columnId = config.columnId;
	},
	AddGridToDrag: function(obj) {
		if(this.gridsConn.Search(obj)==-1)
			this.gridsConn.push(obj);	
	},
	AjustGrid: function() {
		return this._ajustHeaderWidth();	
	},
	UnSelectAll: function(obj){
		for(var j=0; j< this.selected.length; j++) {
			if(!obj||obj.index[1]!=this.selected[j].index[1])
				this._unselectItem(this.selected[j]);					
		}
	},
	DragDrop: function(config) {
		if(!config) var config = {};
		
		//assign supported grids between the objects
		if(config.grids){
			this.AddGridToDrag(this);
			for(var t=0;t<config.grids.length;t++)
				this.AddGridToDrag.apply(config.grids[t], [config.grids[t]]);
		}			
		if($WI.Class.DragDrop){
			//for(var i=0;i<this.columns.length;i++) {
				this.AddEvent({type: 'mousedown',	obj: this.mainBody, onevent: this._onDragEvent});	
			//}
			this.drag = true;		

		} else $WI.trace("dragdrop.js Class is required and must be included into the page!");	
	},
	_removeChildren: function() {		
		for(var j=0; j< this.columns.length; j++) {
			var _ch = this._getChildren(this.columns[j]);
			for(var i=0; i< _ch.length; i++) 
				this._removeDOM(_ch[i]);
		}		
		this.selected = [];
		this.columns = [];
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
		var rowdata;		
		var cleft = cwidth = 0;		
	
		for(var j=0; j< this.headerdata.length; j++) {
			if(this.columns[j]) {
				var column = this.columns[j];
			} else {
				var column = this._insertDOM(this.gridBody, {objType: 'div', objClass: 'element-grid-body-column', width: this._fixPx(this.headerdata[j].width), left: this._fixPx(cleft), display: (this.headerdata[j].hidden)?'none':'block'}, 'insertinto');	
				this.columns.push(column);
				this.columns[j].rows = [];	
			}
			var start = this.columns[j].rows.length;
			for(var i=0; i<data.length; i++) {				
				var rowdata = this._insertDOM(column, {objType: 'div', objClass: 'element-grid-body-row'}, 'insertinto');	
				if(this.headerdata[j].autonumber) this._addClass(rowdata, 'element-grid-body-row-auto');				
				this._insertDOM(rowdata, {objType: 'div', objClass: 'element-grid-body-text', textAlign: $WI.Check(this.headerdata[j].align, 'left'), html: (this.headerdata[j].autonumber)?(start+1)+'.':(this.headerdata[j].type=='image')?'<img src="'+data[i][j]+'" onerror="this.src=\'/api2.0/src/images/spacer.gif\'" />':data[i][j]}, 'insertinto');
				rowdata.value = data[i][j];
				rowdata.index = [j, start];
				this.columns[j].rows.push(rowdata);
				//this._cancelSelect(rowdata, true);
				start++;
			}
			if(!$WI.Check(this.headerdata[j].hidden, false))
				cleft += this.headerdata[j].width + this.rullerWidth - 2;	
		}		
		setTimeout(function(){this._ajustGridWH();}.Apply(this), 500); //must be pause to fix bug in Chrome
	},
	_onSelectEvent: function(event, _target, obj) {			
		var _target = this._getParent(_target, {byClassName: 'element-grid-body-row', ifnull: _target});
		var index = this.selected.Search(_target);
		if(index==-1)	this._selectItem(_target);					
		//else this._unselectItem(_target);
	},
	_onDblClickItem: function(event, _target, obj) {			
		var _target = this._getParent(_target, {byClassName: 'element-grid-body-row', ifnull: _target});
		this.UnSelectAll(_target);
		this.Fire(null, 'dblclickrow', this);	
	},	
	_onDragEvent: function(event, _target, obj) {
		//alert(_target.className)
	},	
	_ajustGridWH: function() {			
		var w = this._getWidth((this.obj.where)?this.obj.where:this.obj);		
		if(!w||parseInt(w)==0) w = this._getWidth(this.obj);		
		var h = this._getHeight(this.obj);
		var headerH = this._getHeight(this.headerBody);
		var hdelta = 0;
		var hc = 0;

		//total width
		var totalW = 0;
		for(var i=0; i< this.headerdata.length; i++) {
			if($WI.Check(this.headerdata[i].hidden, false))	continue;
			totalW += this.headerdata[i].width + this.rullerWidth - 2;			
		}
		
		if(this.columns.length > 0)
			hc = this._getHeight(this.columns[Math.ceil(this.columns.length/2)])-hdelta;	
		
		//var records = this._getChildren(this.columns[0]).length;
	//	var rheight = hc/records;
		
		//if total records is passed and it is more then we have loaded, create an empty spacer
		if(this.options.total_records && parseInt(this.options.total_records) > 0)
			hc = this.options.total_records*rheight;		
				
		this._applyConfig(this.main, {width: this._fixPx(w-this.scrollerWH.w-1), height: this._fixPx(h-this.scrollerWH.h - hdelta-1)});
		this._applyConfig(this.mobj, {width: this._fixPx(totalW)});	
		this._applyConfig(this.gridBody, {height: this._fixPx(hc)});			
		
		//alert(this.gridBody.className + '|' + hc + '|' + this.options.total_records + '|' + records + '|' + rheight)			
		
		this._applyConfig(this.scrollerBody, {width: this._fixPx(w), height: this._fixPx(h - headerH - hdelta), top: this._fixPx(headerH)});		
		this._applyConfig(this.scroller, {width: this._fixPx(totalW), height: this._fixPx(hc)});	
	},
	_scrollGrid: function(event, _target, obj) {		
		this._cancelEvent(event);
		if(!this._scrollTop) this._scrollTop = 0;
		//lets preload items if required			
		this._preloadItems();
		//scroll action on a main body
		if(obj.className=='element-grid-main'){		
			if(obj.scrollTop>=0&&obj.scrollTop<parseInt(obj.scrollHeight-this._getHeight(obj))){			
				if(this._getWheelDelta(event)>0)
					this._scrollTop -= 39;
				else
					this._scrollTop += 39;				
				this.scrollerBody.scrollTop = this._scrollTop;
				this._scrollGrid(event, _target, this.scrollerBody);
			}			
			return;
		}
		
		this._setStyle(this.gridBody, 'top', this._fixPx(-obj.scrollTop));
		this._setStyle(this.mobj, 'left', this._fixPx(-obj.scrollLeft));
		this._scrollTop = obj.scrollTop;	
		
	},
	_preloadItems: function(start){
		// if total records is set means it was loaded dynamically continue;
		if(!this.options.total_records) return;
		
		//create timeout
		if(this.__pages_preloader) clearTimeout(this.__pages_preloader);
		if(!start) {
			this.__pages_preloader = setTimeout(function(){this._preloadItems(true)}.Apply(this), 300);
			return;
		}
		//lets preload	
		var h = this._getHeight(this.gridBody);
		var hr = h/this.options.total_records;
		var hm = this._getHeight(this.mainBody);
		var from = Math.ceil(this._scrollTop/hr);
		var to = Math.ceil(hm/hr) + from;
		this.LoadData(null, from, to);
	},	
	_getScrolled: function(){
		return {x: this.scrollerBody.scrollLeft, y: this.scrollerBody.scrollTop};
	},	
	_ajustHeaderWidth: function(event, _target, obj) {
		//change with of the header		
		var cleft = 0;			
		var diff = 0;
		if(obj) {
			var _this = obj._this;
			var col = obj.column;			
			var newx = this._getXY(_this.rullers[col], true).x;
			var diff = newx - _this.rullers[col].x;
			_this.rullers[col].x = newx;
			_this.headerdata[col].width = _this.headerdata[col].width+diff;			
		} else {
			var _this = this;
		}
		var w = this._getWidth(_this.obj);	
		
		for(var i=0; i< _this.headerdata.length; i++) {
			this._applyConfig(_this.headerdata[i].obj, {width: this._fixPx(_this.headerdata[i].width), left: this._fixPx(cleft)});
			if(_this.columns[i])
				this._applyConfig(_this.columns[i], {width: this._fixPx(_this.headerdata[i].width), left: this._fixPx(cleft)});
			
			cleft += _this.headerdata[i].width;			
			this._applyConfig(_this.rullers[i], {left: this._fixPx(cleft)});			
			_this.rullers[i].x = cleft;
			if(!$WI.Check(_this.headerdata[i].hidden, false))	
				cleft += _this.rullerWidth - 2;	
			
			//ajust right column to fit all area
			if(cleft<w&&i==_this.headerdata.length-1) {
				diff = w - cleft;
				_this.headerdata[i].width += diff - 17;				
				this._applyConfig(_this.headerdata[i].obj, {width: this._fixPx(_this.headerdata[i].width)});
				if(_this.columns.length > 0 && i==_this.columns.length-1)
					this._applyConfig(_this.columns[i], {width: this._fixPx(_this.headerdata[i].width+5)});
				else if(_this.columns[i])
					this._applyConfig(_this.columns[i], {width: this._fixPx(_this.headerdata[i].width)});
				this._applyConfig(_this.rullers[i], {left: this._fixPx(cleft+diff)});
			} 			
		}		
		_this._ajustGridWH();
	},
	_selectItem: function(obj, drag) {			
		//unselect first if not multiple type
		if(!this.options.multiple)
			this.UnSelectAll();
		var line;
		for(var i=0; i< this.headerdata.length; i++) {
			line = this.columns[i].rows[obj.index[1]];
			if(!drag)this.selected.push(line);
			this._addClass(line, 'element-grid-body-row-selected');	
				
		}
		this.Fire(null, 'selectrow', this);	
	},
	_unselectItem: function(obj) {		
		var line;
		var index = this.selected.Search(obj);
		for(var i=0; i< this.headerdata.length; i++) {
			line = this.columns[i].rows[obj.index[1]];
			if(index||index==0) this.selected.splice(index, 1);		
			this._removeClass(line, 'element-grid-body-row-selected');
		}			
	},		
	_rullerLimit: function(_target, type){
		var _this = _target._this;
		if(type=='left'){	//calculate left limit
			if(_this.rullers[_target.column-1]) {
				return parseInt(this._getXY(_this.rullers[_target.column-1], true).x + 10);				
			}	else {
				//return parseInt(this._getXY(this.header, true).x + 10);	
				return 10;
			}
		} else {				//calculate right limit		
		}
	},
	_fixDragRuler: function(event, _target, obj){
		var px = this._getXY(this.GetProxy().obj, true).x;
		this._applyConfig(this.GetProxy().obj, {
												left: this._fixPx(px-obj._this._getScrolled().x)																		
												});												
	},
	_enableRulers: function(){
		if($WI.Class.DragDrop){			
			for(var r=0;r<this.rullers.length;r++) {
				var _ruler = $WI.Drag(this.rullers[r], {moveY: false, limits: {left: this._rullerLimit}});
						_ruler.UseProxy({parent: this.main, height: '100%', background: 'none', border: 0, borderLeft: '1px dashed red'});
				_ruler._addClass(this.rullers[r], 'element-grid-ruler-cursor');
				_ruler.AddEvent({type: 'drag', obj: _ruler.GetBody(), onevent: this._fixDragRuler});
				_ruler.AddEvent({type: 'drop', obj: _ruler.GetBody(), onevent: this._ajustHeaderWidth});
			}					
		}
	},
	_headerAction: function(event, _target, obj) {
		switch(event.type) {
			case 'mouseover':
				this._addClass(obj, 'element-grid-header-column-mouseover');
				break;		
			case 'mouseout': 
				this._removeClass(obj, 'element-grid-header-column-mouseover');
				break;
			case 'click':
				for(var i=0; i< this.headerdata.length; i++) {
					this._removeClass(this.headerdata[i].obj, 'element-grid-header-column-sort');
					this._removeClass(this.columns[i], 'element-grid-body-column-sort');
				}
				this._addClass(obj, 'element-grid-header-column-sort');
				this._addClass(this.columns[obj.index], 'element-grid-body-column-sort');
				
				var test = ['dima', 'svirid', 'blablabl'];
				//alert(test)
				test.sort(this._sortCaseinsensitive);
				//alert(test)
				break;
		}
	},
	_sortCaseinsensitive: function(a,b) {
		if (a.toLowerCase()==b.toLowerCase()) return 0;
		else if (a.toLowerCase()<b.toLowerCase()) return -1;
		else return 1;
	},
	_sortCurrency: function(a,b){
		aa = getInnerText(a.cells[SORT_COLUMN_INDEX]).replace(/[^0-9.]/g,'');
		bb = getInnerText(b.cells[SORT_COLUMN_INDEX]).replace(/[^0-9.]/g,'');
		return parseFloat(aa) - parseFloat(bb);
	},
	_sortNumeric: function(a,b) {
    var aa = parseFloat(getInnerText(a.cells[SORT_COLUMN_INDEX]));
		if (isNaN(aa)) aa = 0;
		var bb = parseFloat(getInnerText(b.cells[SORT_COLUMN_INDEX]));
		if (isNaN(bb)) bb = 0;return aa-bb;
	},
	_sortDate: function(a,b) {
		var aa = getInnerText(a.cells[SORT_COLUMN_INDEX]);
		var bb = getInnerText(b.cells[SORT_COLUMN_INDEX]);
		if (aa.length == 10)
			var dt1 = aa.substr(6,4)+aa.substr(3,2)+aa.substr(0,2);
		else {
			var yr = aa.substr(6,2);
			if (parseInt(yr) < 50)
				yr = '20'+yr;
			else
				yr = '19'+yr;
			var dt1 = yr+aa.substr(3,2)+aa.substr(0,2);
		}
		if (bb.length == 10)
			var dt2 = bb.substr(6,4)+bb.substr(3,2)+bb.substr(0,2);
		else {
			var yr = bb.substr(6,2);
			if (parseInt(yr) < 50)
				yr = '20'+yr;
			else 
				yr = '19'+yr;
			var dt2 = yr+bb.substr(3,2)+bb.substr(0,2);
		}
		if (dt1==dt2) return 0;
		if (dt1<dt2) return -1;
		return 1;
	} 	
});
