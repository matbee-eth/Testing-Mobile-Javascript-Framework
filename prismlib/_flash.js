/*********************************************************
*		Flash CLASS
*		Current class is responsible for generating flash object
*		Designed & developed by Dima Svirid, 2007	
*		Idea is taken from Adobe Systems, Inc.
*		Class: flash.js
*	  Extends: system.js
*********************************************************/
$WI.Flash = function() {
	return new $WI.Class.Flash().GetContent(arguments);
};
$WI.ActiveX = function() {
	return new $WI.Class.ActiveX().GetActiveContent(arguments);
};
$WI.Flash.Write = function() {
	var _content = new $WI.Class.Flash().GetContent(arguments);	
	document.write(_content);
};
$WI.ActiveX.Write = function() {
	var _content = new $WI.Class.ActiveX().GetActiveContent(arguments);
	document.write(_content);
};
$WI.DigitalAsset = {};
$WI.DigitalAsset.Write = function(url, where, options) {	
	var _content = new $WI.Class.DigitalAsset().LoadContent(url, where, options);
};
$WI.Class.Flash = new $WI.Class({
	GetContent: function (arguments){
		var ret = this._getArguments(arguments, ".swf", "movie", "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000", "application/x-shockwave-flash");
		//if flash player does not support video output update movie			
		if(!this._checkVersion()) 
			ret.params["movie"] = ret.embedAttrs["src"] = '/api/src/objects/expressInstall.swf';
	
	  return this._getObject(ret.objAttrs, ret.params, ret.embedAttrs);
	},
	_getObject: function(objAttrs, params, embedAttrs) { 
	  var str = '<object ';
	  for (var i in objAttrs)
	    str += i + '="' + objAttrs[i] + '" ';
	  str += '>';
	  for (var i in params)
	    str += '<param name="' + i + '" value="' + params[i] + '" /> ';
	  str += '<embed ';
	  for (var i in embedAttrs)
	    str += i + '="' + embedAttrs[i] + '" ';
	  str += ' ></embed></object>';
		return str;
	},	
	_getExt: function(src, ext) {
	  if (src.indexOf('?') != -1 && src.substr(src.indexOf('?') - ext.length, ext.length) != ext)
			return src.replace(/\?/, ext+'?'); 
	  else if (src.substring(src.length - ext.length) != ext)
			return src + ext;
		return src;
	},
	_getArguments: function(args, ext, srcParamName, classid, mimeType){
	  var ret = new Object();
	  ret.embedAttrs = new Object();
	  ret.params = new Object();
	  ret.objAttrs = new Object();
	  for (var i=0; i < args.length; i=i+2){	
	    var currArg = args[i].toLowerCase();    
	    switch (currArg){	
	      case "version":
	        this.requiredVersion = args[i+1];
					break;
				case "classid":
	        break;
	      case "pluginspage":
	        ret.embedAttrs[args[i]] = args[i+1];
	        break;
	      case "src":
	      case "movie":	
	       	args[i+1] = this._getExt(args[i+1], ext);
	        ret.embedAttrs["src"] = args[i+1];						
	        ret.params[srcParamName] = args[i+1];
	        break;
	      case "onafterupdate":
	      case "onbeforeupdate":
	      case "onblur":
	      case "oncellchange":
	      case "onclick":
	      case "ondblClick":
	      case "ondrag":
	      case "ondragend":
	      case "ondragenter":
	      case "ondragleave":
	      case "ondragover":
	      case "ondrop":
	      case "onfinish":
	      case "onfocus":
	      case "onhelp":
	      case "onmousedown":
	      case "onmouseup":
	      case "onmouseover":
	      case "onmousemove":
	      case "onmouseout":
	      case "onkeypress":
	      case "onkeydown":
	      case "onkeyup":
	      case "onload":
	      case "onlosecapture":
	      case "onpropertychange":
	      case "onreadystatechange":
	      case "onrowsdelete":
	      case "onrowenter":
	      case "onrowexit":
	      case "onrowsinserted":
	      case "onstart":
	      case "onscroll":
	      case "onbeforeeditfocus":
	      case "onactivate":
	      case "onbeforedeactivate":
	      case "ondeactivate":
	      case "type":
	      case "codebase":
	        ret.objAttrs[args[i]] = args[i+1];
	        break;
	      case "width":
	      case "height":
	      case "align":
	      case "vspace": 
	      case "hspace":
	      case "class":
	      case "title":
	      case "accesskey":
	      case "name":
	      case "id":
	      case "tabindex":
	        ret.embedAttrs[args[i]] = ret.objAttrs[args[i]] = args[i+1];
	        break;
	      default:
	        ret.embedAttrs[args[i]] = ret.params[args[i]] = args[i+1];
	    }
	  }
	  if(classid) ret.objAttrs["classid"] = classid;
	  if (mimeType) ret.embedAttrs["type"] = mimeType;
		ret.embedAttrs["menu"] = ret.params["menu"] = 'false';
		return ret;
	},
	_checkVersion: function() {
		return (!this.requiredVersion || this._getVersion().split(',').shift() >= parseInt(this.requiredVersion)) ? true : false; 
	},
	_getVersion: function() {
	  try { 
	    try { 
	      var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6'); 
	      try { axo.AllowScriptAccess = 'always'; } 
	      catch(e) { return '6,0,0'; } 
	    } catch(e) {} 
	    return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1]; 
	  } catch(e) { 
	    try { 
	      if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin){ 
	        return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1]; 
	      } 
	    } catch(e) {} 
	  } 
	  return '0,0,0'; 
	}
});
$WI.Class.ActiveX = new $WI.Class({
	GetActiveContent: function (arguments){
		var ret = this._getArguments(arguments, '');
	  return this._getObject(ret.objAttrs, ret.params, ret.embedAttrs);
	}
});
$WI.Class.DigitalAsset = new $WI.Class({
	LoadContent: function (url, where, options){
		if(!$WI.Ajax) {alert("ajax.js class is required to be loaded");return;}
		if(!options) var options = {};
		options.where = where;
		if(where) {
			//clean up the place and show please wait
			var _children = this._getChildren($E(where));
			for(var i=0;i<_children.length;i++)
				this._removeDOM(_children[i]);		
			
			$E(where).innerHTML = '<table style="width:100%;height:100%"><tr><td class="prism-digital-asset-loading-message" align="center">Please wait ... loading</td></tr></table>';	
		}
		
		$WI.Ajax({url: url, method: 'GET', onComplete: this._loadContentResponse, instance: options, cache: true});		
	},
	_loadContentResponse: function (xml, text, instance) {
		
		//clean up the place and show please wait
		var _children = this._getChildren($E(instance.where));
		for(var i=0;i<_children.length;i++)
			this._removeDOM(_children[i]);
				
		var div = document.createElement('div');
				div.innerHTML = text;
		var _children = div.getElementsByTagName('script');
		var _jsContent = '';	
		var _found = false;
		for(var i=0;i<_children.length;i++) 
			if((/src/i).test(_children[i].text)) {
				_jsContent = _children[i].text.
											replace(/\$WI.Flash.Write/ig, '$WI.Flash').
											replace(/\$WI.ActiveX.Write/ig, '$WI.ActiveX').
											replace(/AC_FL_RunContent/ig, '$WI.Flash').
											replace(/AC_AX_RunContent/ig, '$WI.ActiveX');			
			if(instance.width)
				_jsContent = _jsContent.replace(/([\"]width[\"][,][\s][\"][\d]{1,4}\")/ig, '"width", "' + instance.width + '"');
			if(instance.height)
				_jsContent = _jsContent.replace(/([\"]height[\"][,][\s][\"][\d]{1,4}\")/ig, '"height", "' + instance.height + '"');
			
				if((/\$WI.Flash|\$WI.ActiveX|\$WI.Flash|\$WI.ActiveX/i).test(_children[i].text)) {
					_found = true;
					break;
				}
			}
		if(_jsContent != '' && instance.where && _found)  
			this._appendHTML($E(instance.where), eval(_jsContent));
		else if(instance.where)
			this._appendHTML($E(instance.where), '<table style="width:100%;height:100%"><tr><td class="prism-digital-asset-loading-message" align="center">Oops...cannot load an asset!</td></tr></table>');
		//lets render images
		if(_jsContent == '') {
			var _children = div.getElementsByTagName('img');
			if(_children.length > 0) {
				var imgsrc = _children[0].src;
				if(instance.where && imgsrc != '') 
					this._insertDOM($E(instance.where), {objType: 'img', src: imgsrc, config: instance}, 'insertinto');
			}				
		}			
		
	}
});
$WI.extend($WI.Class.ActiveX, $WI.Class.Flash);
