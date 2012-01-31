/*********************************************************
*		Dynamic Tabs CLASS version 2.0
*		Designed & developed by Dima Svirid, 2008	
*		Class: tabs2.0.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Tabs = new $WI.Class({
	Create: function(options) {		
		if(options)this.options = options;else this.options={};
		this.tabs = [];
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-tabs-v2', zIndex: 2});
		this.obj.content = this._createDOM({objType: 'div', objClass: 'element-tabs-v2-content', config: (this.options.contentConfig)?this.options.contentConfig: null});
		this._applyConfig(this.obj.content, {top: '-1px', zIndex: 1});
		this.obj.content.blocks = [];
		
		this.AddEvent({type: 'selecttab', obj: this.obj, onevent: this._tabEvent});	
		this.AddEvent({type: 'deletetab', obj: this.obj, onevent: this._tabEvent});	
		
		this._cancelSelect(null, true, this.obj);
	},	
	AddTab: function(options){			
		if(!options.position)	options.position = this.tabs.length; 	
		var newtab = this._createTab(options);			
		//this.tabs.push(newtab);
		
		this.tabs.splice(options.position, 0, newtab);
		
		var block = this._insertDOM(this.obj.content, {objType: 'div', objClass: 'element-tabs-v2-content-block', visibility: 'hidden'}, 'insertinto');	
		
		if(typeof options.content=='string'&&$E(options.content)) 	
			options.content = this.Content(options.content);
		
		if(options.content) 
			block.appendChild(options.content);
		
		this.obj.content.blocks[this.tabs.length-1] = block;			
		
		this._isDisplay(block, false);
		
		if(options.selected) this._selectTab(newtab);	
		
		if(options.selected)
			this.Fire(null, 'selecttab', this.obj, newtab);			

		return newtab;
	},
	SelectTab: function(tab){			
		return this._selectTab(tab);		
	},
	GetSelectedTab: function(){			
		for(var i=0;i<this.tabs.length;i++) 
			if(this.tabs[i].selected)	
				return this.tabs[i];			
	},
	GetTab: function(tab){
		return this.tabs[tab];
	},	
	GetTabIndex: function(tab){
		return this._getIndex(tab);
	},	
	DeleteTab: function(tab){			
		var index = this._getIndex(tab);	
		if(index!=-1) {					
			//if removed tab is selected select the one before it
			if(tab.selected && this.tabs.length>1) this._selectTab(this.tabs[(index>0)?index-1:1]);	
			
			var content = this._getContent(tab);
			var tabWidth = this._getWidth(tab);
			
			this._removeDOM(content);	
			this._removeDOM(tab);	
			this.tabs.splice(index, 1);
			this._getBlocks().splice(index, 1);
			
			//for(var i=index;i<this.tabs.length;i++) {
				//this._Animation({effect: 'SlideOut', obj: this.tabs[i], style: 'left', speed: 20, period: -parseInt(tabWidth)});
			//}
				
		}
	},
	Content: function(content){
		this._isVisible($E(content), true);		
		var block = this._insertDOM(null, {newNode: (typeof content=='string')?$E(content):content});	
		return block;
	},
	Write: function(where) {			
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');
		if(this.obj.content)
			this._insertDOM((this.options.content)?$E(this.options.content):this.obj, {newNode: this.obj.content}, (this.options.content)?'insertinto':'insertafter');
	},	
	GetBody: function(){
		return this.obj;
	},
	GetContent: function(tab){
		if(!tab)
			var tab = this.GetSelectedTab();
		return this._getContent(tab);
	},
	ClearContent: function(tab){
		if(!tab)	var tab = this.GetSelectedTab();
				
		var content = this._getContent(tab);

		var children = this._getChildren(content);
		
		for(var i=0;i<children.length;i++) 
			this.RemoveDOM(children[i]);	

	},
	GetContentObj: function(){
		if(this.obj.content) return this.obj.content;		
		else return null;
	},
	SetTitle: function(tab, title){
		if($WI.System.isNumeric(tab)) var tab = this.tabs[tab];		
		tab.label.innerHTML = title;
	},	
	DisableTab: function(tab, status){
		if($WI.System.isNumeric(tab)) var tab = this.tabs[tab];		
		tab.disabled = $_VAR(status, true);
		if(tab.disabled) {
			this._addClass(tab.label, 'element-tabs-v2-tab-text-disabled');
			if(this.GetSelectedTab() == tab)
				this._moveToClosestTab(tab);
		} else
			this._removeClass(tab.label, 'element-tabs-v2-tab-text-disabled');		
	},	
	EnableTab: function(tab){
		this.DisableTab(tab, false);		
	},	
	HideTab: function(tab, status){
		if($WI.System.isNumeric(tab)) var tab = this.tabs[tab];		
		tab.hidden = $_VAR(status, true);
		if(tab.hidden) this._isDisplay(tab, false);
		else this._isDisplay(tab, true);
		if(tab.hidden) {
			if(this.GetSelectedTab() == tab)
				this._moveToClosestTab(tab);
		}
	},	
	ShowTab: function(tab){
		this.HideTab(tab, false);		
	},	
	_moveToClosestTab: function(tab) {
		if(this.tabs[this.GetTabIndex(tab)-1])
			this.SelectTab(this.tabs[this.GetTabIndex(tab)-1]);		
		else if(this.tabs[this.GetTabIndex(tab)+1])
			this.SelectTab(this.tabs[this.GetTabIndex(tab)+1]);		
	},
	_createTab: function(options) {		
		var newtab = this._insertDOM((this.tabs.length == 0) ? this.obj : this.tabs[parseInt(options.position)-1], {objType: 'table', objClass: 'element-tabs-v2-tab', cellSpacing: '0px', cellPadding: '0px', height: '100%'}, (this.tabs.length == 0) ? 'insertinto' : 'insertafter');			
	
				newtab.left = this._insertDOM(newtab.tr, {objType: 'td', objClass: 'element-tabs-v2-tab-left', html: '<img src="/api/src/images/spacer.gif" width=2>'}, 'insertinto');
						
				if(options.icon) {
					//var icon_placer = this._insertDOM(table.tr, {objType: 'td'}, 'insertinto');					
					newtab.icon = this._insertDOM(newtab.left, {objType: 'img', objClass: 'element-tabs-v2-tab-icon png', src: options.icon}, 'insertinto');
					this._addClass(newtab.left, 'element-tabs-v2-tab-left-icon-td');
				}
				newtab.center = this._insertDOM(newtab.tr, {objType: 'td', objClass: 'element-tabs-v2-tab-center'}, 'insertinto');	
				
				if(options.titleImage) {
					newtab.label = this._insertDOM(newtab.center, {objType: 'div', objClass: 'element-tabs-v2-tab-text', left: (options.icon)?'20px':'0px', overflow: 'hidden'}, 'insertinto');
					newtab.label.image = this._insertDOM(newtab.label, {objType: 'img', objClass: 'element-tabs-v2-tab-image png', src: options.titleImage}, 'insertinto');
				} else {
					newtab.label = this._insertDOM(newtab.center, {objType: 'div', objClass: 'element-tabs-v2-tab-text', html: options.title, left: (options.icon)?'20px':'0px'}, 'insertinto');
				}			
				
				newtab.right = this._insertDOM(newtab.tr, {objType: 'td', objClass: 'element-tabs-v2-tab-right', html: '<img src="/api/src/images/spacer.gif" width=2>'}, 'insertinto');
						
				newtab.unselectable = 'on';  

		//enable close button for all tabs but first one
		if($_VAR(options.closeTab, false)) {
			this._addClass(newtab.right, 'element-tabs-v2-tab-right-closebutton');
			this.AddEvent({type: 'click', obj: newtab.right, onfire: {obj: this.obj, fire: 'deletetab'}});
		}	
			
		this.AddEvent({type: 'click', obj: newtab, onfire: {obj: this.obj, fire: 'selecttab'}});		
		this.AddDOMEvent({type: 'mouseover', obj: newtab, onevent: this._mouseOverTab});	
		this.AddDOMEvent({type: 'mouseout', obj: newtab, onevent: this._mouseOutTab});		
		
		return newtab;
	},
	_getBlocks: function(){
		if(this.obj.content&&this.obj.content.blocks) return this.obj.content.blocks;
		else return new Array();
	},
	_getIndex: function(tab){
		return this.tabs.Search(tab);
	},
	_getContent: function(tab){		
		var index = this._getIndex(tab);
		if(index!=-1&&this._getBlocks()[index])
			return this._getBlocks()[index];
		return null;
	},
	_mouseOverTab: function(event, _target, tab) {
		if($WI.System.isNumeric(tab)) var tab = this.tabs[tab];	
		var h = this._getHeight(tab)

		this._setStyle(tab.left, 'backgroundPosition', 'left -' + this._fixPx(h));	
		this._setStyle(tab.center, 'backgroundPosition', 'center -' + this._fixPx(h));	
		this._setStyle(tab.right, 'backgroundPosition', 'right -' + this._fixPx(h));	
	},
	_mouseOutTab: function(event, _target, tab) {
		if($WI.System.isNumeric(tab)) var tab = this.tabs[tab];			
		this._setStyle(tab.left, 'backgroundPosition', 'left bottom');	
		this._setStyle(tab.center, 'backgroundPosition', 'center bottom');	
		this._setStyle(tab.right, 'backgroundPosition', 'right bottom');	
	},
	_selectTab: function(tab) {		
		if($WI.System.isNumeric(tab)) var tab = this.tabs[tab];		
		if(tab.disabled) return;
		this._unselectAllTabs();
		tab.selected = true;
		this._addClass(tab.left, 'element-tabs-v2-tab-left-selected');
		this._addClass(tab.right, 'element-tabs-v2-tab-right-selected');
		this._addClass(tab.center, 'element-tabs-v2-tab-center-selected');
		this._addClass(tab.label, 'element-tabs-v2-tab-text-selected');
		if(tab.label.image) this._addClass(tab.label.image, 'element-tabs-v2-tab-image-selected');			
		this._isVisible(this._getContent(tab), true);
		return tab;	
	},
	_unselectTab: function(tab){
		tab.selected = false;
		this._removeClass(tab.left, 'element-tabs-v2-tab-left-selected');
		this._removeClass(tab.right, 'element-tabs-v2-tab-right-selected');
		this._removeClass(tab.center, 'element-tabs-v2-tab-center-selected');
		this._removeClass(tab.label, 'element-tabs-v2-tab-text-selected');
		if(tab.label.image) this._removeClass(tab.label.image, 'element-tabs-v2-tab-image-selected');			
		this._isVisible(this._getContent(tab), false);
	},
	_unselectAllTabs: function(){
		for(var s=0;s<this.tabs.length;s++)
			this._unselectTab(this.tabs[s]);		
	},
	_tabEvent: function(event, _target, obj) {		
		_target = this._getParentByClassName(_target, 'element-tabs-v2-tab', true);
 		if(event.fire=='selecttab')
			this._selectTab(_target);
		else if(event.fire=='deletetab')
			this.DeleteTab(_target);	

	}			
});


