

$WI.Class.Viewer = new $WI.Class({
  Create: function(options) {
		this.options = options;
    this.source = 'targetframe';
    this.server = this.options.server;
    this.fif = this.options.fif;
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
    this.resolution;
    this.refresher = null;
    this.credit = '';
		
		this.obj = this._createDOM({objType: 'div', objClass: 'element-viewer'});		
		
  },
	Write: function(where) {		
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');	
		this.source = $E(where);	
		this.load();
	},	
	GetBody: function(){
		return this.obj;
	},
	load: function(){
    this.source = $E(this.source);
    var loadurl = this.server + "?" + this.fif + "&obj=IIP,1.0&obj=Max-size&obj=Tile-size&obj=Resolution-number";
    
		this.Request({url: this.options.server + '?' + this.options.fif + '&obj=IIP,1.0&obj=Max-size&obj=Tile-size&obj=Resolution-number', method: 'GET', onComplete: this.completeLoad, onFailure: function(){ alert('Unable to get image and tile sizes from server!')}});

  },
	completeLoad: function (xml, text) {
    var text = text || "No response from server " + this.server;
    text.replace(/\n/,' ');
    var tmp = text.split( "Max-size" );
    if(!tmp[1]) alert( "Unexpected response from server " + this.server );
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
    this.resolution = parseInt( tmp[1].substring(1,tmp[1].length) );
	 //this.resolution = 3;
    this.createWindows();
	},
	
	/* Create our main and navigation windows
   */
  createWindows: function(){
  
    // Get our window size - subtract some pixels to make sure the browser never
    // adds scrollbars
   // var winWidth = document.viewport.getWidth() - 5;
   // var winHeight = document.viewport.getHeight() - 5;
		
		var winWidth = this._getWidth(this.obj);
    var winHeight = this._getHeight(this.obj);

    // Create our loading animated icon
    //var tmpstyle = 'left:'+ ((winWidth/2) - 16) +'px; top:'+ ((winHeight/2) - 16) + 'px';
		//var loading = new Element('img',{ id:'loading', 'src':'images/loading.gif', 'style':tmpstyle})
    //this.source.insert( loading );
		
		this.obj.target = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-viewer-target'}, 'insertinto');	
		
    // Calculate some sizes and create the navigation window
    this.calculateMinSizes();
    //this.createNavigationWindow();

    // Create our main window target div, add our events and inject inside the frame
    //var el = new Element('div', {'id': 'target'} );		
    //this.source.insert(el);
		
		this.dragdrop = $WI.Drag(this.obj.target);			
		this.AddEvent({type: 'drop', obj: this.obj.target, onevent: this.dragEnd});		

    /*
		new Draggable('target', {
      snap: function(x, y) {
        if (iip.wid > iip.rgn_w) {
          if (x > iip.rgn_x) {
            x = iip.rgn_x;
          }
          if (x < -(iip.wid - iip.rgn_w - iip.rgn_x)) {
            x = -(iip.wid - iip.rgn_w - iip.rgn_x);
          }
        } else {
          x = 0; // lock this axis
        }
        if (iip.hei > iip.rgn_h) {
          if (y > iip.rgn_y) {
            y = iip.rgn_y;
          }
          if (y < -(iip.hei - iip.rgn_h - iip.rgn_y)) {
            y = -(iip.hei - iip.rgn_h - iip.rgn_y);
          }
        } else {
          y = 0; // lock this axis
        }
        return [x,y];
      },
      onEnd: this.dragEnd(this)
    });
    */
    //el.observe('mousewheel', this.callScrolled(this) );
    //el.observe('DOMMouseScroll', this.callScrolled(this) );
   // el.observe('dblclick', this.callZoom(this) );
		
		this.AddEvent({obj: this.obj.target, type: 'mousewheel', onevent: this.callScrolled});
		this.AddEvent({obj: this.obj.target, type: 'dblclick', onevent: this.callZoom});
		

    $E(this.source).style.width = winWidth + "px";
    $E(this.source).style.height = winHeight + "px";
    this.rgn_w = winWidth;
    this.rgn_h = winHeight;

    this.reCenter();
    //this.zoomIn();
		//for(var i=0;i<0;i++) this.zoomIn();
		//this.zoomOut();
		//this.zoomOut();
    this.requestImages();
    this.positionZone();

    //Event.observe( window, 'resize', function(){ window.location=window.location; } );
    //document.observe( 'keydown', this.key.bindAsEventListener(this) );
  },
	
	/* Recenter the image view
   */
  reCenter: function() {
    this.rgn_x = (this.wid-this.rgn_w)/2;
    this.rgn_y = (this.hei-this.rgn_h)/2;
  },
	
  /* Create the appropriate CGI strings and change the image sources
   */
  requestImages: function() {

    // Clear our tile refresher
    if( this.refresher ){
			clearInterval(this.refresher);
      this.refresher = null;
    }
    
    // Load our image mosaic
    this.loadGrid();

    // Create a tile refresher to check for unloaded tiles
   // this.refresher = setInterval(function(){this.callRefresh()}.Apply(this), 500);

  },



  /* Create a grid of tiles with the appropriate JTL request and positioning
   */
  loadGrid: function(){

		
	
    // Delete our old image mosaic
		var _children = this._getChildren(this.obj.target);
		for(var i=0; i< _children.length; i++)
			this._removeDOM(_children[i]);
		
		$WI.trace(_children.length)
		
		this._applyConfig(this.obj.target, {left: '0px', top: '0px'});			
    
    // Get the start points for our tiles
    var startx = Math.floor( this.rgn_x / this.tileSize[0] );
    var starty = Math.floor( this.rgn_y / this.tileSize[1] );

    // If our size is smaller than the display window, only get these tiles!
    var len = this.rgn_w;
    if( this.wid < this.rgn_w ) len = this.wid-1;
    var endx =  Math.floor( (len + this.rgn_x) / this.tileSize[0] );
    //alert(this.wid+' '+this.rgn_w+' '+this.rgn_x+' '+len+' '+(len + this.rgn_x)+' '+this.tileSize[0]);

    len = this.rgn_h;
    if( this.hei < this.rgn_h ) len = this.hei-1;
    var endy = Math.floor( (len + this.rgn_y) / this.tileSize[1] );

    // Number of tiles is dependent on view width and height
    var xtiles = Math.ceil(this.wid / this.tileSize[0]);
    var ytiles = Math.ceil(this.hei / this.tileSize[1]);

    /* Calculate the offset from the tile top left that we want to display.
       Also Center the image if our viewable image is smaller than the window
    */
    var xoffset = Math.floor(this.rgn_x % this.tileSize[0]);
    if( this.wid < this.rgn_w ) xoffset -=  (this.rgn_w - this.wid)/2;

    var yoffset = Math.floor(this.rgn_y % this.tileSize[1]);
    if( this.hei < this.rgn_h ) yoffset -= (this.rgn_h - this.hei)/2;

    var tile;
    var i, j, k;
    var left, top;
    k = 0;

    // Create our image tile mosaic
    for( j=starty; j<=endy; j++ ){
      for( i=startx; i<=endx; i++ ){

		k = i + (j*xtiles);
		var src = this.server+"?"+this.fif+"&jtl="+this.resolution+"," + k;
		
		this._insertDOM(this.obj.target, {objType: 'img', objClass: 'element-viewer-image', src: src, left: this._fixPx((i-startx)*this.tileSize[0] - xoffset), top: this._fixPx((j-starty)*this.tileSize[1] - yoffset)}, 'insertinto');
		
//, width: this._fixPx(this.tileSize[0]), height: this._fixPx(this.tileSize[1])
      }
    }

  },



  /* Refresh function to avoid the problem of tiles not loading
     properly in Firefox/Mozilla
   */
  refresh: function(){

    var unloaded = 0;

    var els = this._getChildren(this.obj.target);
    var len = els.length;
    for(i=0;i<len;i++) {
      el = els[i];
      if( el.width == 0 || el.height == 0 ){
			el.src = el.src;
			unloaded = 1;
      }
    }

    /* If no tiles are missing, destroy our refresher timer, fade out our loading
       animation and and reset our cursor
     */
    if( unloaded == 0 ){
      clearInterval(this.refresher);
      this.refresher = null;
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



  /* Scroll resulting from a drag of the navigation window
   */
  scrollNavigation: function( e ) {

    var xmove = 0;
    var ymove = 0;

    var zone_w = $("zone").getWidth();
    var zone_h = $("zone").getHeight();
    if( e instanceof MouseEvent ){
      // From a mouse click
      xmove = e.pointerX() - $('navwin').offsetLeft - zone_w/2;
      ymove = e.pointerY() - $('navwin').offsetTop - zone_h/2;
    }
    else{
      // From a drag
      xmove = $('zone').offsetLeft;
      ymove = $('zone').offsetTop;
      if( (Math.abs(xmove-this.navpos[0]) < 3) && (Math.abs(ymove-this.navpos[1]) < 3) ) return;
    }

    if( xmove > (this.min_x - zone_w) ) xmove = this.min_x - zone_w;
    if( ymove > (this.min_y - zone_h) ) ymove = this.min_y - zone_h;
    if( xmove < 0 ) xmove = 0;
    if( ymove < 0 ) ymove = 0;

    this.rgn_x = xmove * this.wid / this.min_x;
    this.rgn_y = ymove * this.hei / this.min_y;

    this.requestImages();
    if( e instanceof MouseEvent ) this.positionZone();
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



  /* Generic zoom function
   */
  zoom: function( e ) {

    var event = e; //new Event(e);
    if(event.shiftKey) {
      this.zoomOut();
    }
    else this.zoomIn();

  },

  scrolled: function(event) {
		if(this._getWheelDelta(event) > 0)  this.zoomIn();
		else if(this._getWheelDelta(event) < 0)  this.zoomOut();
  },



  /* Zoom in by a factor of 2
   */
  zoomIn: function (){
    if( (this.wid <= (this.max_width/2)) && (this.hei <= (this.max_height/2)) ){

      this.wid = this.wid * 2;
      this.hei = this.hei * 2;

      if( this.xfit == 1 ){
				this.rgn_x = this.wid/2 - (this.rgn_w/2);
      }
      else if( this.wid > this.rgn_w ) this.rgn_x = 2*this.rgn_x + this.rgn_w/2;

      if( this.rgn_x > this.wid ) this.rgn_x = this.wid - this.rgn_w;
      if( this.rgn_x < 0 ) this.rgn_x = 0;

      if( this.yfit == 1 ){
				this.rgn_y = this.hei/2 - (this.rgn_h/2);
      }
      else if( this.hei > this.rgn_h ) this.rgn_y = this.rgn_y*2 + this.rgn_h/2;

      if( this.rgn_y > this.hei ) this.rgn_y = this.hei - this.rgn_h;
      if( this.rgn_y < 0 ) this.rgn_y = 0;

      this.resolution++;
      this.requestImages();
      this.positionZone();

    }
  },



  /* Zoom out by a factor of 2
   */
  zoomOut: function(){

    if( (this.wid > this.rgn_w) || (this.hei > this.rgn_h) ){
      this.wid = this.wid / 2;
      this.hei = this.hei / 2;

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

      this.resolution--;
      this.requestImages();
      this.positionZone();
    }
  },



  /* Calculate some dimensions
   */
  calculateMinSizes: function(){
    var tx = this.max_width;
    var ty = this.max_height;
    var thumb = 100;

    //var winWidth = document.viewport.getWidth();
    //var winHeight = document.viewport.getHeight();
	 
		var winWidth = this._getWidth(this.obj);
    var winHeight = this._getHeight(this.obj);
		
		

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

    // Determine the resolution for this image view
    tx = this.max_width;
    ty = this.max_height;
    while( tx > winWidth && ty > winHeight ){
      tx = parseInt(tx / 2);
      ty = parseInt(ty / 2);
      this.resolution--;
    }
    this.wid = tx;
    this.hei = ty;
    this.resolution--;
  },


  /* Create our navigation window
   */
  createNavigationWindow: function() {

    // Create our navigation div and inject it inside our frame
    var navwin = new Element( 'div', {
      id: 'navwin',
      style: 'width: '+this.min_x+'px; height: '+this.min_y+'px'
    });
    this.source.insert(navwin);
    //navwin.injectInside( this.source );

    // Create our navigation image and inject inside the div we just created
    var navimage = new Element( 'img', { id: 'navigation' } );
    navwin.insert(navimage);
    //navimage.injectInside( navwin );

    // Create our navigation zone and inject inside the navigation div
    var zone = new Element( 'div', {
      id: 'zone',
      style: 'width: '+(this.min_x/2) + 'px; height: '+(this.min_y/2) + 'px; opacity: 0.4'
    });
    navwin.insert(zone);
    //zone.injectInside( navwin );
    
    var zonedrag = new Draggable('zone',
    {
      revert: false,
      snap: function(x, y) {
        var draggableElement  = $('zone');
        var elementDimensions = Element.getDimensions(draggableElement);
        var parentDimensions  =
Element.getDimensions($('navwin'));

        return [constrain(x, 0, parentDimensions.width -
elementDimensions.width),
                constrain(y, 0, parentDimensions.height -
elementDimensions.height)]; 
      },
      onStart: function(){
 			    this.navpos = [$('zone').offsetLeft, $('zone').offsetTop];
 			}.bind(this),
      onEnd: this.scrollNavigation.bindAsEventListener(this)
    });
    
//     $("zone").makeDraggable({
//     	                container: 'navwin',
// 			// Take a note of the starting coords of our drag zone
// 			onStart: function(){
// 			    this.navpos = [$('zone').offsetLeft, $('zone').offsetTop];
// 			}.bind(this),
// 			onComplete: this.scrollNavigation.bindAsEventListener(this)
//     });

    var cnt=1.0;
    $("navigation").src = this.server + '?' + this.fif + '&SDS=' + this.sds + '&CNT=' +
	                                cnt + '&WID=' + this.min_x + '&CVT=jpeg';

    // Add our events
    $('navigation').observe('click', this.scrollNavigation.bindAsEventListener(this));
    $('navigation').observe('mousewheel', this.callScrolled(this));
    $('navigation').observe('DOMMouseScroll', this.callScrolled(this));
    
    $('zone').observe('DOMMouseScroll', this.callScrolled(this));
    $('zone').observe('mousewheel', this.callScrolled(this));
    $('zone').observe('dblclick', this.callZoom(this));
//     $("navigation").addEvent('click', this.scrollNavigation.bindWithEvent(this) );
//     $('navigation').addEvent('mousewheel', this.zoom.bindAsEventListener(this) );
//     $('zone').addEvent('mousewheel', this.zoom.bindAsEventListener(this) );
//     $("zone").addEvent( 'dblclick', this.zoom.bindWithEvent(this) );
  },
  



  



  /* Reposition the navigation rectangle on the overview image
   */
  positionZone: function(){

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

   // var border = $("zone").offsetHeight - $("zone").clientHeight;

    // Create a smooth special effect to move the zone to the new size and position
   /*
	  new Effect.Morph('zone', {
      style:'left: '+(pleft - border/2)+'px;'
      + 'top: '+(ptop - border/2)+'px;'
      + 'width: '+(width)+'px;'
      + 'height: '+(height)+'px'
    }, {duration:.25});
*/
  },
	dragEnd: function () {
    this.scroll();
	},	
	callRefresh: function () {
	  this.refresh();
	},	
	callZoom: function (event) {
	  this.zoom(event);
	},
	callScrolled: function (event) {
		this.scrolled(event);
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

// NS - scroll wheen capture
/*
* Orginal: http://adomas.org/javascript-mouse-wheel/
* prototype extension by "Frank Monnerjahn" themonnie @gmail.com
*/
/*
Object.extend(Event, {
        wheel:function (event){
                var delta = 0;
                if (!event) event = window.event;
                if (event.wheelDelta) {
                        delta = event.wheelDelta/120;
                        if (window.opera) delta = -delta;
                } else if (event.detail) { delta = -event.detail/3;     }
                return Math.round(delta); //Safari Round
        }
});

*/