/***********************************************************
* SYSTEM CLASS version 2.0
*	Must be included everytime
*	Designed & developed by Dima Svirid, 2007	- 2010
*	Class: system2.0.js
************************************************************/
var $WI = {
	Class: function(cls) {
		var F = function(){};		
				F.prototype = cls;
				if($WI.Class.DOM) F = $WI.extend(F, $WI.Class.DOM);
		return F;
	},	
	CFG: {},						//configuration container
	REG: {Buttons: {}},	//system registry
	Method: {},
	Object: {},	
	Variables: {},
	init: function() {
		D = document;
		this.DOM = new $WI.Class.DOM;
		this.Event = this.DOM;
		this.KeyEvent = {};
		//Initialize onDOMLoad event
		this.Event._initLoadDOM();
		//Initialize keypress handler
		this.Event.AddEvent({obj: D, type: (this.DOM._isiTouch()) ? 'gesturestart' : 'keydown', onevent: this.Event._keyEvent});
		this.Event.AddEvent({obj: D, type: (this.DOM._isiTouch()) ? 'gestureend' : 'keyup', onevent: this.Event._keyEvent});				
		//FIX IE6 BUG
		if(this.DOM._isIE6())
			try	{document.execCommand("BackgroundImageCache", false, true);} catch(e){}
	},
	trace: function(message) { 
		if(!$WI.Class.Logger)
			$WI.DOM.LoadJS({src: '/api2.0/src/javascript/trace.js', include_once: true, onload: function(){this.trace(message)}.Apply(this)});
		else {
			if(!this.REG._LOGGER)	
				this.REG._LOGGER = new $WI.Class.Logger().Create();
			this.REG._LOGGER.Write(message);
		}		
	},
	extend: function(subClass, superClass) {	
		if(subClass==superClass) return subClass;
		for (var i in superClass.prototype) subClass.prototype[i] = superClass.prototype[i];
		//subClass.prototype.superClass = superClass.prototype;
	  return subClass;
	},
	_extend: function(subClass, overrides) {
		for(var i in overrides)
			subClass.prototype[i] = overrides[i];
	},
	_append: function(main, overrides, overwrite) {
		for(var i in overrides)
			if(overwrite==undefined||overwrite===true||!main[i])
				main[i] = overrides[i];
	}
};

var $E = function(V) {
  var results = [], element;
  for (var i = 0; i < arguments.length; i++) {
    element = arguments[i];
    if (typeof element == 'string')
      element = D.getElementById(element);
    results.push(element);
  }
  if(results.length>1) return results;
	else return results[0];
};
var $V = function(element, val) {
 		element = $E(element);
		if(!element) return '';
		//Read form element value
		if($WI.Method.Form && (/input|textarea|button|select|radio|checkbox/i).test(element.tagName)) {
			var method = element.tagName.toLowerCase();							
			if($WI.Check(val, false) !== false) {	
				$WI.Method.Form[method](element, val);				
			} else {	    	    	
				var parameter = $WI.Method.Form[method](element);
	    	if (parameter) return parameter[1];
			}
		} else { //Read DOM element value
			if(val) element.innerHTML = val;
			else return element.innerHTML;
		}
};

/*********************************************************
*		PROTOTYPING RESERVED JAVASCRIPT CLASSES
*********************************************************/
$WI._extend(Array, {
	InArray: function(value, key, noteq) {
		var num = this.Search(value, key, noteq);				
		return (num == -1) ? false: true;
	},	
	Search: function(value, key, noteq) {
		for (var i=0; i < this.length; i++) {			
			if (!key && this[i] == value && (!noteq || noteq != this[i]))
				return i;
			else if (key && this[i][key] && this[i][key] == value && (!noteq || noteq != this[i]))
				return i;
		}
		return -1;
	},
	Remove: function(value, key, noteq) {
		var num = this.Search(value, key, noteq);
		if(num!=-1) this.splice(num, 1);				
	},
	_isArray: function() {
		return true;
	}
});
$WI._extend(Function, {
	Apply: function() {		
		var obj = this;var args = arguments;	
		var F = function() {			
			return obj.apply(args[0], (args[1]) ? args[1] : []);//added [1] not to pass main object
  	};
		F.__Function = this;
		return F;		
	}
});
$WI._extend(String, {
	InList: function(val, del) {
		var arr = this.split((del)?del:',');
		return arr.InArray(val);
	},
	SearchList: function(val, separator) {
		var arr = this.split((del)?del:',');
		return arr.Search(val);
	},
	Trim: function() {
		return this.replace(/^\s+|\s+$/g,"");
  },
	parseInt: function() {
		return (isNaN(parseInt(this))) ? 0 : parseInt(this);
	}	
});
//extend the window HTMLCanvasElement element
if(window.HTMLCanvasElement) {
	$WI.Method.cloneNode = HTMLCanvasElement.prototype.cloneNode;
	$WI._extend(HTMLCanvasElement, {
		cloneNode: function(deep) {		
			var copy = $WI.Method.cloneNode.call(this, deep);
			var copy_ctx = copy.getContext("2d");
			copy_ctx.drawImage(this, 0, 0, this.width, this.height);
			return copy;
		}
	});
}
/*********************************************************
*		VARIABLES
*********************************************************/
$WI.Variables.VARS = {	
	Attr: function(tag) {	
		var tags = /^(?:id|class|cellSpacing|cellPadding|onmouseover|onmouseout|src|type|frameBorder|onload|name|href|rel|media|alt|value|align|vAlign|colSpan|rowSpan|action|method|target|size|rows|cols)$/i;
		return tags.test(tag);
	},
	EmptyConfig: function(tag) {	
		var tags = /^(?:objType|objClass|objWin|objDoc|html|content|type|config|mandatory)$/i;
		return tags.test(tag);
	},
	DOMEvents: function(ev) {	
		var domevents = /^(?:submit|change|select|mousewheel|DOMMouseScroll|mouseup|mousedown|mousemove|click|dblclick|mouseover|mouseout|keypress|keyup|keydown|scroll|resize|load|unload|focus|blur|error|contextmenu|touchstart|touchmove|touchend|touchcancel|gesturestart|gesturechange|gestureend|webkitTransitionEnd|DOMSubtreeModified|orientationchange)$/i;
		return domevents.test(ev);
	}
};

