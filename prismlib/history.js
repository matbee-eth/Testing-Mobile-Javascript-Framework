/*********************************************************
*		HISTORY OBJECT CLASS
*		Current class is an implementation of the AJAX history object
*		Designed & developed by Dima Svirid, 2008	
*		Class: history.js
*	  Extends: system.js
*********************************************************/
$WI.Class.History = new $WI.Class({
	Init: function(options) {	
		if(!options) var options = {};
		this.options = options;
		//create red preloader message, google style
		if(this.options.preloader) {
			var xy = this._getScrollXY();
			this.preloader = this._insertDOM(null, {objType: 'div', display: 'none', position: 'absolute', top: this._fixPx(xy.y), right: this._fixPx(-xy.x), backgroundColor: '#bd1111',	color: '#ffffff',	fontSize: '10pt',	width: '80px',	height: '20px',	padding: '2px',	paddingLeft: '5px',	zIndex: '100000', html: 'Loading...'}, 'insertlast');		
		}		
		if(!this.history_interval)
			this.history_interval = setInterval(function(){this.Go()}.Apply(this), 100);
		this.Parse();
		this.Reg(this.GetBrowserURLAnchor(document.location.href, true));		
  },
	Parse: function() {
		this._handleLinks();
	},
	Go: function(url) {			
		var sURL = this.GetBrowserURLAnchor();	
		if(sURL&&(!this.prev||(this.prev&&this.prev!=sURL))) {
			this.entrance = false;
			this.prev = sURL;
			this._go(sURL);		
		} else if(!this.entrance&&sURL=='') {			//this block is required to get back to the homepage
			this.entrance = true;
			this._go(sURL);		
		}	
		//hide red preloader
		if(this.preloader)
			this._isDisplay(this.preloader, false);
	},	
	Reg: function(str) {			
		if(str.substring(0, 1)=='/') str = str.substring(1);
		var is_replace = (str.substring(0, 1)=='.');	//replace mode
		var result = [];
		
		if(result = new RegExp(/(top[/]false)/gi).exec(str)) {
		} else {
			if(this.options && this.options.scrollTopPage && $WI.Check(this.options.scrollTopPage, true)) {
				if(document.documentElement.scrollTop)
					document.documentElement.scrollTop = '0px';
				else
					document.body.scrollTop = '0px';
			}
		}		
		//$WI.trace(str)		
		if(is_replace) {
			var _str = this.GetBrowserURLAnchor();			
			var _pra = str.substring(2).split('/');			
			for(var i=0;i<_pra.length;i = i + 2) {
				if(_pra[i+1]=='$')
					_str = this._removeKey(_str, _pra[i]);
				else
					_str = this._replaceValue(_str, _pra[i], _pra[i+1]);
			}
			str = _str;			
		}	
		str = escape(str);
		
		if(this._isIE()) {			
			if(!this.iframe)
				this.iframe = this._insertDOM(null, {objType: 'iframe', frameBorder: 0, width: '0px', height: '0px'}, 'insertlast');			
			var uuid = $WI.UUID();
			this.iframe.src = '/api2.0/src/html/back.html?uuid=' + uuid + '|' + str;	
		}	else
			location.href = '#' + str;
		
		//show red preloader
		if(this.preloader) {
			var wh = this._getClientWH();			
			this._isDisplay(this.preloader, true);	
			var w = this._getWidth(this.preloader);
			var xy = this._getScrollXY();
			this._applyConfig(this.preloader, {top: this._fixPx(xy.y), right: this._fixPx(-xy.x)});	
		}
	},
	GetParamValue: function(key) {
		var str = this.GetBrowserURLAnchor();
		var arr = str.split('/');
		for(var i=0;i<arr.length;i = i + 2)
			if(arr[i]==key)
				return arr[i+1];
	},
	GetBrowserURLAnchor: function(fullURL, loc) {	//loc true force to take data from the browser location field	
		if(loc) {
			var separator = '#';
			var fullURL = document.location.href;
		} else {
			if(this._isIE()) var separator = '|'; else  var separator = '#';
			if(!fullURL) var fullURL = (this._isIE()&&this.iframe)?this._getDoc().title:document.location.href;		
		}		
		if(fullURL.indexOf(separator)==-1) return '';
		return fullURL.substring(fullURL.indexOf(separator)+1, fullURL.length);	
	},	
	RemoveKey: function(key){
		var str = this.GetBrowserURLAnchor();
		str = this._removeKey(str, key);
		$WI.History.Reg(str);	
	},
	RemoveValue: function(key, val) {
		var str = this.GetBrowserURLAnchor();
		var arr = str.split('/');
		for(var i=0;i<arr.length;i = i + 2) {
			if(arr[i]==key) {
				var _arr = arr[i+1].split(',');
				var _num = _arr.Search(val);
				if(_num!=-1) _arr.splice(_num, 1);
				else _arr = [];				
				arr[i+1] = _arr.slice(0);
				break;
			}
		}	
		str = '';
		for(var i=0;i<arr.length;i = i + 2) {
			if(i!=0) str += '/'; 
			str += arr[i] + '/' + arr[i+1];
		}
		$WI.History.Reg(str);	
	},
	_removeKey: function(str, key) {
		var arr = str.split('/');
		var newarr = [];
		if(arr.length==1) arr = [];
		for(var i=0;i<arr.length;i = i + 2)
			if(arr[i]!=key) 
				newarr.splice(newarr.length, 2, arr[i], arr[i+1]);
		
		return this._formStr(newarr);
	}, 
	_replaceValue: function(str, key, val) {
		var arr = str.split('/');
		if(arr.length==1) arr = [];
		var added = false;
		for(var i=0;i<arr.length;i = i + 2) {
			if(arr[i]==key) {
				arr[i+1] = val;
				//var _arr = arr[i+1].split(',');
				//alert(_arr)
				//var _num = _arr.Search(val);				
				//if(_num!=-1) _arr.splice(_num, 1);
				//else _arr = [];				
				//arr[i+1] = _arr.slice();
				added = true;
				break;
			} 
		}	
		//add elements at the end if they are not there yet
		if(!added) 
			arr.splice(arr.length, 2, key, val);

		return this._formStr(arr);
	},  
	_formStr: function(arr) {
		str = '';
		for(var i=0;i<arr.length;i = i + 2) {
			if(i!=0) str += '/'; 
			str += arr[i] + '/' + arr[i+1];
		}
		return str;
	},
	_go: function(sURL) {		
		if(this._isIE())
			location.href = '#' + escape(sURL);
		var aUrl = sURL.split('/');		
		this.prev = sURL;			
		
		this.options._construct.History(sURL, aUrl);
	},
	_getDoc: function() {
		if(!this.iframe) return document;
		if (this.iframe.contentDocument)  
      return this.iframe.contentDocument;
    else
      return this.iframe.contentWindow.document;			
  },
	_handleLinks: function() {
		this._handleLinksLoop(D.getElementsByTagName('a'));
		this._handleLinksLoop(D.getElementsByTagName('div'));
	},
	_handleLinksLoop: function(children) {
		var len = children.length;		
		var rexp = /(#wi\/)([A-z/\d\/\-_]*)/gi;	
		var _link = '';		
		
		for(var i=0;i<len;i++) {			
			if(children[i].tagName.toLowerCase()=='a') _link = children[i].href;
			else _link = children[i].onclick;
				
			if(!_link) continue;
			if(result = new RegExp(rexp).exec(_link)) {
				if(result.length==3) { 
					
					if(children[i].tagName.toLowerCase()=='a')
						children[i].href = "javascript:$WI.Go('" + result[2] + "')";		
					//else
						//if(children[i].className=='turnit-stock-clip-thumb cdc')$WI.trace(result[2]);
						//this.AddEvent({obj: children[i], type: 'click', onevent: function(){alert(param);$WI.History.Reg(param)}.Apply(this, [result[2]])});
						//children[i].onclick = "$WI.History.Reg('" + result[2] + "')";		
						
						//children[i].onclick = alert('ff')
				}
			}
		}
	}
});
$WI.History = new $WI.Class.History();
$WI.Go = function(str){$WI.History.Reg(str);};