/*********************************************************
*		Viewer CLASS
*		Designed & developed by Dima Svirid, 2009	
*		Class: viewer.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Viewer = new $WI.Class({
  Create: function(options) {
		this.options = options;
    this.max_width = 0;
    this.max_height = 0;
    this.min_x = 0;
    this.min_y = 0;
    this.sds = "0,90";
    this.contrast = 1.0;
    this.wid = 0;
    this.hei = 0;
    this.rgn_x = 0;
    this.rgn_y = 0;
    this.rgn_w = this.wid;
    this.rgn_h = this.hei;
    this.xfit = 0;
    this.yfit = 0;
    this.navpos = [0,0];
    this.tileSize = [0,0];
    this.resolution;	//is a current resolution set
		this.zoom_level;	//is a new zoom value to set to resolution
		this.top_resolution;	//max allowed resolution
		this.images = [];
		this.qlt = $WI.Check(this.options.quality, 80);
		this.entry_data = null;	//contains data when user first look at the issue
		if(!this.options.maxInRow) this.options.maxInRow = 1;
		
		this.obj = this._createDOM({objType: 'div', objClass: 'element-viewer'});		
		
		this.AddEvent({type: 'zoom', obj: this, onevent: this.zoom});	
		this.AddEvent({type: 'hide', obj: this, onevent: this.onHide});
		this.AddEvent({type: 'show', obj: this, onevent: this.onShow});
		this.AddEvent({type: 'close', obj: this, onevent: this.onClose});
		
		return this;
  },
	SetImage: function(image) {
		this.fif = image;
		this.images.push({src: image});
	},
	Write: function(where) {		
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');
		this.createPreloader();			
		this.source = $E(where);		
		this.load();		
	},	
	GetBody: function(){ 
		return this.obj;
	},
	GetImages: function(){ 
		return this.images;
	},
	SetMarker: function(pageNumber, options) {		
		if(!this.images[pageNumber-1].markers) this.images[pageNumber-1].markers = [];
		this.images[pageNumber-1].markers.push(options);
	},	
	generateMarker: function(page, options) {	
		var _diffr = this.resolution-options.resolution;
		if(_diffr > 0) {
			for(var r=0;r<_diffr;r++) {
				options.top += options.top;
				options.left += options.left;
			}
		} else {
			for(var r=0;r<Math.abs(_diffr);r++) {
				options.top -= options.top/2;
				options.left -= options.left/2;
			}
		}
		
		if(options.area) {
			var marker = this._insertDOM(page, {objType: 'div', top: this._fixPx(options.top), left: this._fixPx(options.left), width: '120px', height: '70px', opacity: .5, cursor: 'pointer', border: '1px solid red', backgroundColor: '#000000', position: 'absolute'}, 'insertinto');
		} else {
			var marker = this._insertDOM(page, {objType: 'img', objClass: 'element-viewer-page-marker png', src: options.src, top: this._fixPx(options.top), left: this._fixPx(options.left)}, 'insertinto');		
		}
		
		marker.options = options;
		
		this.AddEvent({obj: marker, type: 'click', onevent: this.showMarkerTooltip});
	},	
	load: function(){
	  if(this.images.length==0) return;
		
		this.source = $E(this.source);
		
    //var loadurl = this.options.server + "?FIF=" + this.images[0].src + "&obj=Max-size&obj=Tile-size&obj=Resolution-number";
		var loadurl = "http://turnit.prismx.net/index.php?tmpl=ptiff&tiff=" + this.images[0].src;

		this.Request({url: loadurl.replace(/:81/, ''), method: 'GET', onComplete: this.completeLoad, timeout: 30, onFailure: function(){ alert('Unable to get image and tile sizes from server!')}});

  },
	completeLoad: function (xml, text) {
		var text = text || "No response from server " + this.options.server;
    text.replace(/\n/,' ');
    var tmp = text.split( "Max-size" );
    if(!tmp[1]) alert( "Unexpected response from server " + this.options.server );
    var size = tmp[1].split(" ");
    size[1] = size[1].split('\n')[0];
    this.max_width = parseInt( size[0].substring(1,size[0].length) );
    this.max_height = parseInt( size[1] );
    tmp = text.split( "Tile-size" );
    size = tmp[1].split(" ");
    size[1] = size[1].split('\n')[0];
    this.tileSize[0] = parseInt( size[0].substring(1,size[0].length) );
    this.tileSize[1] = parseInt( size[1] );
    tmp = text.split( "Resolution-number" );
    this.top_resolution = parseInt( tmp[1].substring(1,tmp[1].length) );
	 	this.resolution = this.top_resolution;
    this.createWindows();
		this.createNavigation();		
		
		this.Fire(null, 'show', this);		
	},
	
	/* Create our main and navigation windows
   */
  createWindows: function() {
  
    // Get our window size - subtract some pixels to make sure the browser never
    // adds scrollbars
   // var winWidth = document.viewport.getWidth() - 5;
   // var winHeight = document.viewport.getHeight() - 5;
		
		var winWidth = this._getWidth(this.obj);
    var winHeight = this._getHeight(this.obj);
		
		this.obj.wrapper = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-viewer-wrapper'}, 'insertinto');	
		this.obj.target = this._insertDOM(this.obj.wrapper, {objType: 'div', objClass: 'element-viewer-target'}, 'insertinto');	
		
		//enable scrollers for the scrollable content
		if($WI.Check(this.options.scrollable, false) == true) {			
			this._applyConfig(this.obj.wrapper, {overflowY: 'auto', width: this._fixPx(this._getWidth(this.obj.wrapper)-60)});
		}
		
    // Calculate some sizes and create the navigation window
    this.calculateMinSizes();
		
		this.dragdrop = $WI.Drag(this.obj.target, {moveY: ($WI.Check(this.options.scrollable, false))?false:true});	
		this.AddEvent({type: 'drag', obj: this.obj.target, onevent: this.drag});					
		this.AddEvent({type: 'drop', obj: this.obj.target, onevent: this.dragEnd});		
		
		if($WI.Check(this.options.scrollable, false) == false)
			this.AddEvent({obj: this.obj, type: 'mousewheel', onevent: this.callScrolled});
		else
			this.AddEvent({obj: this.obj.wrapper, type: 'scroll', onevent: this.dragEnd});
		
		this.AddEvent({obj: this.obj.target, type: 'dblclick', onevent: this.callZoom});
		

    //$E(this.source).style.width = winWidth + "px";
    //$E(this.source).style.height = winHeight + "px";
    this.rgn_w = winWidth;
    this.rgn_h = winHeight;

		
    this.reCenter();
			
		//this.refreshImages();
    //this.zoomIn();
		//for(var i=0;i<0;i++) this.zoomIn();
		//this.zoomIn();
		//this.zoomOut();
    //this.requestImages();
   // this.positionZone();
		
		this.AddEvent({obj: window, type: 'resize',  onevent: this.resizeWindow});
  },	
	
	resizeWindow: function() {
		
		this.rgn_w = this._getWidth(this.obj);
    this.rgn_h = this._getHeight(this.obj);

		this.loadImages();
	},
  
  
	/* remove all current onces first, after load new set */
	refreshImages: function() {
		
		// Delete our old image mosaic
		var _children = this._getChildren(this.obj.target);
		for(var i=0; i< _children.length; i++)
			this._removeDOM(_children[i]);		

		for(var i=0; i< this.images.length; i++) {
			delete this.images[i].page;
			this.images[i].loaded = [];
		}
		
		this.loadImages();
		
	},
	/* load an image */
  loadImages: function(){			
		this.loadedImages = 0;
		this.totalImages = 0;
		//this._applyConfig(this.obj.target, {left: this._fixPx(((this.rgn_w-this.wid*this.images.length)/2)), top: '0px'});	
		//this._applyConfig(this.obj.target, {left: this._fixPx(0), top: '0px'});	
		var count_x = 1;
		var count_y = 1;
		for(var i = 1; i <= this.images.length; i++) {			
				
			if(this.options.maxInRow && count_x > this.options.maxInRow) {
				count_x = 1;
				count_y++;
			}			
			var page_x = (count_x==1)?0:(this.wid*count_x-this.wid);	
			var page_y = (count_y==1)?0:(this.hei*count_y-this.hei);			
			
			if(!this.images[i-1].page)
				this.images[i-1].page = this._insertDOM(this.obj.target, {objType: 'div', objClass: 'element-viewer-target-page', left: this._fixPx(page_x), top: this._fixPx(page_y)}, 'insertinto');	
			
			this.images[i-1].pageNumber = i;
			this.images[i-1].page_x = page_x;
			this.images[i-1].page_y = page_y;
			this.images[i-1].page_w = this.wid;
			this.images[i-1].page_h = this.hei;
			
			this.loadGrid(this.images[i-1]);
			
			if(this.images[i-1].markers)
				for(var m=0; m< this.images[i-1].markers.length; m++)
					this.generateMarker(this.images[i-1].page, this.images[i-1].markers[m]);
			
			this.images[i-1].markers = null;
			
			count_x++;
		}
		//enable scrollers for the scrollable content
		if($WI.Check(this.options.scrollable, false) == true) {
			this._applyConfig(this.obj.target, {height: this._fixPx(page_y)});
		}
	},
  loadGrid: function(tif){		
		if(	
				(tif.page_x - Math.abs(this.rgn_x)) > this.rgn_w ||
				(tif.page_y - Math.abs(this.rgn_y)) > this.rgn_h
			) return;

		var startx = starty = endx = endy = 0;
		var rgn_w = this.rgn_w - tif.page_x - this.rgn_x;
		var rgn_h = this.rgn_h - tif.page_y - this.rgn_y;
		var rgn_x = this.rgn_x + tif.page_x;
		var rgn_y = this.rgn_y + tif.page_y;
		
    // Get the start points for our tiles
		var screen_w = this.rgn_w - tif.page_x;
		if(screen_w > tif.page_w) screen_w = tif.page_w;
		var screen_h = this.rgn_h - tif.page_y;
		if(screen_h > tif.page_h) screen_h = tif.page_h;
		
		if(rgn_x < 0) 
    	startx = Math.floor( Math.abs(rgn_x) / this.tileSize[0] );
    
		if(rgn_y < 0) 
			starty = Math.floor( Math.abs(rgn_y) / this.tileSize[1] );

		if(tif.page_w < rgn_w)
			var endx =  Math.floor( tif.page_w / this.tileSize[0] );
		else
			var endx =  Math.floor( (rgn_w / this.tileSize[0]) );
		
		if(tif.page_h < rgn_h)
			var endy =  Math.floor( tif.page_h / this.tileSize[1] );
		else
			var endy =  Math.floor( (rgn_h / this.tileSize[1]));
		
    // Number of tiles is dependent on view width and height
    var xtiles = Math.ceil(tif.page_w / this.tileSize[0]);
    var ytiles = Math.ceil(tif.page_h / this.tileSize[1]);

    var tile;
    var i, j, k;
    var left, top;
    k = 0;
		
		//if(this.resolution == 4) {
		//$WI.trace('WID: ' + this.wid + ', ' + this.hei);
		//$WI.trace('PAGE XY: ' + tif.page_x + ', ' + tif.page_y);
		//$WI.trace('SCREEN WH: ' + screen_w + ', ' + screen_h);
		//$WI.trace('PAGE WH: ' + tif.page_w + ', ' + tif.page_h);
		//$WI.trace('TILES START: ' + startx + ', ' + starty);
		//$WI.trace('TILES END: ' + endx + ', ' + endy);
		//$WI.trace('RGN XY: ' + rgn_x + ', ' + rgn_y);
		//$WI.trace('IMAGE: ' + tif.src);
		//$WI.trace('RGN WH: ' + rgn_w + ', ' + this.rgn_h);
		//
		//}
		
    // Create our image tile mosaic
    for( j=starty; j<=endy; j++ ) {
      for( i=startx; i<=endx; i++ ) {

				k = i + (j*xtiles);
				
				if(tif.loaded.InArray(k))
					continue;		
				
				var src = this.options.server+"?FIF="+tif.src+"&qlt="+this.qlt+"&jtl="+this.resolution+"," + k;
				this.totalImages++;

				tif.loaded.push(k);
				
				this._insertDOM(tif.page, {objType: 'img', objClass: 'element-viewer-image', border: '0px solid #ff0000', src: src, left: this._fixPx((i)*this.tileSize[0]), top: this._fixPx((j)*this.tileSize[1]), onload: this.refreshPreloader, onerror: this.imageLoadedError}, 'insertinto');
		
      }
    }

  },

	refreshPreloader: function() {

		this.loadedImages++;		
		
		if(this.totalImages && this.obj.preloader) {
			this._isDisplay(this.obj.preloader, true);
			//this._setStyle(this.obj.preloader, 'opacity', 100);
			var total = Math.ceil(this.loadedImages*100/this.totalImages);
			if(total >= 100) {
				total = 100;
				
				new $WI.Animation({obj: this.obj.preloader, speed: 20, style: 'opacity', from: 100, to: 0});
				//$WI.Cursor();
			} else {
				//$WI.Cursor('wait');
			}
			
			this._setStyle(this.obj.preloader.progress, 'width', this._fixP$(total));			
		}
				
	},
  /* Allow us to navigate within the image via the keyboard arrow buttons
   */
  key: function(e){
    var d = 100;
    switch( e.keyCode ){
    case 37: // left
      this.scrollTo(-d,0);
      break;
    case 38: // up
      this.scrollTo(0,-d);
      break;
    case 39: // right
      this.scrollTo(d,0);
      break;
    case 40: // down
      this.scrollTo(0,d);
      break;
    case 107: // plus
    case 61:
      if(!e.ctrlKey) this.zoomIn();
      break;
    case 109: // minus
      if(!e.ctrlKey) this.zoomOut();
      break;
    }
  },

	imageLoadedError: function() {
		if(!this.tried){
			this.tried=true;
			this.src = this.src + '&rand=' + $WI.Random();
		}
	},
  /* Scroll from a target drag event
   */
  scroll: function() {
    var xmove =  - this.obj.target.offsetLeft;
    var ymove =  - this.obj.target.offsetTop;
    this.scrollTo( xmove, ymove );
  },
  /* Scroll to a particular position
   */
  scrollTo: function( x, y ) {

    if( x || y ){

      // To avoid unnecessary redrawing ...
      if( (Math.abs(x) < 3) && (Math.abs(y) < 3) ) return;

      this.rgn_x += x;
      this.rgn_y += y;

      if( this.rgn_x > this.wid - this.rgn_w ) this.rgn_x = this.wid - this.rgn_w;
      if( this.rgn_y > this.hei - this.rgn_h ) this.rgn_y = this.hei - this.rgn_h;
      if( this.rgn_x < 0 ) this.rgn_x = 0;
      if( this.rgn_y < 0 ) this.rgn_y = 0;

      this.requestImages();
      this.positionZone();

    }
  },
	move: function(style, period){
		if(style == 'left')
			var from = this._getStyleInt(this.obj.target, 'left');
		else 
			var from = this._getStyleInt(this.obj.target, 'top');		
		var to = from + (period*(this.resolution+1));
		
		var _effect = new $WI.Animation({obj: this.obj.target, style: style, tweening: 'strongOut', from: from, to: to, speed: 10});	
		this.AddEvent({obj: _effect, type: 'finished', onevent: this.dragEnd});
	},
	reset: function(style, period){
		this.zoom_level = this.entry_data.resolution;
		this.zoom();
		this.reCenter();		
	},
  zoom: function(event, _target, obj) {	
		var step = Math.abs(this.resolution - this.zoom_level);
		if(this.zoom_level > this.resolution)
			this.zoomIn(step);			
		else if(this.zoom_level < this.resolution)
			this.zoomOut(step);			
		
		this.obj.navigation.slider.SetValue(this.resolution);		
		return;
		
		
		var step = Math.abs(this.resolution - this.obj.navigation.slider.GetPoint());
//alert(this.obj.navigation.slider.GetPoint())
		if(this.resolution > this.obj.navigation.slider.GetPoint())
			this.zoomOut(step);
		else
			this.zoomIn(step);
		
/*
    var event = e; 
    if(event.shiftKey) {
      this.zoomOut();
    }
    else this.zoomIn();
*/
  },
  scrolled: function(event) {
		
  },
  zoomIn: function (point, event){
   
	  if($WI.Check(point, 0) == 0) var point = 0;		
		if((this.resolution+point) >= this.top_resolution) return false;		

		//if( (this.wid <= (this.max_width/2)) && (this.hei <= (this.max_height/2)) ){
		for(var i=0; i< point; i++) {
      this.wid = this.wid * 2;
      this.hei = this.hei * 2;
			this.resolution++;
		}
		
		//$WI.trace('blablabl')
      //if( this.xfit == 1 ){
				//this.rgn_x = this.wid/2 - (this.rgn_w/2);
      //}
     // else if( this.wid > this.rgn_w ) this.rgn_x = 2*this.rgn_x + this.rgn_w/2;

     // if( this.rgn_x > this.wid ) this.rgn_x = this.wid - this.rgn_w;
     // if( this.rgn_x < 0 ) this.rgn_x = 0;

      //if( this.yfit == 1 ){
			//	this.rgn_y = this.hei/2 - (this.rgn_h/2);
      //}
     // else if( this.hei > this.rgn_h ) this.rgn_y = this.rgn_y*2 + this.rgn_h/2;

     // if( this.rgn_y > this.hei ) this.rgn_y = this.hei - this.rgn_h;
     // if( this.rgn_y < 0 ) this.rgn_y = 0;

     	this.reCenter();
			//this.refreshImages();
      this.positionZone();
			
			

   // }
  },
	_zoomIn: function (point, event){
		//if(!point)		
		var point = 1;
		for(var i=0; i < point; i++)
			this.zoom_level = this.resolution + 1;
		
		if(event) {
		var mouseXY = this._getMouseXY(event);
		//$WI.trace(mouseXY.x + '|' + mouseXY.y)
		}
			
		this.Fire(null, 'zoom', this);
	},
  zoomOut: function(point) {
		if($WI.Check(point, 0) == 0) var point = 0;		
		if((this.resolution-point) < 0) return false;
   	
		for(var i=0; i< point; i++) {
      this.wid = this.wid / 2;
      this.hei = this.hei / 2;
			this.resolution--;
		}
			/*
      this.rgn_x = this.rgn_x/2 - (this.rgn_w/4);
      if( this.rgn_x + this.rgn_w > this.wid ) this.rgn_x = this.wid - this.rgn_w;
      if( this.rgn_x < 0 ){
				this.xfit=1;
				this.rgn_x = 0;
      }
      else this.xfit = 0;

      this.rgn_y = this.rgn_y/2 - (this.rgn_h/4);
      if( this.rgn_y + this.rgn_h > this.hei ) this.rgn_y = this.hei - this.rgn_h;
      if( this.rgn_y < 0 ){
				this.yfit=1;
				this.rgn_y = 0;
      }
      else this.yfit = 0;
			*/
			
     
      this.reCenter();
			//this.refreshImages();
      this.positionZone();
   // }
  },
	_zoomOut: function (point){
		
		//if(!point) 
		var point = 1;
		
		for(var i=0; i < point; i++)
			this.zoom_level = this.resolution - 1;
		
		this.Fire(null, 'zoom', this);
	},


  /* Calculate some dimensions
   */
  calculateMinSizes: function(){
    var tx = this.max_width;
    var ty = this.max_height;
    var thumb = 100;
	 
		var winWidth = this._getWidth(this.obj);
    var winHeight = this._getHeight(this.obj);
		
		if(this.images.length<this.options.maxInRow) 
			this.options.maxInRow = this.images.length;
				

    if( winWidth>winHeight ){
			// For panoramic images, use a large navigation window
			if( tx > 2*ty ) thumb = winWidth / 2;
			else thumb = winWidth / 4;
    }
    else thumb = winHeight / 4;

    var r = this.resolution;
    while( tx > thumb ){
      tx = parseInt(tx / 2);
      ty = parseInt(ty / 2);
      // Make sure we don't set our navigation image too small!
      if( --r == 1 ) break;
    }
    this.min_x = tx;
    this.min_y = ty;

    // Determine the resolution for the default start image view
    tx = this.max_width;
    ty = this.max_height;
    while( tx > winWidth+50 || ty > winHeight+50 ){
      tx = parseInt(tx / 2);
      ty = parseInt(ty / 2);
      this.resolution--;
    }		
		this.wid = tx;
    this.hei = ty;
		
    this.resolution--;		
		
		if(!this.entry_data)
			this.entry_data = {resolution: this.resolution};
		
		//this.Fire(null, 'zoom', this);		
	},
	createPreloader: function() {
		this.obj.preloader = this._insertDOM(this.obj.navigation, {objType: 'div', objClass: 'element-viewer-preloader'}, 'insertinto');
		this.obj.preloader.progress = this._insertDOM(this.obj.preloader, {objType: 'div', objClass: 'element-viewer-preloader-progress'}, 'insertinto');
	},
	createNavigation: function() {
		if(!$WI.Class.Slider) return;
		
		this.obj.navigation = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-viewer-navigation'}, 'insertinto');	

		//register navigation to be always on the top
		this.dragdrop.AlwaysOnTop(this.obj.navigation);		
		this._maxZ(this.obj.navigation);
		
		var values = [];
		for(var r=this.top_resolution-1;r>=0;r--)
			values.push(r); 
		
		this.obj.navigation.slider = new $WI.Class.Slider;	
		this.obj.navigation.slider.Create({cursor: '/api2.0/src/images/viewer/zoom_slider_cursor.png', scroll: 'y', values: values});
		this.obj.navigation.slider.Write(this.obj.navigation);
		this.obj.navigation.slider.SetValue(this.resolution);
		
		//this.AddEvent({type: 'drag', obj: this.obj.navigation.slider.GetScrollObj(), onevent: this.onZoomScroll});
		//this.AddEvent({type: 'drop', obj: this.obj.navigation.slider.GetScrollObj(), onevent: this.onZoomScrollDrop});	
		this.AddEvent({type: 'change', obj: this.obj.navigation.slider.GetBody(), onevent: this.onZoomScroll});		
		//this.AddEvent({type: 'zoom', obj: this, onevent: this.onZoomScroll});	
		
		
		//create zoom in and zoom out buttons
		this.obj.navigation.button_zoomin = this._createNavigationButton({objClass: 'element-viewer-navigation-button-zoomin', onClickEvent: this._zoomIn});
		this._insertDOM(this.obj.navigation, {newNode: this.obj.navigation.button_zoomin}, 'insertinto');
		
		this.obj.navigation.button_zoomout = this._createNavigationButton({objClass: 'element-viewer-navigation-button-zoomout', onClickEvent: this._zoomOut});
		this._insertDOM(this.obj.navigation, {newNode: this.obj.navigation.button_zoomout}, 'insertinto');
		
		//create move buttons
		this.obj.navigation.button_move = this._createNavigationButton({objClass: 'element-viewer-navigation-button-move', onClickEvent: function(){this.reset()}});
		this._insertDOM(this.obj.navigation, {newNode: this.obj.navigation.button_move}, 'insertinto');
		
		this.obj.navigation.button_moveup = this._createNavigationButton({objClass: 'element-viewer-navigation-button-moveup', onClickEvent: function(){this.move('top', -50)}});
		this._insertDOM(this.obj.navigation, {newNode: this.obj.navigation.button_moveup}, 'insertinto');
		
		this.obj.navigation.button_moveright = this._createNavigationButton({objClass: 'element-viewer-navigation-button-moveright', onClickEvent: function(){this.move('left', 50)}});
		this._insertDOM(this.obj.navigation, {newNode: this.obj.navigation.button_moveright}, 'insertinto');
		
		this.obj.navigation.button_moveleft = this._createNavigationButton({objClass: 'element-viewer-navigation-button-moveleft', onClickEvent: function(){this.move('left', -50)}});
		this._insertDOM(this.obj.navigation, {newNode: this.obj.navigation.button_moveleft}, 'insertinto');
		
		this.obj.navigation.button_movedown = this._createNavigationButton({objClass: 'element-viewer-navigation-button-movedown', onClickEvent: function(){this.move('top', 50)}});
		this._insertDOM(this.obj.navigation, {newNode: this.obj.navigation.button_movedown}, 'insertinto');
			
	},
	_createNavigationButton: function(options) {
		var _button = this._createDOM({objType: 'div', objClass: 'element-viewer-navigation-button', html: (options.value)?options.value:null, config: (options.config)?options.config:null});	
		if(options.objClass) this._addClass(_button, options.objClass);
		this.AddEvent({obj: _button, type: 'mouseover', onevent: this._onTopButtonMouseEvent});
		this.AddEvent({obj: _button, type: 'mouseout', onevent: this._onTopButtonMouseEvent});		
		if(options.onClickEvent) this.AddEvent({obj: _button, type: 'click', onevent: options.onClickEvent});
		return _button;
	},
  /* Reposition the navigation rectangle on the overview image
   */
  positionZone: function(){
		return;
    var pleft = (this.rgn_x/this.wid) * (this.min_x);
    if( pleft > this.min_x ) pleft = this.min_x;
    if( pleft < 0 ) pleft = 0;

    var ptop = (this.rgn_y/this.hei) * (this.min_y);
    if( ptop > this.min_y ) ptop = this.min_y;
    if( ptop < 0 ) ptop = 0;

    var width = (this.rgn_w/this.wid) * (this.min_x);
    if( pleft+width > this.min_x ) width = this.min_x - pleft;

    var height = (this.rgn_h/this.hei) * (this.min_y);
    if( height+ptop > this.min_y ) height = this.min_y - ptop;

    if( width < this.min_x ) this.xfit = 0;
    else this.xfit = 1;
    if( height < this.min_y ) this.yfit = 0;
    else this.yfit = 1;
  },
	drag: function (event, _target, obj) {
    if(this._isIE()) return;	//disable this functionality in IE because of the slowliness of the engine
		this.reSetRGN();				
		this.loadImages();
	},	
	dragEnd: function (event, _target, obj) {
		this.reSetRGN();				
		this.loadImages();		
		//this.refreshImages();
	},	
	reSetRGN: function() {		
		this.rgn_x = this._getStyleInt(this.obj.target, 'left');
    if($WI.Check(this.options.scrollable, false))
			this.rgn_y = -this._getScrollXY(this.obj.wrapper).y;
		else
			this.rgn_y = this._getStyleInt(this.obj.target, 'top');
	},
	onZoomScroll: function(event, _target, obj){
		this.zoom_level = this.obj.navigation.slider.GetValue();
		this.Fire(null, 'zoom', this);		
	},
	reCenter: function() {    
		var total_y = total_x = _total_x = cellcount = 0;
		
		for(var i=1; i <= this.images.length; i++) {
			++cellcount;
			_total_x += this.wid;	
			if(this.options.maxInRow && i == this.options.maxInRow)	total_x = _total_x;

			if(this.options.maxInRow && cellcount == this.options.maxInRow) {
				cellcount = 0;
				total_y += this.hei;
			}
		}
		if(total_x==0) total_x = _total_x;
		
		if(total_x > this.rgn_w) var _center_x = -(total_x/2) + (this.rgn_w/2);
		else var _center_x = this.rgn_w/2 - (total_x/2);
		if(total_y > this.rgn_h) var _center_y = -(total_y/2) + (this.rgn_h/2);
		else var _center_y = this.rgn_h/2 - (total_y/2);
		
		this._applyConfig(this.obj.target, {left: this._fixPx(_center_x), top: ($WI.Check(this.options.scrollable, false)) ? 0 : this._fixPx(_center_y)});	

		this.reSetRGN();
		this.refreshImages();		

  },	
	callZoom: function (event) {
		if($WI.REG.Buttons.Ctrl)
			this._zoomOut(null, event);
		else
			this._zoomIn(null, event);		
	},
	callMove: function (event) {
		if($WI.REG.Buttons.Ctrl)
			this._zoomOut();
		else
			this._zoomIn();		
	},
	callScrolled: function (event) {		
		if(this.scroll_action) return;
		this.scroll_action = true;
		if(this._getWheelDelta(event) > 0)  this._zoomIn();
		else if(this._getWheelDelta(event) < 0)  this._zoomOut();
		setTimeout(function(){this.scroll_action = false;}.Apply(this), 100);
	},	
	onClose: function(event, _target, obj) {
		this._removeDOM(this.obj);
		if(this.obj.preloader)
			this._removeDOM(this.obj.preloader);
		if(this.obj.navigation)
			this._removeDOM(this.obj.navigation);		
	},
	onHide: function(event, _target, obj) {
		this._isDisplay(this.obj, false);
		if(this.obj.preloader)
			this._isDisplay(this.obj.preloader, false);
		if(this.obj.navigation)
			this._isDisplay(this.obj.navigation, false);
	},
	onShow: function(event, _target, obj) {
		this._isDisplay(this.obj, true);
		if(this.obj.preloader)
			this._isDisplay(this.obj.preloader, true);
		if(this.obj.navigation)
			this._isDisplay(this.obj.navigation, true);
	},
	hideMarkerTooltip: function(event, _target, obj) {
		this._isDisplay(obj, false);
	},
	showMarkerTooltip: function(event, _target, obj) {
		if(obj.tooltip) {
			this._isDisplay(obj.tooltip, true);
		} else if (obj.options.image_preview){
			preview.Image({src: '/api2.0/src/images/image_preview/1.jpg', description: 'RUS 1 - CAN 8<br>Preliminary Round<br>04/04/2008, Photo: HHOF-IIHF Images Phillip MacCallum Preliminary round action at the 2008 IIHF World Women\'s Championship in Harbin, CHN.'});
		} else {
			var content = $E(obj.options.tooltip).cloneNode(true);	
	
			var xy = this._getXY(obj, true);
			
			obj.tooltip = this._insertDOM(obj.parentNode, {objType: 'div', objClass: 'element-viewer-page-marker-tooltip'}, 'insertinto');	
			
			var connector = this._insertDOM(obj.tooltip, {objType: 'div', objClass: 'element-viewer-page-marker-connector'}, 'insertinto');
			obj.content = this._insertDOM(obj.tooltip, {objType: 'div', objClass: 'element-viewer-page-marker-body'}, 'insertinto');		
			
			this._insertDOM(obj.tooltip, {objType: 'img', objClass: 'element-viewer-page-marker-shadow png', src: '/multimedia/ajax_reader/images/marker_tooltip_shadow.png'}, 'insertfirst');
			
			
			obj.content.appendChild(content);
			
			this._isDisplay(content, true);
			
			var w = this._getWidth(content);
			var h = this._getHeight(content);
			var hc = this._getHeight(connector);
			
			this._applyConfig(obj.tooltip, {height: this._fixPx(h+10), top: this._fixPx(xy.y-h-hc-10), left: this._fixPx(xy.x+10-w/2)});
			
			var closebut = this._insertDOM(obj.tooltip, {objType: 'div', html: '<strong>CLOSE</strong>', top: '-20px', cursor: 'pointer', position: 'absolute'}, 'insertinto');
			this.AddEvent({obj: closebut, type: 'click', onevent: function(){this.hideMarkerTooltip(null, null, obj.tooltip)}});
		}
	},
	constrain: function (n, lower, upper) {
    if (n > upper)
     return upper;
    else if (n < lower)
     return lower;
    else 
     return n;
	} 
});