/*********************************************************
*		DOM CLASS
*********************************************************/
$WI.Class.DOM = new $WI.Class({
	LoadJS: function(options){		
		var _func;if(!options) return;
		if(!options.objDoc) options.objDoc = D;
		var assignTo = options.objDoc.getElementsByTagName('head')[0];		
		//check if current script is not included yet
		if(options.include_once) {
			var children = assignTo.getElementsByTagName('script');
			for(var c=0;c<children.length;c++)
				if(children[c].src) 					
					if(children[c].src.match(options.src)||options.src.match(children[c].src)) {
						if(options.onload)
							setTimeout(options.onload.Apply(this), 10);	
						return false;			
					}	
		}	
		var _jslib = this._insertDOM(null, {objDoc: options.objDoc, objType: 'script', type: 'text/javascript', src: options.src});			
		//init class when done		
		if(options.Class) 	
			_func = new Function("e", "var ___temp = new $WI.Class." + options.Class + "();___temp.__construct();");				
		else if(options.onload)
			_func = options.onload;
  		
		if(_func) 
			if(this._isSafari2())	//safari 2 fix
				setTimeout(function(){_func}.Apply(this), 2000);
			else
				this.AddEvent({obj: _jslib, type: 'load', onevent: _func});	
				
		//fixing bug in Opera first assign event then append node to the head
		assignTo.appendChild(_jslib);		
		return _jslib;
	},
	LoadCSS: function(options){		
		if(!options) return;if(!options.objDoc) options.objDoc = D;		
		var assignTo = options.objDoc.getElementsByTagName('head')[0];
		//check if current css is not included yet
		if(options.include_once) {
			var children = assignTo.getElementsByTagName('link');
			for(var c=0;c<children.length;c++)
				if(children[c].href)
					if(children[c].href.match(options.href)||options.href.match(children[c].href)) {
						if(options.onload)
							setTimeout(options.onload.Apply(this), 100);	
						return false;			
					}		
		}			
		var _csslib = this._insertDOM(options.objDoc.getElementsByTagName('head')[0], {objDoc: options.objDoc, objType: 'link', type: 'text/css', href: options.href, media: 'screen', rel: 'stylesheet'}, 'insertinto');			
		if(options.onload) setTimeout(options.onload.Apply(this), 10);
		return _csslib;
	},
	PreloadJSLibraries: function(options) {	
		if(options.libs.length==0) {if(options.onComplete) options.onComplete.call(); return;};
		if(!options.start) options.start = 1;	else options.start++;		 
		if(options.libs.length==options.start){if(options.onComplete)options.onComplete.call();}
		else this.LoadJS({src: options.libs[options.start-1], include_once: true, onload: function(){this.PreloadJSLibraries(options)}.Apply(this)});		
	},
	/*
		@Name: _build
		@Description: Build a tree of html dom elements and insert it into the document
		@Param: (DOMElement) el - container DOM object
		@Param: (Array) doms - array of data to create new DOM objects, see usage
		@Return: (DOMElement) container DOM object, with added properties to refer to new elements

		~Usage~
		The first parameter is the container DOM element. This sets the initial DOM object that new elements will be inserted into.
		The second parameter defines new DOM objects to create and insert into the document.
		
		Each created element can be assigned a reference name.
		The reference name can be used to refer back to this element later in the builder.
		Also, the created element will be available as a property of the container DOM object, property name = reference name.

		Each created element can be inserted using an insert-type string as in _insertDOM().
		In this case, the new element is inserted relative to the last element created by the builder;
		or the container element, if the builder has not created any elements yet.

		Alternatively, a created element can be inserted into another element from the builder, by specifying the parent element's builder reference name.
		The reference name 'root' always refers to the container element.
		
		Each array element in the second parameter can be:
			[config, insertmethod] - create new element and insert into current container object
				Example: [{objType: 'div', html: 'hello'}, 'insertinto']
			[config] - create new element and insert into current container object (insert method 'insertinto')
				Example: [{objType: 'div', html: 'hello'}]
			[setreference] - assign a reference name to the next element
			  Example: ['mydiv'], [{objType: 'div', html: 'hello'}, 'insertinto']
			[config, reference] - create new element and insert into another element (insert method 'insertinto')
			  Example: [{objType: 'div', html: 'world!'}, 'mydiv']
			[config, reference, insertmethod] - create new element and insert into another element
			  Example: [{objType: 'div', html: 'world!'}, 'mydiv']
		
		By defining reference names, you can create complex nested element trees in a single builder call.
		Note that reference name is used as property name in the container element.
		It does *not* set any attribute or property inside the created element (i.e. it is not used as the html 'name' or 'id' attribute).
	*/
	_build: function(el, doms) {
		var newel = el = (!el) ? {} : el;
		for(var i=0;i<doms.length;i++) {
			var parentel = newel;
			var insertmode = 'insertinto';
			var setname = null;
			if ($WI.IsScalar(doms[i]) || (doms[i].length == 1 && $WI.IsScalar(doms[i][0]))) {
				setname = doms[i];
				i++;
			}
			if (doms[i].length > 1) {
				if (doms[i][1] == 'root')
					parentel = el;
				else if (el[doms[i][1]])
					parentel = el[doms[i][1]];
				else if ((/insertinto|insertafter|insertfirst|insertlast|insertbefore|moveto|replaceAppend|replace|insertHTML/i).test(doms[i][1]))
					insertmode = doms[i][1];
				if (doms[i].length > 2)
					insertmode = doms[i][2];
			}
			newel = this._insertDOM((parentel.tagName) ? parentel : null, doms[i][0], (parentel.tagName) ? insertmode : null); 			
			if (setname) {
				el[setname] = newel;
				if (newel.tagName.toLowerCase()=='table') {
					el[setname+'.tbody'] = newel.tbody;
					el[setname+'.tr'] = newel.tr;
				}
			}
		}				
		return el;		
	},	
	_insertDOM: function(el, options, where, returnElement) {
		var newNode;
		if(el&&$E(el))el = $E(el);	
		else {
			if(options&&options.objDoc) el = options.objDoc.body;	
			else el = document.body;	
		}
		if(options&&options.newNode) newNode = options.newNode;
		else if(options&&typeof options=='object') newNode = this._createDOM(options);	
		else newNode = this.obj;
		if(!where) return returnElement?$E(newNode):newNode;
		if(!newNode._construct)newNode._construct = this;
		switch(where)	{
			case 'insertafter':
				el.parentNode.insertBefore(newNode, el.nextSibling);
				break;		
			case 'insertfirst':
				el.insertBefore(newNode, el.firstChild);
				break;	
			case 'insertlast':
				el.appendChild(newNode, el.lastChild);
				break;	
			case 'insertbefore':
				el.parentNode.insertBefore(newNode, el);
				break;	
			case 'insertinto':
				el.appendChild(newNode);				
				break;	
			case 'moveto':					
			case 'replaceAppend':
				el.parentNode.replaceChild(newNode, el);
				newNode.appendChild(el);
				break;
			case 'replace':
				el.parentNode.replaceChild(newNode, el);
				break;
			case 'insertHTML':
				el.innerHTML = options;
				break;	
		}		
		return returnElement?$E(newNode):newNode;
	},
	_createDOM: function(options, parentNode) {		
		if(options.objDoc) var doc = options.objDoc;
		else  var doc = D;

		//fix for IE
		if(this._isIE() && !this._isIE9()) {
			var __string = "<" + options.objType;if(options.type)__string +=  " type='" + options.type + "'";if(options.name)__string +=  " name='" + options.name + "'";__string +=  ">";
			var el = doc.createElement(__string);
			delete options.type;delete options.name;if(options.config)delete options.config.type;
		}
		else 
			var el = doc.createElement(options.objType);
		
		
		//addons for table
		if(options.objType=='table') {			
			el.appendChild(el.tbody = doc.createElement('tbody'));
			el.tbody.appendChild(el.tr = doc.createElement('tr'));			
		//fix for IE LEGEND element, 
		} else if(options.objType=='fieldset'&&this._isIE()) {
			el.style.marginTop = this._fixPx($WI.Check(this._getStyleInt(el, 'marginTop'), 0));
			//el.style.marginBottom = this._fixPx($WI.Check(this._getStyleInt(el, 'marginBottom'), 0));			
		} else if(options.objType=='legend'&&this._isIE()) {
			el.style.paddingBottom = this._fixPx(9);	
		} else if(options.objType=='canvas' && options.src) {					
			el.context = el.getContext("2d");var img = new Image();img.src = options.src;delete options.src;
			this.AddEvent({obj: img, type: 'load', onevent: function(event, _target, obj) {
				el.width = obj.width;el.height = obj.height;el.ratio = obj.width/obj.height;	//el.ratio = obj.width/obj.height;				
				el.context.drawImage(obj, 0, 0);
				this.Fire(null, 'load', el);
			}});			
		} 
		
		this._applyConfig(el, options);
		
		//insert HTML
  	if(options.html) el.innerHTML = options.html;
		//insert text
		else if(options.text)	el.appendChild(document.createTextNode(options.text));
		//insert legend into fieldset
		else if(options.legend)	this._insertDOM(el, {objType: 'legend', html: options.legend}, 'insertinto');
	
		if(parentNode) parentNode.appendChild(el);			
		return el;
	},	
	_removeDOM: function(el) {	
		if(el&&typeof el=='string') var el = $E(el);	
		if(el&&el.parentNode) el.parentNode.removeChild(el);
	},	
	_appendHTML: function(el, html) {	
		var	fragObj = document.createElement('span');fragObj.innerHTML = '<font style=\'display:none\'>&nbsp;</font>' + html;
		return el.appendChild(fragObj);			
	},	
	_innerHTML: function(el, content){
		if (document.all) el.innerHTML = content;
		else {		
			var rng = document.createRange();rng.setStartBefore(el);		
			var htmlFrag = rng.createContextualFragment(content);
			while (el.hasChildNodes()) el.removeChild(el.lastChild);
			el.appendChild(htmlFrag);
		}
	},
	/* Working with classes	*/
	_hasClass: function(el, Cls) {		
		var re = new RegExp('(?:^|\\s+)' + Cls + '(?:\\s+|$)');
		return (el && el['className']) ? re.test(el['className']) : false;
	},	
	_addClass: function(el, Cls) {		
		if(el&&el.tagName&&!this._hasClass(el, Cls)) el.className = el.className + ' ' + Cls;
	},		
	_removeClass: function(el, Cls) {		
		if(!el||!el.className) return;
		var cl = el.className.split(' ');
		var test = cl.Search(Cls);
		cl.splice(test, 1);
		if(test!=-1) el.className = cl.toString().replace(/,/g, ' ');
	},
	/* Element visibility	*/	
	_display: function(el, mode) {
		if(typeof el == 'string') var el = $E(el);if(!el) return;
		//just return the status
		if(mode!==false&&mode!==true) {
			if(this._getStyle(el,'display')=='none'||this._getStyle(el,'visible')=='hidden') return false;
			else return true;		
		}
		//set display propety to element
		if(mode&&this._getStyle(el,'display')=='none') {var _css = 'block';
			if(this._isIE()) var _css = 'block';
			else var _css = (el.tagName.toUpperCase()=='TABLE')?'table':(el.tagName.toUpperCase()=='TR')?'table-row':(el.tagName.toUpperCase()=='TD')?'table-cell':'block';				
		this._setStyle(el, 'display', _css);
		} 
		else if(!mode&&this._getStyle(el,'display')!='none') this._setStyle(el, 'display', 'none');		
	},
	_visible: function(el, mode) {	
		if(typeof el == 'string') var el = $E(el);if(!el) return;
		//return just the status
		if(mode!==false&&mode!==true) {
			if(this._display(el)==false||this._getStyle(el,'visibility')=='none'||this._getStyle(el,'visibility')=='hidden') return false;
			else return true;	
		}		
		this._visibility(el, mode);
		this._display(el, mode);
	},
	_visibility: function(el, mode) {	
		if(typeof el == 'string') var el = $E(el);if(!el) return;
		//return just the status
		if(mode!==false&&mode!==true) {
			if(this._getStyle(el,'visibility')=='none'||this._getStyle(el,'visible')=='hidden') return false;
			else return true;	
		}		
		//lets fully hide an item
		if(mode&&this._getStyle(el,'visibility')=='hidden') this._setStyle(el, 'visibility', 'visible');
		else if(!mode&&this._getStyle(el,'visibility')!='hidden') this._setStyle(el, 'visibility', 'hidden');	
	},	
	/*	Method is depricated	*/	
	_isDisplay: function(el, mode) {	
		this._display(el, mode);	
	},	
	_maxZ: function(el) {			
		if(!el&&this.obj) var el = this.obj;
		else if(!el&&!this.obj) return false;
		var doc = (el.parentNode) ? el.parentNode.childNodes : 0;
		var maxZ = this._getStyleInt(el, 'zIndex'), _maxZ = 1;
		if(!$WI.IsNumeric(maxZ)) maxZ = 1;		
		var totalel = parseInt(doc.length);		
		for (var i = 0; i < totalel; i++){
		   if(doc[i].nodeType!=1) continue;
			 _maxZ = this._getStyleInt(doc[i], 'zIndex');
			 if($WI.IsNumeric(_maxZ)) 
			 	 maxZ = Math.max(maxZ, _maxZ); 
		}		
		this._setStyle(el, 'zIndex', maxZ+3);
	},
	_centerObject: function(obj, options) {
		var display = this._getClientWH();
		if(obj) {
			var w = this._getWidth(obj);
			var h = this._getHeight(obj);			
		} else {
			var w = (options.width) ? parseInt(options.width) : 0;
			var h = (options.height) ? parseInt(options.height) : 0;
		}
		var xy = this._getScrollXY();
		var _left = (display.w - w) / 2;
		var _top = (display.h - h) / 2;
		if(_left<0) _left = 0;
		if(_top<0) _top = 0;		
		
		_top += xy.y;
		_left += xy.x;
		
		if(obj)
			this._applyConfig(obj, {left: this._fixPx(_left), top: this._fixPx(_top)});
		else		
			return {top: _top, left: _left};
	},
	_convertP$Px: function(p$, total) {
		return parseInt(parseInt(p$)*parseInt(total)/100);
	},
	_fixPx: function(data) {
		try{
			var _data = parseInt(data);
			if(isNaN(_data)) return null;
			else return parseInt(data) + 'px';
		} catch (err) {
			return null;
		}
	},
	_fixP$: function(data) {
		if(typeof data=='object'&&data.length>0){
			for(var i=0;i<data.length;i++)data[i]=parseInt(data[i]) + '%';
			return data.toString().replace(/,/g,' ');
		}
		else return parseInt(data) + '%';
	},	
	_fixTxt: function(str, len){
		return (str&&str.length>len)?(str.substring(0,len) + '..'):str;
	},
	_toCamelCase: function (sInput, bFirstCap) {
		var oStringList = sInput.split('-');
    if(oStringList.length == 1)   
    	return (bFirstCap) ? (oStringList[0].charAt(0).toUpperCase() + oStringList[0].substring(1)) : oStringList[0];
    var ret = sInput.indexOf("-") == 0 ?
       oStringList[0].charAt(0).toUpperCase() + oStringList[0].substring(1) : oStringList[0];
		for(var i = 1, len = oStringList.length; i < len; i++){
        var s = oStringList[i];
        ret += s.charAt(0).toUpperCase() + s.substring(1);
    }
    return (bFirstCap) ? (ret.charAt(0).toUpperCase() + ret.substring(1)) : ret;
	},	
	_entityDecode: function(str) {
		try{
			var q = str.toString();
			q = q.replace(/&lt;/ig, '<').replace(/&gt;/ig, '>');
			var rexp = /&#[0123456789]*;/g;
			while(rexp.exec(q)) 
				q = q.replace(new RegExp(rexp), String.fromCharCode(RegExp.lastMatch.replace(/&#/g,'').replace(/;/g,'')));
			return q;
		}catch(err){return str;}
  },	
	_resizeDOM: function(el, options) {
		if(!el) var el = this.obj;
		el._previousWidth = this._getWidth();
		el._previousHeight = this._getHeight();		
		this._applyConfig(el, options);
	},
	
		
	_getWidth: function(el) {	
		return (!el) ? 0 : ((el.clientWidth) ? parseInt(el.clientWidth) : parseInt(el.offsetWidth));
	},
	_getHeight: function(el) {
		return (!el) ? 0 : ((el.clientHeight) ? parseInt(el.clientHeight) : parseInt(el.offsetHeight));
	},	
	_getXY: function(el, relative)	{
		if(!el||el.parentNode === null||el.offsetParent === null||this._getStyle(el, 'display')=='none')
			return false;
		var parentNode = null;
		var pos = [];
		var box;
		pos = [el.offsetLeft, el.offsetTop];
		parentNode = el.offsetParent;		

		if(parentNode!= el&&!relative) {		
			while(parentNode) {
				pos[0] += parentNode.offsetLeft;
				pos[1] += parentNode.offsetTop;
				parentNode = parentNode.offsetParent;
			}
		}		
		//depricated by Dima, while working with custom select box
		//if(this._getStyle(el,'position')!='absolute') {
			//pos[0] -= document.body.offsetLeft;
			//pos[1] -= document.body.offsetTop;
		//}
		if(el.parentNode) parentNode = el.parentNode;
		else parentNode = null;
		
		while(parentNode&&!relative&&parentNode.tagName.toUpperCase()!='BODY'&&parentNode.tagName.toUpperCase()!='HTML')	{		
			if(this._getStyle(parentNode, 'display') != 'inline')	{
				pos[0] -= parentNode.scrollLeft;
				pos[1] -= parentNode.scrollTop;
			}
			if(parentNode.parentNode) parentNode = parentNode.parentNode;
			else parentNode = null;
		}
		return {x: pos[0], y: pos[1]};
	},
	_getMouseXY: function(event){
		var event = event || window.event;
		var xy = this._getScrollXY();
		if(event.pageX || event.pageY)
			return {x:event.pageX, y:event.pageY};
		return {
			x:event.clientX + xy.x - document.body.clientLeft,
			y:event.clientY + xy.y  - document.body.clientTop
		}
	},
	_getScreenWH: function() {
		return {w: screen.width, h: screen.height};
	},
	_getClientWH: function() {
			var w = (window.innerWidth!=null) ? window.innerWidth : (document.documentElement&&document.documentElement.clientWidth) ? document.documentElement.clientWidth : (document.body!=null) ? document.body.clientWidth:null;
			var h = (window.innerHeight!=null)? window.innerHeight : (document.documentElement&&document.documentElement.clientHeight) ? document.documentElement.clientHeight:(document.body!= null)?document.body.clientHeight:null;
		return {w: w, h: h};
	},
	_getScrollXY: function(el){
		if(!el||!$E(el)) {
			return {x: (typeof(window.pageXOffset)=='number')?window.pageXOffset:(document.documentElement.scrollLeft)?document.documentElement.scrollLeft:document.body.scrollLeft, y: (typeof(window.pageYOffset)=='number')?window.pageYOffset:(document.documentElement.scrollTop)?document.documentElement.scrollTop:document.body.scrollTop};
		} else  
			return {x: el.scrollLeft, y: el.scrollTop};
	},
	_getPageWH: function(){		
		var xScroll, yScroll, windowWidth, windowHeight;
		if (window.innerHeight && window.scrollMaxY) {	
			xScroll = window.innerWidth + window.scrollMaxX;
			yScroll = window.innerHeight + window.scrollMaxY;
		} else if (D.body.scrollHeight > D.body.offsetHeight){
			xScroll = D.body.scrollWidth;
			yScroll = D.body.scrollHeight;
		} else if (D.documentElement && D.documentElement.scrollHeight > D.body.offsetHeight){
			xScroll = D.documentElement.scrollWidth;
			yScroll = D.documentElement.scrollHeight;
		} else {
			xScroll = D.body.offsetWidth;
			yScroll = D.body.offsetHeight;
		}			
		if (self.innerHeight) {
			if(D.documentElement.clientWidth){
				windowWidth = D.documentElement.clientWidth; 
			} else {
				windowWidth = self.innerWidth;
			}
			windowHeight = self.innerHeight;
		} else if (D.documentElement && D.documentElement.clientHeight) {
			windowWidth = D.documentElement.clientWidth;
			windowHeight = D.documentElement.clientHeight;
		} else if (document.body) {
			windowWidth = D.body.clientWidth;
			windowHeight = D.body.clientHeight;
		}	
		if(yScroll < windowHeight)pageHeight = windowHeight;
		else pageHeight = yScroll;
		if(xScroll < windowWidth)pageWidth = xScroll;		
		else pageWidth = windowWidth;
		return {pageW: pageWidth, pageH: pageHeight, winW: windowWidth, winH: windowHeight};
	},
	_getStyleInt: function(el, st, doc) {
		if(!el) var el = this.obj;		
		var valret = parseInt(this._getStyle(el, st, doc));
		return isNaN(valret)?0:valret;
	},
	_getStyle: function(el, property, doc) {
		var val = null;
		var doc;
		if(!doc) doc = document;
		if(doc.defaultView&&doc.defaultView.getComputedStyle) 
			try{
				val = doc.defaultView.getComputedStyle(el, null)[property];
			} catch(err) {
				return el.style[property];
			}
		else if(el.currentStyle)
			val = el.currentStyle[property];
		if(el.style&&(!val||val==''))
			val = el.style[property];		
		if(typeof val == 'string') try{val = val.replace(/\'/g, "").replace(/\"/g, "");} catch(e){}
		if (/^(?:background-position|backgroundPosition)$/i.test(property)) {					
			val = val.split(' ');				
			for(var i=0;i<val.length;i++)val[i] = parseInt(val[i]); 
				return val;
		}
		else
			return val;
	},	
	_getAttributes: function(where) {
		var attrlen = where.attributes.length;var attribs = [];var aname;
		if(attrlen>0)
			for(var a=0; a<attrlen; a++) {
				aname = where.attributes[a].name;
				if(this._getAttribute(where, aname))
					attribs[aname] = this._getAttribute(where, aname);
			} 
		return attribs;
	},
	_getAttribute: function(where, attr) {
		var attrnode = where.attributes.getNamedItem(attr);
		return (attrnode) ? attrnode.value : false;
	},
	_getParent: function(el, options) {
		options.__single = true;
		var __parent = this._getParents(el, options);
		return (__parent.length==0&&options.ifnull) ? options.ifnull : ((__parent.length==0) ? null : __parent);
	},	
	_getParents: function(el, options) {
		var parents = [];if(!options) var options = {};
		for(var i = el; i; i = i.parentNode) {		
			if(i.nodeType != 1 || el==i) continue;	
			if(i.tagName.toUpperCase()=='BODY')	break;		
			if(	options.byClassName&&(!options.exact&&this._hasClass(i, options.byClassName)||options.exact&&i.className==options.byClassName) ||
					options.byTagName&&i.tagName.toLowerCase()==options.byTagName.toLowerCase()  ||
					options.byObject&&i==options.byObject || 
					options.byEventType&&this.EventTypeExists(i, options.byEventType) || 
					(!options.byClassName&&!options.byTagName&&!options.byObject&&!options.byEventType)					
			) parents.unshift(i);			
			if(options.__single&&parents.length>=1) return parents[0];//return if _getParent called
		}		
		return (parents.length==0&&options.ifnull) ? options.ifnull : parents;		
	},	
	_getChildren: function(el, options)	{
		var i, a = [];if(!options) var options = {};
		for(i = el.firstChild; i; i = i.nextSibling) {
			if(i.nodeType != 1) continue;	
			if(	options.byClassName&&this._hasClass(i, options.byClassName) ||
					options.byTagName&&i.tagName.toLowerCase()==options.byTagName.toLowerCase() ||
					options.byObject&&i==options.byObject || 
					options.byEventType&&this.EventTypeExists(i, options.byEventType) ||
					(!options.byClassName&&!options.byTagName&&!options.byObject&&!options.byEventType)						
			) a[a.length] = i;
		}	
		return a;
	},
	_getDescendents: function(el, options, a)	{
		if(!a) var a = []; if(!options) var options = {}; var el = $E(el); if(!el) return [];			
		if(	options.byClassName&&this._hasClass(el, options.byClassName) ||
				options.byTagName&&el.tagName.toLowerCase()==options.byTagName.toLowerCase() ||
				options.byObject&&i==options.byObject || 
				options.byEventType&&this.EventTypeExists(i, options.byEventType) ||
				(!options.byClassName&&!options.byTagName&&!options.byObject&&!options.byEventType)						
			)	a.push(el);		
		var children = el.childNodes;
		for(var i = 0; i < children.length; i++) a.concat(this._getDescendents(children[i], options, a));
		return a;
	},	
	_getTarget: function(event) {
		if(!event) return null;
		var t = event.target || event.srcElement;		
		return this._resolveTextNode(t);
	},
	_resolveTextNode: function(node) {
		if(node&&node.nodeType==3) return node.parentNode;
		else return node;
	},
	_applyConfig: function(el, options) {
		var matches;
		for(var attr in options) {			
			//disregard all the undefined urls for the backgrounds
			if(!options[attr]||attr=='backgroundImage'&&(/undefined/).test(options[attr])) continue;
			
			if(attr=='objClass')	{
				if(!this._isIE6()) options['objClass'] = options['objClass'].replace(/png/, ''); 
				el.className = options['objClass'];
			}
			else if(attr=='config')
				this._applyConfig(el, options[attr]);
			else if(attr=='event') {
				for (var k in options[attr])
					this.AddEvent({obj: el, type: k, onevent: options[attr][k]});
			}
			else if(attr=='onerror')
				el.onerror = options[attr];
			else if(attr=='onload')
				this.AddEvent({obj: el, type: 'load', onevent: options[attr]});
			else if(this._isIE() && !this._isIE7() && attr == 'backgroundImage' && (/.png/).test(options[attr])) {
				options[attr] = options[attr].replace(/url\(/, '').replace(/\)/, '').replace(/;/, '');
				el.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + options[attr] + "', sizingMethod='scale')";
			}
			else if(attr=='value') el.value = this._entityDecode(options[attr]); //run to decode entity for the forms
			else if($WI.Variables.VARS.Attr(attr)) el.setAttribute(attr, options[attr]);			
			else if(!$WI.Variables.VARS.EmptyConfig(attr)) this._setStyle(el, attr, options[attr]);	
		}	
	},
	_setStyle: function(el, property, val) {	
		if(!el) return;
		if(this._isIE()) {
			switch(property) {
				case 'scrollTop' :
				case 'scrollLeft' :
				el[property] = parseInt(val);
				break;
				case 'opacity' :
				if(typeof el.style.filter == 'string') {
					el.style.filter = 'alpha(opacity=' + val * 100 + ')';
					el.style.zoom = 1;
					el.style.opacity =val;
				}
				break;				
				default:
					el.style[property] = val;
				}	
			}	else {		
			//Fix an issue if object is inside the scollable div, only for PX
			if((property=='left'||property=='top')&&val.type=='string'&&val.indexOf('%')==-1)
				this._setScrollStyle(el, property, val);
			else if(property=='scrollTop'||property=='scrollLeft')
				el[property] = parseInt(val);
			else
				el.style[property] = val;
		}
	},
	_setScrollStyle: function(el, property, val) {				
		var val = parseInt(val);
		//calculate properly if div scrolled
		if(property=='left'||property=='top') {
			var parentNode;
			if(el.parentNode) parentNode = el.parentNode;
			else parentNode = null;					
			while(parentNode&&parentNode.tagName.toUpperCase()!='BODY'&&parentNode.tagName.toUpperCase()!='HTML')	{		
				if(this._getStyle(parentNode, 'display') != 'inline')	{
					switch(property) {
						case 'left':
						val += parentNode.scrollLeft;						
						break;	
						case 'top':
						val += parentNode.scrollTop;
						break;		
					}
				}
			if(parentNode.parentNode) parentNode = parentNode.parentNode;
			else parentNode = null;
			}			
			el.style[property] = this._fixPx(val);
		}		
	},	
	_apply: function(to, what) {		
		if($WI.IsArray(to)) 
			for(var i=0;i<to.length;i++) {
				var args = [];for(var j=2;j<arguments.length;j++)args.push(arguments[j]);args.unshift(to[i]);what.apply(this, args);				
				}
	},	
	_pointElements: function(overDiv, options) {
		if(!__elements) var __elements = [];
		var allelements = [];
		//if mouse event has been passed
		if(overDiv && !overDiv.tagName && overDiv.type) {
			var mouseXY = this._getMouseXY(overDiv);
			overDiv.offsetLeft = mouseXY.x;overDiv.offsetTop = mouseXY.y;overDiv.offsetWidth = 1;overDiv.offsetHeight = 1;
		}		
		if(options.byParent) allelements = this._getDescendents(options.byParent);
		else if(options.byTagName)  allelements = document.getElementsByTagName(options.byTagName);	
    else if(options.byElement)  allelements = [options.byElement];	 
		for(var i = 0; i < allelements.length; i++ ) {
			obj = allelements[i];
			if(obj==overDiv) continue;
			//check by the classaname
			if(options.byClassName && !this._hasClass(obj, options.byClassName)) continue;
			//check by tag name
			if(options.byTagName && obj.tagName.toUpperCase() != options.byTagName.toUpperCase()) continue;
			if(!obj || !obj.offsetParent) continue;        
			objLeft   = obj.offsetLeft;
       objTop    = obj.offsetTop;
       objParent = obj.offsetParent;
       while( objParent.tagName.toUpperCase() != "BODY" ) {
         objLeft  += objParent.offsetLeft;
         objTop   += objParent.offsetTop;
         objParent = objParent.offsetParent;
       }
       objHeight = obj.offsetHeight;
       objWidth = obj.offsetWidth;				
       try {
			 if(( overDiv.offsetLeft + overDiv.offsetWidth ) <= objLeft );
       else if(( overDiv.offsetTop + overDiv.offsetHeight ) <= objTop );
       else if( overDiv.offsetTop >= ( objTop + objHeight ));
       else if( overDiv.offsetLeft >= ( objLeft + objWidth ));
       else __elements.push(obj);		
			 } catch(err) {}		
		}
		return __elements;
  },
	_showElements: function() {
		 if(!this.hiddenElements || this.hiddenElements.length==0) return;
		 for( i = 0; i < this.hiddenElements.length; i++ )
		 	this.hiddenElements[i].style.visibility = "visible";		 
		 delete this.hiddenElements;
	},
	_hideElements: function(tag, overDiv) {
    if(this._isIE6() || tag.toUpperCase() == 'OBJECT') {
			this.hiddenElements = this._pointElements(overDiv, {byTagName: tag});
      for(var i = 0; i < this.hiddenElements.length; i++)
       	obj.style.visibility = "hidden";
    }
  }
});

/*********************************************************
*		Event Manager
*********************************************************/
$WI.Class.EventManager = new $WI.Class({
	AddEvent: function(config) { 
		if(!config||!config.obj||!config.onevent||!config.type) return false;
		var fireEvent = this.Fire;
		if(!config.obj.regEvents) config.obj.regEvents = [];
		if(!config.obj.regEvents[config.type]) config.obj.regEvents[config.type] = [];	
		config._construct = this;
		if(typeof config.onevent == 'function') config._function = config.onevent;
				
		//event is passed as {obj:, fire:, onevent:}
		if(typeof config.onevent == 'object') {			
			//onevent is provided in object call AddEvent recursively
			if(config.onevent.onevent && typeof config.onevent.onevent == 'function') {
				config.__onevent = function(event) {
					fireEvent(event, config.type, (config.onevent.obj) ? config.onevent.obj : config.obj);
				};
				this._addEvent(config);//assign DOM event
			} else if(config.onevent.fire) { //only fire parameters is passed
				config.__onevent = function(event) {
					fireEvent(event, config.onevent.fire, (config.onevent.obj) ? config.onevent.obj : config.obj);
				};	
				
				if($WI.Variables.VARS.DOMEvents(config.type)) {								
					
					this._addEvent(config);//assign DOM event
				} else {
					config._function = config.__onevent;
				}				
			}				
		//event passed as Function	
		} else if(typeof config.onevent == 'function') {				
			if($WI.Variables.VARS.DOMEvents(config.type)) {
				config.__onevent = function(event) {						
					try{var _target = $WI.DOM._getTarget(event);config.onevent.apply(config._construct, [event, _target, config.obj]);} catch(e){}
				};
				this._addEvent(config);//assign DOM event
			}
		}
		//register an event
		config.obj.regEvents[config.type].push(config);		
		return this;		
	},
	RemoveEvent: function(config) { 
		if(!config||!config.obj||!config.obj.regEvents) return false;
		var register = [];var re = config.obj.regEvents;
		//if type of the event is passed and specified function to remove		
		if(config.type && config.onevent) {			
			if(re[config.type]) {
				for(var i=re[config.type].length-1; i >= 0; i--) {
					var ret = re[config.type][i];
					//check the first condition in case of the Apply method
					//alert(ret.onevent.toString() + '|' + config.onevent.toString() + '|' + (ret.onevent.toString() == config.onevent.toString()))
					if((ret.onevent.__Function && config.onevent.__Function && ret.onevent.__Function == config.onevent.__Function.toString()) || 
						 (!ret.onevent.__Function && ret.onevent == config.onevent.toString())) {
						register.push(ret);					
						re[config.type].splice(i, 1);
					}		
				}
			}		
		//if only object passed, remove all the events for obj
		} else if(config.type) {			
			if(re[config.type])
				register = register.concat(re[config.type]);	
			delete re[config.type];
		//if only object passed, remove all the events for obj
		} else {			
			for(var i in re) {
				if(typeof re[i] == 'object') {
					for(var j in re[i]) {						
						if(typeof re[i][j] == 'object') { 
							register.push(re[i][j]);	
						}				 
					}
					delete re[i];
				}	
			}				
		}		
		//remove registered events	
		if(register && register.length > 0)	{			
			for(var e=0;e<register.length;e++) {	
				if(register[e].__onevent && $WI.Variables.VARS.DOMEvents(register[e].type)) { 
					this._removeEvent(config.obj, register[e].type, register[e].__onevent);
				}
			}		
		}
		return true;		
	},
	//_target is optional in case event does not exists
	Fire: function(event, fire, obj, _target) {				
		var event, type, obj, _target = (_target) ? _target : obj;
		if(!event) event = {type: fire};
		else if(typeof event!='string') _target = $WI.DOM._getTarget(event); //find and pass target in case of the event object 			
		event.fire = fire; 
		if(!obj||!obj.regEvents||!obj.regEvents[fire]||obj.regEvents[fire].length==0)
			return false;//no events registered	for the object		
	
		var re = obj.regEvents[fire];
		for(var e=0;e<re.length;e++) {
			if(re[e]&&re[e]._function && typeof re[e]._function == 'function' && re[e]._construct) 
				re[e]._function.apply(re[e]._construct, [event, _target, obj]);
		}			
	},
	EventExists: function(config) {
		var obj = config.obj;
		var type = config.type;
		if(obj&&obj.regEvents&&obj.regEvents[type]&&obj.regEvents[type].length>0)	{
			for(var e=0;e<obj.regEvents[type].length;e++)
				if(obj.regEvents[type][e].onevent&&obj.regEvents[type][e].onevent==config.onevent)
					return true;
		}
		return false;
	},	
	EventTypeExists: function(obj, type) {
		return (obj&&obj.regEvents&&obj.regEvents[type]&&obj.regEvents[type].length>0) ? true: false;			
	},	
	OnLoadDOM: function(func) {		
		$WI.Event.onLoad.push(func);		
	},
	OnLoadPage: function(func) {		
		this._addEvent({obj: window, type: 'load', __onevent: func});	
	},	
	_onLoadDOM: function() {		
		if ($WI.Event.documentLoaded) return;
    if ($WI.Event.interval) window.clearInterval($WI.Event.interval);
    $WI.Event.documentLoaded = true;
		for(var e=0;e<$WI.Event.onLoad.length;e++)
			$WI.Event.onLoad[e].call();
	},		
	_initLoadDOM: function(event) {
		$WI.Event._this = this;
		$WI.Event.onLoad = [];		
		if (document.addEventListener) {
	    if ($WI.DOM._isSafari()) {
	      $WI.Event.interval = window.setInterval(function() {
	        if (/loaded|complete/.test(document.readyState))
	          $WI.Event._onLoadDOM();
	      }, 0);	
	      $WI.Event.AddEvent({obj: window, type: 'load', onevent: $WI.Event._onLoadDOM});	
	    } else {
	      document.addEventListener("DOMContentLoaded", $WI.Event._onLoadDOM, false);
	    }	
	  } else {
	    document.write("<script id=__onPrismDOMLoaded defer src=//:><\/script>");
	    $E("__onPrismDOMLoaded").onreadystatechange = function() {
	      if (this.readyState == "complete") {
	        this.onreadystatechange = null;
	        $WI.Event._onLoadDOM();
	      }
	    };
	  }
	},	
	_addEvent: function(config) {				
		var obj = config.obj;var type = config.type;var fn = config.__onevent;
		//setup specific for IE onload call
		if(type=='load'&&this._isIE()&&obj!=window) { //do not change the way IE loads for 7,8, check LoadJS		
			obj.onreadystatechange = function(event) {				
				if (this.readyState=="complete"||this.readyState=="loaded")
					fn.apply(config._construct, [null, null, obj]);						
			};		
		} else if (obj.attachEvent) {						
			obj['e'+type+fn] = fn; 
			obj[type+fn] = function(){
				var _event = window.event;		
				if(!_event) {
				//event happend in an IFRAME check them
					var element = D.getElementsByTagName("iframe");					
					for (var i=0; i<element.length; i++)						
						if(element[i].contentWindow.event)
							_event = element[i].contentWindow.event;
				}
				obj['e'+type+fn](_event);
			};				
			obj.attachEvent('on'+type, obj[type+fn]); 
	  } else {			
			if(type=='mousewheel'&&!this._isSafari()&&!this._isChrome()) type = 'DOMMouseScroll';
			//if(obj.length&&obj[o]) for(var o=0;o<obj.length;o++) obj[o].addEventListener(type, fn, false);
			obj.addEventListener(type, fn, false);
		}
	},
	_removeEvent: function(obj, type, fn) {		
		try {
			if (obj.detachEvent) { 				
				obj.detachEvent('on'+type, obj[type+fn]); 
		    obj[type+fn] = null; 
		  } else {
				obj.removeEventListener(type, fn, false); 
			}
		} catch(e) {}
	},	

	_cancelEvent: function(event) { 
		if(event.stopPropagation)
			event.stopPropagation();
		else
			event.cancelBubble = true;
		this._preventDefault(event);
	},
	_cancelSelect: function(event, disable, obj) { 	
		//FOR OPERA -o-user-select:none
		if(event) this._preventDefault(event);
		if(!obj) return;
		if(this._isIE() || this._isChrome())
			//(disable)?document.onselectstart = function(){event.returnValue = false;}:document.onselectstart = function(){};
			(disable)?obj.onselectstart=new Function('return false'):obj.onselectstart=new Function('return true');	
		//else if(this._isOpera())
			//(disable)?this._setStyle(obj, 'oUserSelect', 'none'):this._setStyle(obj, 'oUserSelect', '');	
		else if(this._isSafari())
			(disable)?this._setStyle(obj, 'KhtmlUserSelect', 'none'):this._setStyle(obj, 'KhtmlUserSelect', '');			
		else
			(disable)?this._setStyle(obj, 'MozUserSelect', 'none'):this._setStyle(obj, 'MozUserSelect', '');			
	},
	_preventDefault: function(event) { 
		if(event.preventDefault)
			event.preventDefault();
		else
			event.returnValue = false;
	},
	_keyEvent: function(event) { 			
		(window.event)?e=window.event:e=event;		
		switch(event.type) {
			case 'gesturestart':			
			case 'gestureend':
			$WI.REG.Buttons.Gesture = (e.type=='gesturestart')?true:false;				
			break;
			
			default:
				this.Key = (e.keyCode)?e.keyCode:(e.which)?e.which:e.charCode;	
				this.KeyChar = String.fromCharCode(this.Key);
				switch(this.Key) {
					case 13 :	//enter			
					$WI.REG.Buttons.Enter = (e.type=='keydown')?true:false;
					break;
					case 16 :	//shift 
					$WI.REG.Buttons.Shift = (e.type=='keydown')?true:false;
					this._cancelSelect(event, (e.type=='keydown')?true:false);
					break;
					case 17 :	//ctrl 
					$WI.REG.Buttons.Ctrl = (e.type=='keydown')?true:false;
					this._cancelSelect(event, (e.type=='keydown')?true:false);
					break;
					case 18 :	//alt 
					$WI.REG.Buttons.Alt = (e.type=='keydown')?true:false;
					break;
					default:
					break;
				}
			break;			
		}
		this.Fire(event, 'event' + e.type, document);
	},
	_getWheelDelta: function(event){
     //positive if wheel was scrolled up, negative, if wheel was scrolled down.
		 var delta = 0;
     if (!event) event = window.event;     
		 if (event.wheelDelta)  /* IE/Opera */
       delta = event.wheelDelta/120;           
     else if (event.detail)  /* Mozilla */            
        delta = -event.detail/3;      
     return delta;
	}	
});
$WI.extend($WI.Class.DOM, $WI.Class.EventManager);

/*********************************************************
*		SYSTEM HELPFUL STATIC METHODS
*********************************************************/
$WI._append($WI, {	
	IsArray: function(val) {
		if(!val) return false;
		return val._isArray;
	},
	IsObject: function(val) {
		return ((typeof val).toLowerCase() == 'object') ? true : false;
	},
	IsFunc: function(val) {
		return ((typeof val).toLowerCase() == 'function') ? true : false;
	},
	IsBool: function(val) {
		return (val.toString() == 'true' || val.toString() == 'false') ? true : false;
	},
	IsNumeric: function(val) {	 
		return (!val && val !== 0 || isNaN(val * 1)) ? false : true;	 
  },
	IsString: function(val) {
		return ((typeof val).toLowerCase() == 'string') ? true : false;
	},
	IsScalar: function(val) {
		return (!$WI.IsFunc(val) && !$WI.IsObject(val)) ? true : false;
	},
	GetBool: function(val) {
		return ($WI.IsBool(val)) ? val: false;
	},
	IntVal: function(val) {
		return ($WI.IsNumeric(val)) ? parseInt(val) : 0;
	},
	Cursor: function(cursor, options) {
		var doc = D;
		if(options&&options.objDoc) doc = options.objDoc;
		doc.body.style.cursor = (cursor)?cursor:'default';
	},
	Check: function() {
    var val;
    for (var i=0,length=arguments.length;i<length;i++) {
			if(arguments[i]!=undefined) {
				if($WI.IsFunc(arguments[i])) {
					try {val = arguments[i]();break;} catch (e) {}
				} else {
					val = arguments[i];break;
				}
			}
    }
    return val;
  },	
	Random: function(val) {
   if(val!==undefined) return Math.round(val*Math.random());
	 else return Math.round(9999999*Math.random());
  },	
	BrowserTab: function(url) {
		//if(!$WI.DOM._isChrome() || confirm("A new tab is about to be openned, please hold 'Shift' button to ignore Popup blocker!"))	{
			var frm = $WI.DOM._insertDOM(document.body, {objType: 'form', target: '_blank', action: url, method: 'post'}, 'insertinto');
			frm.submit();$WI.DOM._removeDOM(frm);	
		//}
	},
	PopUp: function(url, winname, options) {
		/*	options: status|toolbar|location|menubar|directories|resizable|scrollbars|height|width|top|left  */		
		if(!winname) var winname = "POPUP_" + $WI.Random();
		var mywin = window.open(url, winname, options);	
		if(mywin)	mywin.focus();
		else	alert("Please turn off PopUp Blocker!");
	}
});

/*********************************************************
*		DOM BROWSER HELPFUL STATIC METHODS
*********************************************************/
$WI._extend($WI.Class.DOM, {	
	_isiTouch: function() {		
		return (this._isiPhone()||this._isiPod()||this._isiPad());
	},
	_isiPhone: function() {		
		return (navigator.userAgent.indexOf("iPhone") > -1);
	},
	_isiPod: function() {		
		return (navigator.userAgent.indexOf("iPod") > -1);
	},
	_isiPad: function() {		
		return (navigator.userAgent.indexOf("iPad") > -1);
	},
	_isWebKit: function() {		
		return (navigator.userAgent.indexOf("AppleWebKit") > -1);
	},
	_isIE: function() {		
		return (window.ActiveXObject);
	},
	_isIE6: function() {		
		return (window.ActiveXObject&&!this._isIE7()&&!this._isIE8());
	},
	_isIE7: function() {
		return (navigator.userAgent.toLowerCase().indexOf('msie 7')>-1);
	},
	_isIE8: function() {
		return (navigator.userAgent.toLowerCase().indexOf('msie 8')>-1);
	},
	_isIE9: function() {
		return (navigator.userAgent.toLowerCase().indexOf('msie 9')>-1);
	},
	_isOpera: function() {
		return (navigator.userAgent.toLowerCase().indexOf('opera')>-1);
	},
	_isChrome: function() {		
		return (navigator.userAgent.toLowerCase().indexOf('chrome')>-1);
	},
	_isAir: function() {		
		return (navigator.userAgent.toLowerCase().indexOf('adobeair')>-1);
	},
	_isSafari: function() {		
		return (navigator.userAgent.toLowerCase().indexOf('webkit')>-1&&!this._isChrome());
	},
	_isSafari2: function() {		
		return false; //disable safari2 support
		//return (this._isSafari()&&!this._isSafari3()&&!this._isAir());
	},
	_isSafari3: function() {		
		return (this._isSafari()&&(navigator.userAgent.toLowerCase().indexOf('version/3.')>-1||
														   navigator.userAgent.toLowerCase().indexOf('version/4.')>-1));
	},
	_isFF: function(){
		return (navigator.userAgent.indexOf("Firefox")!=-1);
	},
	_isMac: function() {
		return (navigator.userAgent.toLowerCase().indexOf("macintosh")!= -1);
	},
	_isWindows: function() {
		if(navigator.userAgent.toLowerCase().indexOf("windows")!=-1||navigator.userAgent.toLowerCase().indexOf("win32")!=-1) return true;
		else return false;
	},
	_isFlash: function(version) {
		return (!$WI.Class.Flash || (new $WI.Class.Flash()._getVersion().split(',').shift() >= parseInt(version))) ? true : false;
	}	
});

$WI.init();	//Initialize System Class, do not remove

