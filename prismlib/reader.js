/*********************************************************
*		Reader CLASS
*		Designed & developed by Dima Svirid, 2009	
*		Class: reader.js
*	  Extends: system.js viewer
*********************************************************/
$WI.Class.Reader = new $WI.Class({
	Create: function(options) {
		var screen = this._getClientWH();
		this.options = options;
		this.title = {};
		this.cookie = [];
	
		//set cookie
		if(options.cookie && $WI.Cookie.IsEnabled() && $WI.Cookie.Get(options.cookie)) {
			var _c = $WI.Cookie.Get(options.cookie).split(';');
			for(var i=0; i< _c.length; i++) {
				var _d = _c[i].split(',');
				this.cookie[_d[0]] = _d[1];
			}
		}	
		//init layout for the system
		this.title.layout = $WI.Check(this.cookie['layout'], 'reading');
		
		//init quality for the system
		this.title.quality = $WI.Check(this.cookie['quality'], '80');

		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-reader', width: this._fixPx(screen.w), height: this._fixPx(screen.h)});				
		this.obj.backgr = this._insertDOM(this.obj, {objType: 'img', objClass: 'element-reader-background', src: '/api/src/images/backgrounds/blue.jpg'}, 'insertinto');

		this.obj.viewer = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-reader-viewer'}, 'insertinto');
	 
	 	//HEADER
	 	this.obj.header = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-reader-header'}, 'insertinto');
		var header_socket = this._insertDOM(this.obj.header, {objType: 'table', objClass: 'element-reader-header-socket', cellPadding: 0, cellSpacing: 0}, 'insertinto');
		var logo = this._insertDOM(header_socket.tr, {objType: 'td', objClass: 'element-reader-header-logo'}, 'insertinto');
		this._insertDOM(logo, {objType: 'img', objClass: 'element-reader-header-logo png', src: '/api2.0/src/images/reader/header_logo.png'}, 'insertinto');
		
		var top_right = this._insertDOM(header_socket.tr, {objType: 'td'}, 'insertinto');
				
		top_right.table = this._insertDOM(top_right, {objType: 'table', cellPadding: 2, cellSpacing: 2, align: 'right'}, 'insertinto');
		
		//create previous page button
		var td = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');
		this._insertDOM(td, {newNode: this._createCursor({objClass: 'element-reader-top-cursor-previous', onClickEvent: this.PrevPage})}, 'insertinto');
		//create next page button
		var td = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');
		this._insertDOM(td, {newNode: this._createCursor({objClass: 'element-reader-top-cursor-next', onClickEvent: this.NextPage})}, 'insertinto');
		
		var td = this._insertDOM(top_right.table.tr, {objType: 'td', width: '10px'}, 'insertinto');
		
		//zoombox
		this.obj.zoombox = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');		
		
		//create search button
		//var td = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');
		//this._insertDOM(td, {newNode: this._createButton({value: 'Search', onClickEvent: this.Search})}, 'insertinto');
		
		//create options button
		var td = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');
		this.obj.header.options_button = this._createButton({value: 'Options', objClass: 'element-reader-top-button-menu', config: {paddingRight: '20px', fontWeight: 'bold'}});
		this._insertDOM(td, {newNode: this.obj.header.options_button}, 'insertinto');
		
		//create setup button
		var td = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');
		this.obj.header.setup_button = this._createButton({value: 'Setup', objClass: 'element-reader-top-button-menu', config: {paddingRight: '20px', fontWeight: 'bold'}});
		this._insertDOM(td, {newNode: this.obj.header.setup_button}, 'insertinto');
		
		
		
		this.obj.publications = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');		
		this.obj.publications.openned = [];
		this.obj.publications.current = null;
		this.obj.publications.controls = null;
		this.obj.publications.shortcut = null;
		
		//create minimize button
		var td = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');
		this._insertDOM(td, {newNode: this._createButton({objClass: 'element-reader-top-button-minimize', onClickEvent: this._onMinimizePublication})}, 'insertinto');
		
		//create close button
		var td = this._insertDOM(top_right.table.tr, {objType: 'td'}, 'insertinto');
		this._insertDOM(td, {newNode: this._createButton({objClass: 'element-reader-top-button-close', onClickEvent: this._onClosePublication})}, 'insertinto');
		
		//place for the zoom progress bar
		this.obj.header.progress_holder = this._insertDOM(top_right.table.tr, {objType: 'td', width: '70px'}, 'insertinto');
		
	 	//FOOTER
	 	this.obj.footer = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-reader-footer'}, 'insertinto');	
		//take setting from cookie an ddo action
		if($WI.Check(this.cookie['page_navigation'], 1) == 1)
			this._setStyle(this.obj.footer, 'bottom', '0px');
		
		//RIGHT VIEWER NAVIGATION BLOCK
		this.obj.navigation = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-reader-navigation'}, 'insertinto');	
		//take setting from cookie an ddo action
		if($WI.Check(this.cookie['zoom_slider'], 1) == 1)
			this._setStyle(this.obj.navigation, 'right', '0px');
			
		//create footer logo
		this._insertDOM(this.obj, {objType: 'img', src: '/api2.0/src/images/reader/footer_logo.png', objClass: 'element-reader-footer-logo png'}, 'insertinto');		
	
		this._cancelSelect(this.obj);		
			
		//register main events
		this.AddEvent({obj: this, type: 'resizeapp', onevent: this._ajustDivs});
		//this.AddEvent({obj: window, type: 'resize',  onevent: {obj: this.obj, fire: 'resizeinterface'}});		
		//this.AddEvent({obj: this.obj, type: 'selectpublication', onevent: this.LoadPublication});		
	},
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
		
		this.Fire(null, 'resizeapp', this);
		
		//create menu object
		this.obj.header.menu = new $WI.Class.Menu;
		this.obj.header.menu.Create();	
		this.obj.header.menu.Write();
		this._addClass(this.obj.header.menu.GetBody(), 'element-reader-menu');
	},
	AddPage: function(controls, options) {		
		var page = this._insertDOM(controls.main.pages_scroll, {objType: 'div', objClass: 'element-reader-footer-page'}, 'insertinto');
		
		if(this.title.layout=='reading' && options.single != 1) {
			this._addClass(page, 'element-reader-footer-pagedouble');
			page.innerHTML = '<table width="100%" cellspacing=0 cellpadding=0><tr><td style="width:50%;height:100%;text-align:center;">' + options.pageNumber + '</td><td style="text-align:center;">' + parseInt(options.pageNumber+1) + '</td></tr></table>';
		} else {
			page.innerHTML = options.pageNumber;
		}
		var _left = this._getWidth(controls.main.pages_scroll);
		var w_page = this._getWidth(page);
		page.options = options;		
		page.options.pageLeft = _left;			

		this._setStyle(controls.main.pages_scroll, 'width', this._fixPx(_left + w_page + 5));
		this.AddEvent({obj: page, type: 'click', onevent: this._onPageMouseEvent});
		this.AddEvent({obj: page, type: 'mouseover', onevent: this._onPageMouseEvent});
		this.AddEvent({obj: page, type: 'mouseout', onevent: this._onPageMouseEvent});
	},
	LoadPage: function(pageNumber, publicationId) {				
		if(this.page_loading) return;
		
		this._hideCurrentViewer();	

		if(!publicationId) var publicationId = this.obj.publications.current;
		var publication = this.GetPublication(publicationId);
	
		if(!pageNumber) {
			if(publication.current)
				var pageNumber = publication.current;
			else
				var pageNumber = 1;
		}		

		//prevent overlimit of pages
		if(!$WI.IsNumeric(pageNumber) || pageNumber <= 0 || pageNumber > publication.data.length)
			return;
		
		//set current page
		publication.current = pageNumber;		
		
		var showpages = 1;
		var showinrow = 1;
		switch (this.title.layout) {
			case 'reading': 
				showinrow = 2;
				if(publication.data[pageNumber-1].getNode('./single').getNodeValue()==1) showpages = 1;
				else showpages = 2;
			break;
			case 'all_pages': 
				showinrow = 10;
				showpages = publication.data.length;	
			break;		
			case 'print': 
				showpages = publication.data.length;	
				showinrow = 1;			
			break;				
		}
		
		//show hidden page			
		if(publication.pages[pageNumber]) {
			var viewer = publication.pages[pageNumber];
			this.Fire(null, 'show', viewer);
		} else {
			//init a new viewer
			this.page_loading = true;

			var viewer = new $WI.Class.Viewer;	
			viewer.Create({zoom: 1, server: this.options.server, maxInRow: showinrow, scrollable: (this.title.layout=='print')?true:false, quality: this.title.quality});		
			
			for(var p=0;p<showpages;p++) {
				viewer.SetImage(publication.data[pageNumber-1+p].getNode('./path').getNodeValue());
				//if(publication.data[pageNumber-1+p].markers)
				//{	
					//var markers = this.xml.List('markers');
					//for(var m=0;m<markers.length;m++)
						//viewer.SetMarker(pageNumber, markers[m]);
				//}
			}
			viewer.Write(this.obj.viewer);	
			
			//this.AddEvent({obj: viewer, type: 'show', onevent: {obj: this.obj, fire: 'resizeinterface'}});
			//assign right navigator be always on the top
			this.AddEvent({obj: viewer, type: 'show', onevent: function(){
				viewer.dragdrop.AlwaysOnTop([this.obj.navigation, viewer.obj])
				//viewer.dragdrop.AlwaysOnTop([this.obj.navigation, viewer.obj, this.obj.navigation_window.GetBody()])
			}});		
			//set status
			this.AddEvent({obj: viewer, type: 'show', onevent: function(){
				this.page_loading = false;
				this._ajustDivs();
			}});		
			//fill zoom box if any
			this.AddEvent({obj: viewer, type: 'show', onevent: function(){
				this._loadZoomBox(viewer)
			}});	
			//update selectbox when zoomed
			this.AddEvent({obj: viewer, type: 'zoom', onevent: function(){
				this._setZoomBox(viewer)
			}});	
			
			//move progress bar from the viewer to the header
			this.obj.header.progress_holder.appendChild(viewer.GetBody().preloader);
			//move zoom navigation from the viewer to the reader right navigation bar					
			this.AddEvent({obj: viewer, type: 'show', onevent: function(){
				this.obj.navigation.appendChild(viewer.GetBody().navigation)
			}});
	
			publication.pages[pageNumber] = viewer;			
		}				
		
		//populate controls page number
		publication.controls.pageField.GetBody().value = pageNumber;
		
		//mark page
		var _children = this._getChildren(publication.controls.main.pages_scroll);
		for(var i=1; i<=_children.length; i++) {
			this._removeClass(_children[i-1], 'element-reader-footer-page-select');
			this._removeClass(_children[i-1], 'element-reader-footer-pagedouble-select');
			if(_children[i-1].options.pageNumber==pageNumber) {
					this._addClass(_children[i-1], (this.title.layout == 'reading')?'element-reader-footer-pagedouble-select':'element-reader-footer-page-select');
			}
		}		
		
		this._maxZ(viewer.obj);
		
		return viewer;		
	},
	ClosePublication: function (publicationId) {
		if(!publicationId) var publicationId = this.obj.publications.current;
		//kill viewers
		var publication = this.GetPublication(publicationId);
		for(var i in publication.pages)		
			this.Fire(null, 'close', publication.pages[i]);			
		
		//remove controls
		this._removeDOM(publication.controls);
		//empty arrays
		delete this.obj.publications.openned['PUBLICATION_' + publicationId];
		this.obj.publications.current = null;		
	},
	SetTitleLogo: function(src) {
		this.title.logo = this._insertDOM(this.obj, {objType: 'img', objClass: 'element-reader-title-logo', src: src}, 'insertinto');		
		//take setting from cookie an do action
		if($WI.Check(this.cookie['title_logo'], 1) == 0)
			this._isDisplay(this.title.logo, false);		
	},
	SetOtherPublication: function(options) {
		if(!this.obj.publications.list) {
			this.obj.publications.list = new $WI.Class.Selectbox;
			this.obj.publications.list.Create({width: '250px', rowHeight: '75px', multiple: false});				
			this.obj.publications.list.Write(this.obj.publications);	
			this._addClass(this.obj.publications.list.GetDropDown(), 'element-reader-selectbox-dropdown');
			this.AddEvent({type: 'selectoption', obj: this.obj.publications.list, onevent: function(){				
					this.LoadPublication(this.obj.publications.list.GetValue());
			}});
		}
		this.obj.publications.list.AddOption(options);			
	},		
	ZoomBox: function() {
		this.obj.zoombox.cls = new $WI.Class.Selectbox;
		this.obj.zoombox.cls.Create({width: '60px', multiple: false});				
		this.obj.zoombox.cls.Write(this.obj.zoombox);			
		this._addClass(this.obj.zoombox.cls.GetDropDown(), 'element-reader-selectbox-dropdown');				
	},	
	LoadPublication: function(data) {
		if(this.publication_loading) return;
		this.publication_loading = true;
		if(!data) //not passed simply reload publication
			this._loadPublication(this.obj.publications.current);
		else if(typeof data == 'object') //passed xml
			this._loadPublication(data);
		else { //passed as an id or did not passed at all (take from the select box)			
			if(!$WI.IsNumeric(data)) 
				var data = this.obj.publications.list.GetValue();
			
			this.Rpc().RpcAppend({namespace: 'wi.prism.applications.MagazineReader', method: 'GetPages'},
													 {ci_id: data})							
							  .RpcOnComplete(this._loadPublication)
							  .RpcCall(this)														 
							  ;	
		}		
	},
	ContextMenu: function() {
		this.obj.contextmenu = new $WI.Class.Menu;
		this.obj.contextmenu.Create();	
		this.obj.contextmenu.Write();
		this._addClass(this.obj.contextmenu.GetBody(), 'element-reader-menu');
		
		var menu_block = this.obj.contextmenu.AddMenu();						
		
		this.obj.contextmenu.AddItem({
											parent: menu_block,
											title: 'Zoom In <font class="element-reader-viewer-menu-help">(Dbl Click)</font>',
											onclick: function(){this._callZoomIn()}.Apply(this),
											icon: '/prism_resource/images/icons16x16/zoom_in_white.png'
											});
		this.obj.contextmenu.AddItem({
											parent: menu_block,
											title: 'Zoom Out <font class="element-reader-viewer-menu-help">(Hold Ctrl + Dbl Click)</font>',
											onclick: function(){this._callZoomOut()}.Apply(this),
											icon: '/prism_resource/images/icons16x16/zoom_out_white.png'
											});		
		this.obj.contextmenu.AddItem({parent: menu_block});
		this.obj.contextmenu.AddItem({
											parent: menu_block,
											title: 'About Turnit.ca',
											onclick: function(){this.PopUp('http://www.turnit.ca', 'Turnit.ca', 'status=1,toolbar=1,location=1,menubar=1,directories=1,resizable=1,scrollbars,top=0,left=0')}.Apply(this),
											icon: '/prism_resource/images/icons16x16/webimpact.png'
											});		
		this.AddEvent({obj: document, type: 'contextmenu', onevent: {fire: 'showmenu', obj: this.obj.contextmenu}});
	},
	OptionsMenu: function() {		
		var menu_block = this.obj.header.menu.AddMenu({button: this.obj.header.options_button});						
		
		this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Link To Page',
											onclick: function(){this._sendToFriend()}.Apply(this),
											icon: '/api2.0/src/images/reader/icon_send_to_friend.png'
											});
		this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Send To Friend',
											onclick: function(){this._sendToFriend()}.Apply(this),
											icon: '/api2.0/src/images/reader/icon_send_to_friend.png'
											});	
		
		this._isDisplay(this.obj.header.options_button.parentNode, true);
	},
	SetupMenu: function() {		
		var menu_block = this.obj.header.menu.AddMenu({button: this.obj.header.setup_button});						
		//Layout submenu
		var submenu_block = this.obj.header.menu.AddMenu();
		var layout1 = this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Reading Layout',
											type: 'radio',
											value: 'reading',
											status: (this.title.layout == 'reading')?true:false,
											onchange: function(){this._onLayoutChange(layout1)}.Apply(this)
											});	
		var layout2 = this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Single Page Layout',
											type: 'radio',
											value: 'single',
											status: (this.title.layout == 'single')?true:false,
											onchange: function(){this._onLayoutChange(layout2)}.Apply(this)
											});
		var layout3 = this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Print Layout',
											type: 'radio',
											value: 'print',
											status: (this.title.layout == 'print')?true:false,
											onchange: function(){this._onLayoutChange(layout3)}.Apply(this)
											});		
		var layout4 = this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'All Pages Layout',
											type: 'radio',
											value: 'all_pages',
											status: (this.title.layout == 'all_pages')?true:false,
											onchange: function(){this._onLayoutChange(layout4)}.Apply(this)
											});		
		this.obj.header.menu.SetGroup(layout1, layout2, layout3, layout4);		
		this.obj.header.menu.AddItem({parent: menu_block});
		
		var qlt_item = this.obj.header.menu.AddItem({
											parent: menu_block, 
											title: 'Quality', 
											icon: '/api2.0/src/images/reader/icon_quality.png'
											});

		var quality_block = this.obj.header.menu.AddMenu();
		
		var _group = [];
		for(var i=10;i<=100;i=i+10) {			
			var qlt = this.obj.header.menu.AddItem({
												parent: quality_block,
												title: i + '%',
												type: 'radio',
												value: i,
												status: (this.title.quality == i)?true:false,
												onchange: function(){this._onQualityChange(qlt)}.Apply(this)
												});		
			_group.push(qlt);
		}

		this.obj.header.menu.SetGroup.apply(this, _group);	
				
		qlt_item.AddSubMenu(quality_block);							

		this.obj.header.menu.AddItem({parent: menu_block});
		//Controls submenu
		var control1 = this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Page Navigation Bar',
											type: 'checkbox',
											value: 'page_navigation',
											status: parseInt($WI.Check(this.cookie['page_navigation'], 1)),
											onchange: function(){this._onControlsChange(control1)}.Apply(this)
											});	
		//this.AddEvent({obj: control1, type: 'enable', onevent: this._onControlsChange});
		var control2 = this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Zoom Slider',
											type: 'checkbox',
											value: 'zoom_slider',
											status: parseInt($WI.Check(this.cookie['zoom_slider'], 1)),
											onchange: function(){this._onControlsChange(control2)}.Apply(this)
											});
		var control3 = this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Title Logotype',
											type: 'checkbox',
											value: 'title_logo',
											status: parseInt($WI.Check(this.cookie['title_logo'], 1)),
											onchange: function(){this._onControlsChange(control3)}.Apply(this)
											});
		var control4 = this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Hot-Spot Markers',
											type: 'checkbox',
											value: 'markers',
											status: parseInt($WI.Check(this.cookie['markers'], 1)),
											onchange: function(){this._onControlsChange(control4)}.Apply(this)
											});									
		/*
		this.obj.header.menu.AddItem({parent: menu_block});
		this.obj.header.menu.AddItem({
											parent: menu_block,
											title: 'Switch to Flash Version',
											onclick: function(){this.GoFlash()}.Apply(this),
											icon: '/prism_resource/images/icons16x16/webimpact.png'
											});		
		*/
		this._isDisplay(this.obj.header.setup_button.parentNode, true);
	},
	Search: function() {
		this.search_block = this._insertDOM(null, {objType: 'div', objClass: 'element-reader-search'}, 'insertinto');	
			
		var resize = $WI.Resize(this.search_block, {resizeY: false});
		
		resize.UseProxy({borderRight: '7px solid #cccccc'});
		resize.AddEvent({obj: this.search_block, type: 'drop', onevent: function(){this.Fire(null, 'resizeinterface', this.obj)}});

		//this.search = new $WI.Class.ReaderSearch;
		//this.search.Create();
		//this.search.Write(this.search_block);
		
		this.Fire(null, 'resizeinterface', this.obj);
	},
	GetPublication: function(publicationId) {
		if(!publicationId) var publicationId = this.obj.publications.current;
		if(this.obj.publications.openned['PUBLICATION_' + publicationId])
			return this.obj.publications.openned['PUBLICATION_' + publicationId];
		else 
			return null;
	},
	GetViewer: function(pageNumber, publicationId) {
		var publication = this.GetPublication(publicationId)
		if(!publication) return null;		
		if(!pageNumber) var pageNumber = publication.current;
		return publication.pages[pageNumber];
	},
	ToPage: function(pageNumber){
		var publication = this.GetPublication();	
		if(pageNumber === 0) pageNumber = 1; 
		if(pageNumber === false) var pageNumber = publication.controls.pageField.GetBody().value;		
		this.LoadPage(pageNumber);
	},
	NextPage: function(){
		var publication = this.GetPublication();	
		var incr = 1;
		if(this.title.layout=='reading' && publication.data[parseInt(publication.current)-1].single!=1) var incr = 2;
		this.ToPage((parseInt(publication.current) + incr));
	},
	PrevPage: function(){
		var publication = this.GetPublication();	
		var decr = 1;
		if(this.title.layout=='reading' && publication.data[parseInt(publication.current)-1].single!=1) var decr = 2;
		this.ToPage((parseInt(publication.current) - decr));
	},
	MoveTo: function(options){
		var publication = this.GetPublication();	
		var viewer = publication.pages[publication.current];
	},
	_loadPublication: function(xml, text){
		if($WI.IsNumeric(xml)) var id = xml;		
		else {
			var response = this.RpcResponse(xml);
			if(!response)	return;
			var xml = response['GetPages'];
			var id = xml.getNode("/publication/publication_id").getNodeValue();	
		}

		if(this.obj.publications.current == id) return;
		
		var _id = 'PUBLICATION_' + id;
		
		//call select box
		if(this.obj.publications.list)
			this.obj.publications.list.SelectOption(id);	
		
		//minimize current openned 
		this._onMinimizePublication();		
		
		//set current publication id
		if(id)
			this.obj.publications.current = id;				

		//title never been openned		
		if(!this.obj.publications.openned[_id]) {
			var _data = xml.getNodes('/publication/pages/page');
			this.obj.publications.openned[_id] = {pages: {}, current: null, controls: this._createFooterNavigation(_data), data: _data};
			
		} else
			this._isDisplay(this.GetPublication(id).controls, true);
		
		this._isDisplay(this.obj.navigation, true);
		
		//init navigation window
		var data = this.GetPublication(id).data;
		
		//this.obj.navigation_window = new $WI.Class.ReaderNavigationWindow;
		//this.obj.navigation_window.Create({});
		//this.obj.navigation_window.Write(this.obj.viewer);		
		//for(var i=0;i<data.length;i++)
			//this.obj.navigation_window.SetPage({src: 'http://turnit.prismx.net/fastcgi/iipsrv.fcgi?FIF=' + data[i].url + '&WID=200&SDS=0,90&CNT=1.0&CVT=jpeg'});
				
		this.LoadPage(null, id);
		this.publication_loading = false;
	},
	_ajustDivs: function() {
		if(this.obj.parentNode.tagName.toLowerCase() == 'body')
			var screen = this._getClientWH();	
		else
			var screen = {w: this._getWidth(this.obj.parentNode), h: this._getHeight(this.obj.parentNode)};	
						
		var publication = this.GetPublication();
		var viewer = this.GetViewer();
		
		var w_diff = 0;		
		var l_diff = 0;		
		
		var h_header = this._getHeight(this.obj.header);			
		var h_footer_slider = 0;
		
		
		//if page navigation is hidden resize properly viewer
		var _footer_diff = 0;
		var b_footer = this._getStyleInt(this.obj.footer, 'bottom');
		var h_footer = this._getHeight(this.obj.footer);
		if(b_footer == 0 && this.title.layout=='print') var _footer_diff = h_footer;
			
		
		if(this.search_block && this._display(this.search_block)) {
			w_diff = this._getWidth(this.search_block);
			l_diff = w_diff;
		}
		
		var w_obj = screen.w - w_diff; 
		
		this._applyConfig(this.obj, {width: this._fixPx(w_obj), height: this._fixPx(screen.h), left: this._fixPx(l_diff)});		
		this._applyConfig(this.obj.viewer, {top: this._fixPx(h_header), height: this._fixPx(screen.h-h_footer_slider-h_header-_footer_diff)});
		//$WI.trace(this._getHeight(this.obj.viewer))
		//ajust right navigation layer
		this._applyConfig(this.obj.navigation, {height: this._fixPx(this._getHeight(this.obj.viewer))});			
		
		//ajust footer page navigation		
		if(viewer) {
			//ajust main control layer
			var _new_w = w_obj - this._getWidth(viewer.obj.navigation) - this._getStyleInt(this.obj.navigation, 'right');
			if(this.obj.navigation_window && this._display(this.obj.navigation_window.GetBody()))
				_new_w -= this._getWidth(this.obj.navigation_window.GetBody()) + 10;			
			
			this._applyConfig(publication.controls.main, {width: this._fixPx(_new_w)});	
			//ajust pages slider
			this._applyConfig(publication.controls.main.slider_place, {width: this._fixPx(w_obj-230)});				
			this._applyConfig(publication.controls.main.pages, {width: this._fixPx(w_obj-230)});
			this._applyConfig(publication.controls.main.slider.obj.slider_route, {width: this._fixPx(w_obj-230)});
		}

	},
	_createButton: function(options) {
		var _button = this._createDOM({objType: 'div', objClass: 'element-reader-top-button', html: (options.value)?options.value:null, config: (options.config)?options.config:null});	
		if(options.objClass) this._addClass(_button, options.objClass);
		this.AddEvent({obj: _button, type: 'mouseover', onevent: this._onTopButtonMouseEvent});
		this.AddEvent({obj: _button, type: 'mouseout', onevent: this._onTopButtonMouseEvent});		
		if(options.onClickEvent) this.AddEvent({obj: _button, type: 'click', onevent: options.onClickEvent});
		return _button;
	},	
	_createCursor: function(options) {
		var _button = this._createDOM({objType: 'div', objClass: 'element-reader-top-cursor', config: (options.config)?options.config:null});	
		if(options.objClass) this._addClass(_button, options.objClass);
		//this.AddEvent({obj: _button, type: 'mouseover', onevent: this._onTopButtonMouseEvent});
		//this.AddEvent({obj: _button, type: 'mouseout', onevent: this._onTopButtonMouseEvent});		
		if(options.onClickEvent) this.AddEvent({obj: _button, type: 'click', onevent: options.onClickEvent});
		return _button;
	},	
	_onLayoutChange: function(obj) {		
		this.title.layout = obj.GetChecked().value;				
		var __current = this.obj.publications.current;	
		this.ClosePublication();		
		this.LoadPublication(__current);		
		this._updateCookie('layout', this.title.layout);
		this.Fire(null, 'changelayout', this);
	},
	_onQualityChange: function(obj) {		
		this.title.quality = obj.GetChecked().value;		
		var __current = this.obj.publications.current;		
		this.ClosePublication();		
		this.LoadPublication(__current);		
		this._updateCookie('quality', this.title.quality);
		this.Fire(null, 'changequality', this);
	},
	_onControlsChange: function(obj) {		
		switch(obj.value)	{
			case 'page_navigation':
				var h = -this._getHeight(this.obj.footer);						
				var _effect = new $WI.Animation({tweening: 'strongOut', obj: this.obj.footer, style: 'bottom', from: (obj.checked)?h:0, to: (obj.checked)?0:h, speed: 20});	
				//_effect.onAnimationFinishedEffect = function() {
					//_effect._construct.Fire(null, 'resizeinterface', _effect._construct.obj);
				//};	
			break;	
			case 'title_logo':				
				this._isDisplay(this.title.logo, obj.checked);
			break;	
			case 'zoom_slider':				
				var w = -this._getWidth(this.obj.navigation);						
				var _effect = new $WI.Animation({tweening: 'strongOut', obj: this.obj.navigation, style: 'right', from: (obj.checked)?w:0, to: (obj.checked)?0:w, speed: 20});
				//_effect.onAnimationFinishedEffect = function() {
					//_effect._construct.Fire(null, 'resizeinterface', _effect._construct.obj);
				//};		
			break;		
		}
		this._updateCookie(obj.value, (obj.checked)?1:0);
	},
	_onMinimizePublication: function(event, _target, obj){
		
		if(this.GetPublication()) {		
			//this.obj.publications.list.UnSelectAll();			
			var publication = this.GetPublication();

			//hide current viewer
			this._hideCurrentViewer();	
			
			//hide controls
			this._isDisplay(publication.controls, false);
			
			//hide navigation
			this._isDisplay(this.obj.navigation, false);
			
			//get proper image from the viewer
			/*
			var __icon = this.GetViewer().GetImages()[0].src;
		
			var icon = new $WI.Class.Element;
			icon.Icon({label: 'Lifestyle<br>[Page: ' + publication.current + ']', icon: 'http://turnit.prismx.net/fastcgi/iipsrv.fcgi?FIF=' + __icon + '&WID=70&SDS=0,90&CNT=1.0&CVT=jpeg', top: (this.obj.publications.current==1000)?'100px':(this.obj.publications.current==2000)?'220px':'340px', left: '20px'});
			this._setStyle(icon.GetBody(), 'opacity', 0);
			icon.DragDrop({limits: {left: 0, right: this._calculateShortcutDragLimit, top: 0, bottom: this._calculateShortcutDragLimit}});
			icon.Write(this.obj.viewer);
			icon.publicationId = this.obj.publications.current;
			icon.OnDblClickEvent(function(){this._onMaximizePublication(icon)}.Apply(this));
			//create an effect
			//var _effect = this._Animation({effect: 'MoveProxy', from: this.obj, to: icon.GetBody(), speed: 10, objClass: 'element-reader-proxy-effect'});	
			//_effect.onAnimationFinishedEffect = function() {
				//	_effect._construct._Animation({effect: 'AlphaIn', obj: icon.GetBody()});	
				//	_effect._construct.RemoveDOM(_effect._target);
			//}	
					
			publication.shortcut = icon;	*/			
			this.obj.publications.current = null;		
		}
	},
	_onMaximizePublication: function(obj){
		var publication = this.GetPublication(obj.publicationId);
		
		//show viewer
		this._loadPublication(obj.publicationId);				

		//remove shortcut
		this._removeDOM(obj.GetBody());		
		publication.shortcut = null;
	},
	_onClosePublication: function(event, _target, obj){
		this.ClosePublication();
		this.obj.publications.list.UnSelectAll();		
	},
	_hideCurrentViewer: function() {
		//hide current viewer		
		if(this.obj.publications.current) {
			var _current = this.GetPublication();
			if(_current && _current.current)
				this.Fire(null, 'hide', _current.pages[_current.current]);
		}		
	},
	_createFooterNavigation: function(data) {
		var controls = this._insertDOM(this.obj.footer, {objType: 'div'}, 'insertinto');		
		controls.main = this._insertDOM(controls, {objType: 'div', objClass: 'element-reader-footer-controls'}, 'insertinto');		
		controls.main.pages = this._insertDOM(controls.main, {objType: 'div', objClass: 'element-reader-footer-pages'}, 'insertinto');		
		controls.main.pages_scroll = this._insertDOM(controls.main.pages, {objType: 'div', objClass: 'element-reader-footer-pages-scroll'}, 'insertinto');
		controls.main.slider_place = this._insertDOM(controls, {objType: 'div', objClass: 'element-reader-footer-slider'}, 'insertinto');

		controls.pageField = new $WI.Class.FormField;
		controls.pageField.Create({type: 'text'});					
		controls.pageField.Write(controls);	
		controls.pageField.OnSubmitEvent(function(){this.ToPage()}.Apply(this));
		//create a title for this field
		this._insertDOM(controls, {objType: 'img', src: '/api2.0/src/images/reader/footer_page_number.png', objClass: 'element-reader-footer-page-number png'}, 'insertinto');		
		
		this._insertDOM(controls, {newNode: this._createButton({objClass: 'element-reader-footer-button element-reader-footer-button-previous', onClickEvent: this.PrevPage})}, 'insertinto');

		this._insertDOM(controls, {newNode: this._createButton({objClass: 'element-reader-footer-button element-reader-footer-button-next', onClickEvent: this.NextPage})}, 'insertinto');
		
		//create pages
		for(var i=1;i<=data.length;i++) {
			var __single = data[i-1].getNode('./single').getNodeValue();
			var __url = data[i-1].getNode('./path').getNodeValue();
			if(data[i]) var _url2 = (this.title.layout=='reading'&&__single!= 1)?data[i].getNode('./path').getNodeValue():null;
			this.AddPage(controls, {pageNumber: i, single: __single, url: __url, url2: _url2});
			if(this.title.layout == 'reading' && __single != 1) ++i;
		}
		//create slider					
		controls.main.slider = new $WI.Class.Slider;	
		controls.main.slider.Create({cursor: '/api2.0/src/images/reader/slider_cursor.png', scroll: 'x'});
		controls.main.slider.Write(controls.main.slider_place);
		this.AddEvent({type: 'drag', obj: controls.main.slider.GetScrollObj(), onevent: this._onPageScroll});
		this.AddEvent({type: 'drop', obj: controls.main.slider.GetScrollObj(), onevent: this._onPageSelect});
		
		return controls;
	},
	_onPagePreview: function(event, _target, obj) {	
		var _distance = 10;
		this.obj.footer.page_preview = this._insertDOM(this.obj.footer, {objType: 'div', objClass: 'element-reader-footer-page-preview'}, 'insertinto');	
		this._insertDOM(this.obj.footer.page_preview, {objType: 'img', objClass: 'element-reader-footer-page-shadow png', src: '/api2.0/src/images/reader/marker_tooltip_shadow.png'}, 'insertfirst');
		var pbody = this._insertDOM(this.obj.footer.page_preview, {objType: 'div', objClass: 'element-reader-footer-page-preview-body'}, 'insertinto');	
		this._insertDOM(this.obj.footer.page_preview, {objType: 'div', objClass: 'element-reader-footer-page-preview-connector'}, 'insertinto');
		this.obj.footer.page_preview.image = this._insertDOM(pbody, {objType: 'img', objClass: 'element-reader-footer-page-preview-image'}, 'insertinto');		
					
		if(this.title.layout == 'reading' && obj.options.single != 1) {				
			_distance = 19;
			this._addClass(this.obj.footer.page_preview, 'element-reader-footer-page-preview-double');
			this.obj.footer.page_preview.image2 = this._insertDOM(pbody, {objType: 'img', objClass: 'element-reader-footer-page-preview-image'}, 'insertinto');	
		}					
		
		this.AddEvent({obj: this.obj.footer.page_preview, type: 'mouseout', onevent: function(){this._onPageMouseEvent({type: 'mouseout'}, _target, obj)}});	

		var mouseXY = this._getXY(obj);
		var w = this._getWidth(this.obj.footer.page_preview);
		this._applyConfig(this.obj.footer.page_preview, {left: this._fixPx(mouseXY.x-w/2+_distance)});
		
		//this.obj.footer.page_preview.image.src = 'http://turnit.prismx.net/fastcgi/iipsrv.fcgi?FIF=' + obj.options.url + '&WID=110&SDS=0,90&CNT=1.0&CVT=jpeg';	
		this.obj.footer.page_preview.image.src = 'http://www.turnit.ca/fastcgi/iipsrv.fcgi?FIF=' + obj.options.url + '&WID=110&SDS=0,90&CNT=1.0&CVT=jpeg';	

		//if(obj.options.url2) this.obj.footer.page_preview.image2.src = 'http://turnit.prismx.net/fastcgi/iipsrv.fcgi?FIF=' + obj.options.url2 + '&WID=110&SDS=0,90&CNT=1.0&CVT=jpeg';
		if(obj.options.url2) this.obj.footer.page_preview.image2.src = 'http://www.turnit.ca/fastcgi/iipsrv.fcgi?FIF=' + obj.options.url2 + '&WID=110&SDS=0,90&CNT=1.0&CVT=jpeg';
		
		this.on_page_preview_timeout = setTimeout(function(){this._onPageMouseEvent({type: 'mouseout'}, _target, obj)}.Apply(this), 5000);	
	},
	_getPageNumber: function(pageNumber) {
		if(parseInt(pageNumber) < 10) return '0' + pageNumber;
		else  return pageNumber;
	},
	_onPageScroll: function(event, _target, obj) {
		var publication = this.GetPublication();
		publication.controls.main.slider.ScrollObj(publication.controls.main.pages_scroll);
	},
	_onPageSelect: function(event, _target, obj) {
		var publication = this.GetPublication();
		var wc = this._getWidth(publication.controls.main.slider.GetScrollObj());
		var w = this._getWidth(publication.controls.main.pages_scroll);
		var ws = this._getWidth(publication.controls.main.slider_place);			
		var period = w/ws;		
		
		var c_left = this._getStyleInt(publication.controls.main.pages_scroll, 'left');
		
		if(obj && obj.options.pageNumber) {
			var w_page =  this._getWidth(obj);
			var xy =  this._getXY(obj, true);
		} else {					
			var _children = this._getChildren(publication.controls.main.pages_scroll);
			var _selected = null;			
			var point = publication.controls.main.slider.GetPoint();			
			
			//alert(point*period + '|' + ws + '|' + period)	
			for(var i=0; i<_children.length; i++) {
				if(Math.ceil(period*point) < _children[i].options.pageLeft) {
					var obj = _children[i];	
					break;
				} 
			}		
		}
		if(obj && obj.options.pageLeft) {			
			//$WI.trace(obj.options.pageLeft + '|' + xy.x + '|' + period + '|' + c_left);
			
			new $WI.Animation({tweening: 'strongOut', obj: publication.controls.main.slider.GetScrollObj(), style: 'left', from: 0, to: Math.ceil(xy.x + c_left), speed: 20});	

			//this._Animation({effect: 'SlideOut', obj: publication.controls.main.slider.GetScrollObj(), style: 'left', to: Math.ceil(obj.options.pageLeft/period - wc/2 + 23), speed: 20});	
			if(obj.options.pageNumber) this.LoadPage(obj.options.pageNumber);
		}
	},	
	_calculateShortcutDragLimit: function(_target, type) {
		var _desktop = this._getParentByClassName(_target, 'element-reader-viewer');
		if(type=='right'){
			var w = this._getWidth(_target);
			var wt = this._getWidth(_desktop);
			return parseInt(wt-w-20);
		} else if(type=='bottom'){			
			var h = this._getHeight(_target);
			var ht = this._getHeight(_desktop);
			return parseInt(ht-h-20);
		} 
	},
	_onTopButtonMouseEvent: function(event, _target, obj) {
		if(event.type == 'mouseover') {
			this._addClass(obj, 'element-reader-top-button-mouseover');
		} else if(event.type == 'mouseout') {
			this._removeClass(obj, 'element-reader-top-button-mouseover');
		}		
	},
	_onPageMouseEvent: function(event, _target, obj) {		
		if(event.type == 'mouseover') {
			if(this.title.layout=='reading') this._addClass(obj, 'element-reader-footer-pagedouble-mouseover');	
			else this._addClass(obj, 'element-reader-footer-page-mouseover');			
			if(this.on_page_preview_timeout) clearTimeout(this.on_page_preview_timeout);
			this.on_page_preview_timeout = setTimeout(function(){this._onPagePreview(event, _target, obj)}.Apply(this), 500);			
		} else if(event.type == 'mouseout') {
			if(this.on_page_preview_timeout) clearTimeout(this.on_page_preview_timeout);
			this._removeClass(obj, 'element-reader-footer-page-mouseover');	
			this._removeClass(obj, 'element-reader-footer-pagedouble-mouseover');	
			//this.obj.footer.page_preview.image.src = '/api/src/images/spacer.gif';			
			//this._isDisplay(this.obj.footer.page_preview, false);			
			this._removeDOM(this.obj.footer.page_preview);
		} else if(event.type == 'click') {
			if(this.on_page_preview_timeout) clearTimeout(this.on_page_preview_timeout);
			//this._isDisplay(this.obj.footer.page_preview, false);			
			this._removeDOM(this.obj.footer.page_preview);
			this._onPageSelect(event, _target, obj);
		}
	},
	_callZoomIn: function(event, _target, obj) {
		var viewer = this.GetViewer();
		viewer._zoomIn();
	},	
	_callZoomOut: function(event, _target, obj) {
		var viewer = this.GetViewer();
		viewer._zoomOut();
	},
	_updateCookie: function(_name, _value) {
		if(this.options.cookie && $WI.Cookie.IsEnabled()) {
			this.cookie[_name] = _value;			
			var __newval = '';
			for (var i in this.cookie)	
				if((/function/i).test(this.cookie[i]) == false)		
					__newval += i + ',' + this.cookie[i] + ';';
			$WI.Cookie.Set(this.options.cookie, __newval);
		}			
	},
	_loadZoomBox: function(obj) {
		//cleanup the box first
		this.obj.zoombox.cls.RemoveAll();
		for(var i=obj.entry_data.resolution;i>0;i--)
			this.obj.zoombox.cls.AddOption({text: Math.ceil(100/2/(i)) + '%', value: parseInt(obj.entry_data.resolution-i)});
		
		for(var i=obj.entry_data.resolution;i<obj.top_resolution;i++)
			this.obj.zoombox.cls.AddOption({text: ((i-obj.entry_data.resolution+1)*100) + '%', value: i});

		this.obj.zoombox.cls.SelectOption(obj.resolution);
		//
		this.AddEvent({type: 'selectoption', obj: this.obj.zoombox.cls, onevent: function(){obj.zoom_level=this.obj.zoombox.cls.GetValue();obj.zoom()}});
	},
	_setZoomBox: function(obj) {
		this.obj.zoombox.cls.SelectOption(obj.resolution);
	},
	_sendToFriend: function() {		
		var _win = new $WI.Class.Window;
				_win.Create({label: 'Send To Friend', icon: '/api2.0/src/images/reader/icon_send_to_friend.png', shadow: true, width: '400px', height: '350px', scrollY: 'auto', windowType: 'dialog'});
				_win.Write();
				
				var t = this._createDOM({objType: 'table', cellSpacing: '10px', cellPadding: '0px'});
				
				//create first row				
				var td = this._insertDOM(t.tr, {objType: 'td', width: '100px', html: 'Friend\'s name:'}, 'insertinto');				
				var td = this._insertDOM(t.tr, {objType: 'td'}, 'insertinto');	
				
				this.username = new $WI.Class.Element;
				this.username.FormField({type: 'text', width: '180px'});			
				this.username.Write(td);
				this.username.OnSubmitEvent(function(){}.Apply(this));		
				
				//create second row
				var tr = this._insertDOM(t.tbody, {objType: 'tr'}, 'insertinto');
				var td = this._insertDOM(tr, {objType: 'td', html: 'Friend\'s email:'}, 'insertinto');				
				var td = this._insertDOM(tr, {objType: 'td'}, 'insertinto');	
				
				this.password = new $WI.Class.Element;
				this.password.FormField({type: 'text', width: '180px'});					
				this.password.Write(td);	
				this.password.OnSubmitEvent(function(){}.Apply(this));				
				
				//create third row				
				var tr = this._insertDOM(t.tbody, {objType: 'tr'}, 'insertinto');
				var td = this._insertDOM(tr, {objType: 'td', html: 'Your name:'}, 'insertinto');				
				var td = this._insertDOM(tr, {objType: 'td'}, 'insertinto');	
				
				this.username = new $WI.Class.Element;
				this.username.FormField({type: 'text', width: '180px'});			
				this.username.Write(td);
				this.username.OnSubmitEvent(function(){}.Apply(this));		
				
				//create fourth row
				var tr = this._insertDOM(t.tbody, {objType: 'tr'}, 'insertinto');
				var td = this._insertDOM(tr, {objType: 'td', html: 'Your email:'}, 'insertinto');				
				var td = this._insertDOM(tr, {objType: 'td'}, 'insertinto');	
				
				this.password = new $WI.Class.Element;
				this.password.FormField({type: 'text', width: '180px'});					
				this.password.Write(td);	
				this.password.OnSubmitEvent(function(){}.Apply(this));	
				
				//create content
				var tr = this._insertDOM(t.tbody, {objType: 'tr'}, 'insertinto');
				var td = this._insertDOM(tr, {objType: 'td', html: 'Message:'}, 'insertinto');				
				var td = this._insertDOM(tr, {objType: 'td'}, 'insertinto');	
				
				this.password = new $WI.Class.Element;
				this.password.FormField({type: 'textarea', width: '180px', height: '100px'});					
				this.password.Write(td);	
				
				//create fifth row with buttons
				var tr = this._insertDOM(t.tbody, {objType: 'tr'}, 'insertinto');
				this._insertDOM(tr, {objType: 'td'}, 'insertinto');
				var td = this._insertDOM(tr, {objType: 'td', height: '30px', vAlign: 'bottom'}, 'insertinto');
				
				this.sign_in = new $WI.Class.Element;
				this.sign_in.Button({title: 'Send', icon: '/prism_resource/images/icons16x16/form_submit.png', width: '70px', config: {align: 'left'}});					
				this.sign_in.Write(td);	
				this.sign_in.OnClickEvent(function(){}.Apply(this));
				
				this.close_import = new $WI.Class.Element;
				this.close_import.Button({title: 'Close', width: '70px', icon: '/prism_resource/images/icons16x16/system_close.png', config: {marginLeft: '5px', align: 'left'}});					
				this.close_import.Write(td);	
				this.close_import.OnClickEvent(function(){}.Apply(this));
				
				//assign content into a window
				_win.Content(t);
				
	}
});








