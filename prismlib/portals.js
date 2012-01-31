/*********************************************************
*		Portals CLASS
*		Designed & developed by Dima Svirid, 2008	
*		Class: portals.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Portals = new $WI.Class({
	Create: function(options) {
		if(!options) var options = {};
		this.options = options;		
		if(!this.options.columns) this.options.columns = 1; 	
		if(!this.options.padding) this.options.padding = 0; 	
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-portals'});
		this.obj.columns = [];	

		for(var c=0;c<this.options.columns;c++) {
			var column = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-portals-column'}, 'insertinto');
			column.portals = [];
			this.obj.columns.push(column);
		}
		
		
	},
	Write: function(where) {	
		this.where = where;
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
		
		this.AjustDivs();
		this.AddEvent({obj: window, type: 'resize', onevent: this.AjustDivs});
	},
	AddPortal: function(options) {
		if(!options.column) options.column = 0;
		
		var portal = new $WI.Class.Window;
				portal.Create({label: (options.label)?options.label:'', icon: (options)?options.icon:'', shadow: false, width: '200px', height: (options.height)?this._fixPx(options.height):'200px', drag: false, resize: false, marginTop: this._fixPx(this.options.padding)});										
				portal.Content('mycontent');
				portal.Write(this.obj.columns[options.column]);
				
				//portal.GetBody().style.position = 'relative';
			
		this.obj.columns[options.column].portals.push(portal);
		
		this.AjustDivs();
		
		//if(options.type)
			//this.Content(portal.GetContent(), options);				
		
		//add drag events
		this.AddEvent({obj: portal.header, type: 'mousedown', onevent: {fire: 'startdrag', obj: portal.GetBody()}});
		this.AddEvent({obj: portal.footer, type: 'mousedown', onevent: {fire: 'startdrag', obj: portal.GetBody()}});
		this.AddEvent({obj: portal.GetBody(), type: 'startdrag', onevent: this._onDragEvent});
		this.AddEvent({obj: portal.GetBody(), type: 'drag', onevent: this._onDragEvent});
		this.AddEvent({obj: portal.GetBody(), type: 'drop', onevent: this._onDragEvent});
		
		portal.Iframe = this.Iframe;
		portal.Content = this.Content;
		portal.HTML = this.HTML;
		
		return portal;
	},
	AjustDivs: function() {
		var w = this._getWidth(this.obj);
		var _left = 0;
		for(var c=0;c<this.obj.columns.length;c++) {
			var cw = w/this.obj.columns.length;
			this._applyConfig(this.obj.columns[c], {width: this._fixPx(cw), left: this._fixPx(_left)});
			_left += cw;
			//ajust children
			var children = this._getChildren(this.obj.columns[c]);
			for(var i=0;i<this.obj.columns[c].portals.length;i++) {
				this._applyConfig(this.obj.columns[c].portals[i].GetBody(), {width: this._fixPx(cw-this.options.padding)});
				this.obj.columns[c].portals[i].AjustDivs();
			}
		}	

	},	
	Iframe: function(src){
		var content = $WI.DOM._insertDOM(this.GetContent(), {objType: 'iframe', frameBorder: 0, src: src, width: '100%', height: '100%'}, 'insertinto');
		this.content = content;
	},
	Content: function(content){
		if(typeof content == 'string') var content = $E(content);
		this._visible(content, true);		
		this._insertDOM(this.GetContent(), {newNode: content}, 'insertinto');
		this.content = content;
	},
	HTML: function(html){
		var content = this._insertDOM(this.GetContent(), {objType: 'div', html: html}, 'insertinto');
		this.content = content;
	},
	_onDragEvent: function(event, _target, obj, fire) {
		
		if(event.fire=='startdrag') {
			this._visibility(obj, false);	
			this.registry = [];			
			this.registry_cols = [];
			
			//register all portals
			for(var c=0;c<this.obj.columns.length;c++) {				
				var col = this.obj.columns[c];
				var children = this._getChildren(col);
				var xy = this._getXY(col);					
				this.registry_cols.push({obj: col, empty: true, x: xy.x, y: xy.y, w: this._getWidth(col)});
				
				for(var i=0;i<children.length;i++) {					
					if(this._getStyle(children[i], 'display')!='none')
						this.registry_cols[c].empty = false;
						
					var xy = this._getXY(children[i]);					
					this.registry.push({obj: children[i], last: (children.length==(i+1))?true:false,  x: xy.x, y: xy.y, w: this._getWidth(children[i]), h: this._getHeight(children[i])});
				}
			}	
			
			var xy = this._getXY(obj);			
			this.proxy = this._insertDOM(obj, {objType: 'div', objClass: 'element-portals-portal-proxy', width: this._fixPx(this._getWidth(obj)), height: this._fixPx(this._getHeight(obj)), marginTop: this._fixPx(this.options.padding)}, 'insertbefore');				
			this.proxy_win = new $WI.Class.Window;
			this.proxy_win.Create({label: 'This is the Proxy', shadow: false, width: this._fixPx(this._getWidth(obj)), height: this._fixPx(this._getHeight(obj)), top: this._fixPx(xy.y-document.body.scrollTop), left: this._fixPx(xy.x-document.body.scrollLeft), resize: false});										
			this.proxy_win.Write();			
			this.proxy_win.OnWindowDrag(function(event){this.Fire(event, 'drag', obj);});
			this.proxy_win.OnWindowDrop(function(event){this.Fire(event, 'drop', obj);});
			this.proxy_win.OnWindowDrop(this.proxy_win.CloseWindow);			
			this.main = {w: this._getWidth(this.proxy_win.GetBody()), h: this._getHeight(this.proxy_win.GetBody())};			
			this.Fire(event, 'startdrag', this.proxy_win.GetBody());				
			this._isDisplay(obj, false);		
		
		} else if(event.fire=='drop') {
			
			this._insertDOM(this.proxy, {newNode: obj}, 'replace');
			this._visible(obj, true);		
			this._removeDOM(this.proxy);
		
		} else if(event.fire=='drag') {
			
			var xy = this._getXY(this.proxy_win.GetBody());			
			//get the right spot
			//check columns
			for(var i=0;i<this.registry_cols.length;i++) {		
				if(this.registry_cols[i].empty) {
					if(xy.x<=(this.registry_cols[i].x+(this.registry_cols[i].w/2))) {
						this._insertDOM(this.registry_cols[i].obj, {newNode: this.proxy}, 'insertinto');
						return;
					}
				}
			}
			//check portals
			for(var i=0;i<this.registry.length;i++) {					
				if(xy.x<=(this.registry[i].x+(this.registry[i].w/2))&&xy.y<=(this.registry[i].y+(this.registry[i].h/2))) {
					this._insertDOM(this.registry[i].obj, {newNode: this.proxy}, 'insertbefore');
					break;
				} else if(xy.x<=(this.registry[i].x+(this.registry[i].w/2))&&xy.y>=(this.registry[i].y+(this.registry[i].h/2))) {					
					this._insertDOM(this.registry[i].obj, {newNode: this.proxy}, 'insertafter');
					break;
				}
			
			}
				
			
		}
		
	
		
	}
	
});

