/**
	@Name: library ajax.js
	@Description: Classes for HTTP requests (ajax) and XML documents
	@Authors: Dima Svirid
	@Version: 1.1.1.1

	~History~
	Date         Author          [Ver] Description
	-----------  -------------   --------------------------------
	2011-02-21   Ky Patterson    [1.1] cleanup/merge versions
	2011-02-23   Ky Patterson    [1.1.0.1] remove header Connection: close (per Dima S)
	2011-03-03   Ihor Kharchenko [1.1.0.2] add ability to pass "parametrs" as object in ajax request
	2011-03-07   Ihor Kharchenko [1.1.1] new method in XmlDocument -> toObject. Parse xml to smart object
	2011-03-10   Ihor Kharchenko [1.1.1.1] fix problem with Array in toObject method
*/
$WI.Ajax = function(options) {
	return new $WI.Class.Ajax()._Request(options);
};
$WI.Hash = function(val, hexcase) {
	return new $WI.Class.Hash().MD5(val, hexcase);
};
$WI.Class.Ajax = new $WI.Class({
	Request: function(options) {
		options._constructor = this;
		return $WI.Ajax(options);
	},
	Response: function() {
		return (this._response_obj) ? this._response_obj : null;
	},
	onComplete: function() {
		if(this.options.onComplete)
			this.options.onComplete.apply(this.options._constructor, arguments);
		return;
	},
	onTimeout: function() {
		//throw main timeout
		if(this.options.onTimeout)
			this.options.onTimeout.apply(this.options._constructor);
		else
			this._onTimeout();
		return;
	},
	onFailure: function() {
		if(this.options.onFailure)
			this.options.onFailure.Apply(this, arguments);
		return;
	},
	onOpen: function() {
		if(this.options.onOpen)
			this.options.onOpen.Apply(this, arguments);
		return;
	},
	onSent: function() {
		if(this.options.onSent)
			this.options.onSent.Apply(this, arguments);
		return;
	},
	onReceived: function() {
		if(this.options.onReceived)
			this.options.onReceived.Apply(this, arguments);
		return;
	},
	_Request: function(options) {
		var ___cache;if(!$WI.GLOBAL_AJAX_REGISTRY) $WI.GLOBAL_AJAX_REGISTRY = [];
		if(!$WI.GLOBAL_LOCAL_STORAGE) $WI.GLOBAL_LOCAL_STORAGE = ($WI.Class.Storage) ? new $WI.Class.Storage().Datasource('WI_AJAX_REQUESTS') : null;
		this._initOptions(options);

		//set cache always first with the null result
		if(this.options.cache) {
			if((___cache = this._checkCache()) == -1 || this._getCache(___cache).result === null) ___cache = this._setCache(null, null);
			//check cache, if result has been already set
			if(___cache!=-1&&$WI.GLOBAL_AJAX_REGISTRY[___cache].result) {
				this._cacheRequest(___cache);
				return this;
			}
		}
		//check local cache
		if(this.options.cacheLocal&&(___cache = this._checkCacheLocal(this.options.cacheLocal))) {
			this._cacheRequestLocal(___cache);
			return this;
		}

		this._detectEngine();
		this._run();
		this.timeOut(true);
		return this;
	},
	/*******************************************************************************************
	*	:status
	*	200 - Ok
	*	404 - Page is not found
	*******************************************************************************************/
	_onComplete: function() {
		this.engine.onreadystatechange = function(){};
		switch(this.engine.status) {
			case 200:
				//remove top right cornet preloader
				if(this.preloader)this._removeDOM(this.preloader);
				//clear timeout error
				if(this.timeout) clearTimeout(this.timeout);
				//prevent and throw global error
				var txt = this.engine.responseText;
				if($WI.IsBase64 && $WI.IsBase64(txt))
					txt = $WI.Base64.Decode(txt);
				var regx = /(^PrismErrorException:)/gi;
				if(result = new RegExp(regx).exec(txt)) {
					$WI.DOM.Alert({message: txt.replace(regx, '')});
					return;
				}
				//cache result
				if(this.options.cache) this._setCache(this._checkCache(), txt);
				else this._removeCache();
				if(this.options.cacheLocal) this._setCacheLocal(this.options.cacheLocal, txt);
				this._response_obj = {xml: new $WI.XmlDocument(txt), text: txt, instance: this.options.instance};
				this.onComplete(this._response_obj.xml, this._response_obj.text, this._response_obj.instance);
				break;
			default:
				if(this.preloader)this._removeDOM(this.preloader);
				this._removeCache();
				this.onFailure();
				break;
		}
	},
	_onTimeout: function() {
		if(this.preloader)this._removeDOM(this.preloader);
		//this.Confirm({message: "Connection with the server cannot be established! Would you like to retry?", YesFunction: function(){this._retryRequest()}.Apply(this)});
	},
	_retryRequest: function(){
		this._run();
		this.timeOut(true);
	},
	_detectEngine: function() {
		this.engine = $WI.Check(
									function(){return new XMLHttpRequest();},
									function(){return new ActiveXObject('Msxml2.XMLHTTP');},
									function(){return new ActiveXObject('Microsoft.XMLHTTP');}
									);
	},
	_run: function() {
		//red left top corner preloader
		if(this.options.preloader) {
			var xy = this._getScrollXY();
			this.preloader = this._insertDOM(null, {objType: 'div', display: 'block', position: 'absolute', top: this._fixPx(xy.y), right: this._fixPx(-xy.x), backgroundColor: '#bd1111',	color: '#ffffff',	fontSize: '10pt',	width: '80px',	height: '20px',	padding: '2px',	paddingLeft: '5px',	zIndex: '100000', html: 'Loading...'}, 'insertlast');
		}

		this.engine.open(this.options.method.toUpperCase(), this.options.url, this.options.async);
		if(this.options.async == true) //do that only for async requests otherwise fires twice in Chrome
			this.engine.onreadystatechange = this._changeStatus.Apply(this);
		//set headers
		if (this.options.method.toUpperCase()=='POST')
			this.engine.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
		//this.engine.setRequestHeader('Powered-By', 'PRISM');
		//this.engine.setRequestHeader('Content-Length', this.options.parameters.length);
		if(this.options.headers)
			for(var i=0;i<this.options.headers.length;i=i+2)
				this.engine.setRequestHeader(this.options.headers[i], this.options.headers[i+1]);
		this.engine.setRequestHeader('Pragma', 'no-cache');
		this.engine.setRequestHeader('Cache-Control', 'no-cache');
		this.engine.setRequestHeader('If-Modified-Since', 'Thu, 1 Jan 1970 00:00:00 GMT');
		this.engine.setRequestHeader('Accept', 'text/javascript, text/html, application/xml, text/xml, */*');
		//this.engine.setRequestHeader('Connection', 'close');
		this.engine.send((this.options.method.toUpperCase()=='POST')?this.options.parameters:null);

		//if sync call call onComplete right after that
		if(this.options.async == false)
			this._changeStatus.apply(this);

	},
	/*******************************************************************************************
	*	:readyState
	*	0 - Not initialized
	*	1 - Open
	*	2 - Sent
	*	3 - Received
	*	4 - Loaded
	*******************************************************************************************/
	_changeStatus: function() {
		switch(this.engine.readyState) {
			case 1:
				this.onOpen();			break;
			case 2:
				this.onSent();			break;
			case 3:
				this.onReceived();	break;
			case 4:
				this._onComplete();	break;
		}
  },
	_initOptions: function(options) {
		 this.options = {
			url: '',
			parameters: '',
			method: 'get',
			timeout: null,			//timeout in seconds
			async: true,
			threads: 1,
			_constructor: this
		}
		$WI._append(this.options, options);
		if ($WI.IsObject(this.options.parameters)) {
			var parameters = [];
			for(var i in this.options.parameters)
				parameters.push(i + '=' + this.options.parameters[i]);
			this.options.parameters = parameters.join('&');
		}
	},
	timeOut: function(set){
		if(set) {
			if(this.options.timeout && this.options.timeout > 0)
				this.timeout = setTimeout(function(){this.timeOut()}.Apply(this), this.options.timeout*1000);
		} else {
			this.engine.onreadystatechange = function(){};
			this.engine.abort();
			this._onTimeout();
		}
		return false;
	},
	_cacheRequest: function(___cache){
		var cache = $WI.GLOBAL_AJAX_REGISTRY[___cache];
		this.engine = {status: 200, responseText: cache.result};
		this._onComplete();
	},
	_cacheRequestLocal: function(data){
		this.engine = {status: 200, responseText: data};
		this._onComplete();
	},
	_getCache: function(idx){
		if($WI.GLOBAL_AJAX_REGISTRY[idx])
			return $WI.GLOBAL_AJAX_REGISTRY[idx];
		else return null;
	},
	_checkCache: function(){
		for(var i=0;i<$WI.GLOBAL_AJAX_REGISTRY.length;i++) {
			var ___cache = $WI.GLOBAL_AJAX_REGISTRY[i];
			if(___cache.url==this.options.url&&___cache.method==this.options.method&&___cache.parameters==this.options.parameters)
				return i;
		}
		return -1;
	},
	_setCache: function(idx, result){
		if(idx===null) {
			var __cache = {url: this.options.url,
										 method: this.options.method,
										 parameters: this.options.parameters,
										 result: result}
			$WI.GLOBAL_AJAX_REGISTRY.push(__cache);
			return $WI.GLOBAL_AJAX_REGISTRY.length - 1;
		} else {
			var __cache = $WI.GLOBAL_AJAX_REGISTRY[idx];
			if(__cache) __cache.result = result;
			return idx;
		}
	},
	_removeCache: function(){
		$WI.GLOBAL_AJAX_REGISTRY.Remove(this._getCache(this._checkCache()));
	},
	_setCacheLocal: function(uuid, result){
		if($WI.GLOBAL_LOCAL_STORAGE && $WI.GLOBAL_LOCAL_STORAGE.Has(uuid) == false)
			$WI.GLOBAL_LOCAL_STORAGE.Set(uuid, result);
	},
	_checkCacheLocal: function(uuid){
		if($WI.GLOBAL_LOCAL_STORAGE)
			return $WI.GLOBAL_LOCAL_STORAGE.Get(uuid);
	}
});
$WI.extend($WI.Class.DOM, $WI.Class.Ajax);

/*********************************************************
*		XML CLASS
*********************************************************/
$WI.Class.XML = new $WI.Class({
	getObject: function(xpath) {
		var children = this.getChildren(xpath);
		var object = {};
		for(var i=0;i<children.length;i++)
			object[children[i].nodeName] = (children[i].firstChild)?children[i].firstChild.nodeValue:'';
		return object;
	},
	List: function(root, xml) {
		if(!root) return [];
		if(!xml) var xml = this.xmlDoc;
		var root = xml.getElementsByTagName(root);
		var list = [];
		var obj = {};
		if(root.length>0)
			var children = this._getChildren(root[0]);
		else
			 return [];
		//get attributes
		for(var i=0;i<children.length;i++) {
			var atribs = this._getChildren(children[i]);
			obj = {};
			if(atribs.length>0) {
				for(var j=0;j<atribs.length;j++) {
					if(this._getChildren(atribs[j]).length>0)
						obj[atribs[j].tagName] = this.List(atribs[j].tagName, atribs[j].parentNode);
					else
						obj[atribs[j].tagName] = (atribs[j].firstChild)?atribs[j].firstChild.nodeValue:'';
				}
			}
			list.push(obj);
		}
  	return list;
	},

	getNode: function(xpath, constant) {
		if(this._isIE() || this._isOpera()) {
			var result = this.xmlDoc.selectSingleNode(xpath);
		} else if(this._isSafari2()) {
			var result = this.getNodeByTagName(xpath);
		} else {
			var evaluator = new XPathEvaluator();
			var result = evaluator.evaluate(xpath, this.xmlDoc, null, (constant)?constant:XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		}
		return result;
	},
	getNodeByTagName: function(xpath, xml) {
		var node = null;
		if(!xml) {
			var xml = this.xmlDoc;
			var xpath = xpath.replace(/\/\//,'').split('/');
		}
		var root = xml.getElementsByTagName(xpath[0]);
		var _xpath = xpath.slice(1);
		if(root.length>0&&_xpath&&_xpath.length>0)
			return this.getNodeByTagName(_xpath, root[0]);
		else
			return root[0];
	},
	getNodeValue: function(xpath) {
		var value = null;
		try {
			var node = this.getNode(xpath);
			if ((this._isIE()  || this._isOpera()) && node) value = node.text;
			else if (this._isSafari2() && node.firstChild) value = node.firstChild.nodeValue;
			else if (!this._isIE() && !this._isOpera() && node.singleNodeValue) value = node.singleNodeValue.textContent;
		} catch (e) {}
		return value;
	},
	getChildren: function(xpath) {
		var nodes = [];
		var node = this.getNode(xpath, (window.XPathResult)?XPathResult.ORDERED_NODE_ITERATOR_TYPE:null);
		var aNode = null;

		if(node.iterateNext)//Mozilla required
			node = node.iterateNext();

		if(node.childNodes.length > 0)
			for(var i=0;i<node.childNodes.length;i++)
				nodes.push(node.childNodes[i]);

		return nodes;
	},
	getNodes: function(xpath) {
		var nodes = [];
		if (this._isIE()) {
			var result = this.xmlDoc.selectNodes(xpath);
			for (var i = 0; i < result.length; i++) {
				var aNode = result[i];
				nodes.push(aNode);
			}
		} else {
			var evaluator = new XPathEvaluator();
			var result = evaluator.evaluate(xpath, this.xmlDoc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			while ((aNode = result.iterateNext()) != null) {
				 nodes.push(aNode);
			}
		}
		return nodes;
	},
	getNodeValues: function(xpath) {
		var values = [];
		try {
			var nodes = this.getNodes(xpath);
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (this._isIE() && node) {
					value = node.text;
				} else if (!this._isIE()) {
					value = node.firstChild.nodeValue;
				}
				values.push(value);
			}
		} catch (e) {}
		return values;
	}
});



/*********************************************************
*		XML CLASS
*		Current class contains of XmlDocument, XmlNode, XmlNodes
*		Designed & developed by Dima Svirid, 2009
*		Class: xml.js
*	  Extends: system.js
*********************************************************/
$WI.XmlDocument = function(xmlString) {
	return new $WI.Class.XmlDocument().Init(xmlString);
};
/*********************************************************
*		XmlDocument Object
*********************************************************/
$WI.Class.XmlDocument = new $WI.Class({
	//Init XML Document
	Init: function(text) {
		//prompt('', text);
		/*
		var rexp = /(<\!\[CDATA\[)([^?\]]+)(\]\]>)/g;
		//var rexp = /(<\!\[CDATA\[)([\s\S]+)(\]\]>)/g;
		if(result = new RegExp(rexp).exec(text)) {
				alert(result.length)
				if(result.length==4)
				prompt('', result[2])
		}*/

		try{
			if (this._isIE()) {
		    	$WI.Check (
		    		function() { axDom = new ActiveXObject("MSXML2.DOMDocument.4.0"); },
						function() { axDom = new ActiveXObject("MSXML2.DOMDocument.5.0"); },
		    		function() { axDom = new ActiveXObject("MSXML2.DOMDocument.3.0"); },
		    		function() { axDom = new ActiveXObject("MSXML2.DOMDocument"); },
		    		function() { axDom = new ActiveXObject("Microsoft.XmlDom"); }
			    );
			    this.xmlDoc = axDom;
			} else {
				this.xmlDoc = document.implementation.createDocument("", "", null);
			}
			//MUST BE HERE to allow CDATA within CDATA
			if (this._isIE()) {
	      this.xmlDoc.async = false;
		  	this.xmlDoc.loadXML(text);
			} else {
		   var parser=new DOMParser();
		   this.xmlDoc = parser.parseFromString(text,"text/xml");
			}
		} catch(err){
			this.xmlDoc = null;
		}
		return this;
	},
	//Write XML document into the string
	Write: function() {
		try{
			var string = (new XMLSerializer()).serializeToString(this.xmlDoc);
		} catch (e) {
			try{
				var string = this.xmlDoc.xml;
				} catch (e) {
					var string = "";
				}
		}
		return string;
	},
	isXmlDocument: function() {
		return true;
	},
	//dump/preview xml object on a page
	dump: function(where) {
		var str = this.Write().replace(/>/g, "&gt;").replace(/</g, "&lt;");
		this._insertDOM(document.body, {html: str}, 'insertinto');
	},
	getObject: function(xpath) {
		var children = this.getChildren(xpath);
		var object = {};
		for(var i=0;i<children.length;i++)
			object[children[i].nodeName] = (children[i].firstChild)?children[i].firstChild.nodeValue:'';
		return object;
	},
	toObject: function (sParam, oXmlDoc) {
		sParam = $WI.Check(sParam, '.');
		oXmlDoc = $WI.Check(oXmlDoc, this);

		var aRes = {};
		var oContentXmlNodeCount = 0;
		var oContentXml = [];

		if(oXmlDoc.getNodes( sParam + '/*').length) {
			oContentXml = oXmlDoc.getNodes( sParam + '/*' );
			oContentXmlNodeCount = oContentXml.length;
		} else if (oXmlDoc.getNode( sParam ).getNodeValue)
			return oXmlDoc.getNode( sParam ).getNodeValue();
		else if (oXmlDoc.getNodeValue)
			return oXmlDoc.getNodeValue();
		else
			return null;

		for(var i = 0; i < oContentXmlNodeCount; i++) {
			var oValue = oContentXml[i].getNodeValue();
			var sKey = oContentXml[i].getNodeName();

			if (i != oContentXmlNodeCount - 1) {
				var sKeyNext = oContentXml[i+1].getNodeName();
				if (sKeyNext == sKey) {
					sKey = i;
				}
			} else if(i > 0) {
				var sKeyNext = oContentXml[i-1].getNodeName();
				if (sKeyNext == sKey)
					sKey = i;
			}
			if (sKey == 0)
				aRes = [];

			var sNewParam = sParam + '/' + oContentXml[i].getNodeName();
			var oChildNodeLength = oContentXml[i].getChildren().length;

			if (oChildNodeLength > 0) {
				if (sKey == i) {
					var oXml = oContentXml[i].getChildren();

					var aTemp = {};
					for( var j = 0; j < oXml.length; j++ )
						if (oXml[j].getChildren().length > 0)
							aTemp[oXml[j].getNodeName()] = this.toObject('.', oXml[j]);
						else
							aTemp[oXml[j].getNodeName()] = oXml[j].getNodeValue();
					aRes[sKey] = aTemp;
				} else
					aRes[sKey] = this.toObject(sNewParam, oXmlDoc);
			}
			else
				aRes[sKey] = oValue;
		}

		return aRes;
	},

	//depricated
	List: function(root, xml) {
		if(!root) return [];
		if(!xml) var xml = this.xmlDoc;
		var root = xml.getElementsByTagName(root);
		var list = [];
		var obj = {};
		if(root.length>0)
			var children = this._getChildren(root[0]);
		else
			 return [];
		//get attributes
		for(var i=0;i<children.length;i++) {
			var atribs = this._getChildren(children[i]);
			obj = {};
			if(atribs.length>0) {
				for(var j=0;j<atribs.length;j++) {
					if(this._getChildren(atribs[j]).length>0)
						obj[atribs[j].tagName] = this.List(atribs[j].tagName, atribs[j].parentNode);
					else
						obj[atribs[j].tagName] = (atribs[j].firstChild)?atribs[j].firstChild.nodeValue:'';
				}
			}
			list.push(obj);
		}
  	return list;
	},
	//returns a root node of the document
	getRootNode: function() {
		return new $WI.Class.XmlNode().Init(this.xmlDoc, this.xmlDoc.documentElement);
	},
	//get a node object
	getNode: function(xpath, constant) {
		try {
			var evaluator = new XPathEvaluator();
			var result = evaluator.evaluate(xpath, this.xmlDoc, null, (constant)?constant:XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		} catch(e) {
			try {
				var result = this.xmlDoc.selectSingleNode(xpath);
			} catch(e) {
				var result = this.getNodeByTagName(xpath);
			}
		}
		return new $WI.Class.XmlNode().Init(this.xmlDoc, result);
	},
	//get a node value, must be deprecated but left to fit old code
	getNodeValue: function(xpath) {
		var n = this.getNode(xpath);
		if (!n.isXmlNode())
			return null;
		var v = n.getNodeValue();
		if (typeof v == 'string')
			return v.replace(/&lt;\!\[CDATA\[/g, "<![CDATA[").replace(/]]&gt;/g, "]]>");
		return v;
	},
	//helpful method to support getNode by Safari 2
	getNodeByTagName: function(xpath, xml) {
		var node = null;
		if(!xml) {
			var xml = this.xmlDoc;
			var xpath = xpath.replace(/\/\//,'').split('/');
		}
		var root = xml.getElementsByTagName(xpath[0]);
		var _xpath = xpath.slice(1);
		if(root.length>0&&_xpath&&_xpath.length>0)
			return this.getNodeByTagName(_xpath, root[0]);
		else
			return root[0];
	},
	//returns an array of node objects
	getNodes: function(xpath, constant) {
		var nodes = [];
		if(this._isIE() || this._isOpera()) {
			var result = this.xmlDoc.selectNodes(xpath);
			for (var i = 0; i < result.length; i++)
				nodes.push(new $WI.Class.XmlNode().Init(this.xmlDoc, result[i]));
		} else if(this._isSafari2()) {
			var result = this.getNodeByTagName(xpath);
		} else {
			var evaluator = new XPathEvaluator();
			var result = evaluator.evaluate(xpath, this.xmlDoc, null, (constant)?constant:XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			while ((aNode = result.iterateNext()) != null) {
				nodes.push(new $WI.Class.XmlNode().Init(this.xmlDoc, aNode));
			}
		}
		return nodes;
	}
});
/*********************************************************
*		XmlNode Object
*********************************************************/
$WI.Class.XmlNode = new $WI.Class({
	//Init a new XML Node object
	Init: function(xmlDoc, xPath, from) {
		this.xmlDoc = xmlDoc;
		this.xPath = xPath;
		this.xmlNode = null;
		if(xmlDoc && xPath)
			try {
				if (this._isIE() || this._isOpera()) this.xmlNode = xPath;
				else if (this._isSafari2() && xPath.firstChild) this.xmlNode = xPath.firstChild;
				else if (!this._isIE() && !this._isOpera() && xPath.singleNodeValue) this.xmlNode = xPath.singleNodeValue;
				else this.xmlNode = xPath;
			} catch (e) {}
		return this;
	},
	isXmlNode: function(){
		return (this.xmlNode && this.xmlNode.nodeType) ? true : false;
	},
	//create a new node
	createNode: function(nodeName, nodeValue, CData) {
		var newel = this.xmlDoc.createElement(nodeName);
  	if(nodeValue) {
			if(CData)
				var newtext = this.xmlDoc.createCDATASection(nodeValue);
			else
				var newtext = this.xmlDoc.createTextNode(nodeValue);
  		newel.appendChild(newtext);
		}
		//var node = this.xmlDoc.getElementsByTagName(this.xmlNode.nodeName);
		//if(node && node.length > 0)
			//node[0].appendChild(newel);
		this.xmlNode.appendChild(newel);
		return this;
	},
	//set CData to the node as a value
	createCDataNode: function(nodeName, nodeValue) {
		return this.createNode(nodeName, nodeValue, true)
	},
	//creates an attribute
	createAttribute: function(attName, attValue) {
		//var att = this.xmlNode.getAttribute(attName);
		//if(att) att = attValue;
		//else this.xmlNode.setAttribute(attName, attValue);
		this.xmlNode.setAttribute(attName, attValue);
		return this;
	},
	//returns a last child of the node
	getLastChild: function() {
		var x = this.xmlNode.lastChild;
		while (x.nodeType != 1) x = x.previousSibling;
		return new $WI.Class.XmlNode().Init(this.xmlDoc, x);
	},
	//returns parent node
	getParentNode: function() {
		return new $WI.Class.XmlNode().Init(this.xmlDoc, (this.xmlNode) ? this.xmlNode.parentNode : null);
	},
	//returns a value for an attribute
	getAttribute: function(attribute) {
		if(this.xmlNode && this.xmlNode.getAttribute && this.xmlNode.getAttribute(attribute))
			return this.xmlNode.getAttribute(attribute);
		else
			return null;
	},
	//returns a root node of the document
	getRootNode: function() {
		return new $WI.Class.XmlNode().Init(this.xmlDoc, this.xmlDoc.documentElement);
	},
	//get a node object
	getNode: function(xpath, constant) {
		try {
			var evaluator = new XPathEvaluator();
			var result = evaluator.evaluate(xpath, this.xmlNode, null, (constant)?constant:XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		} catch(e) {
			try {
				var result = this.xmlNode.selectSingleNode(xpath);
			} catch(e) {
				var result = this.getNodeByTagName(xpath);
			}
		}
		return new $WI.Class.XmlNode().Init(this.xmlDoc, result);
	},
	//get node name
	getNodeName: function() {
		var value = null;
		if(!this.xmlNode) return value;
		return this.xmlNode.nodeName;
	},
	//get node value
	getNodeValue: function() {
		var value = null;
		if(!this.xmlNode) return value;
		if(this.xmlNode.firstChild)	value = this.xmlNode.firstChild.nodeValue;
		if(!value) {
			try {
				if (this.xmlNode.text) value = this.xmlNode.text;
				else if (!this._isIE() && !this._isOpera() && this.xmlNode.singleNodeValue) value = this.xmlNode.singleNodeValue.textContent;
				else if (this.xmlNode.firstChild) value = this.xmlNode.firstChild.nodeValue;
			} catch (e) {}
		}
		return (value) ? value.replace(/&lt;\!\[CDATA\[/g, "<![CDATA[").replace(/]]&gt;/g, "]]>") : ""; //always return empty not null
	},
	//returns an array of node objects
	getNodes: function(xpath, constant) {
		var nodes = [];
		try {
			var evaluator = new XPathEvaluator();
			var result = evaluator.evaluate(xpath, this.xmlNode, null, (constant)?constant:XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
			while ((aNode = result.iterateNext()) != null) {
				nodes.push(new $WI.Class.XmlNode().Init(this.xmlDoc, aNode));
			}
		} catch(e) {
			try {
				var result = this.xmlNode.selectNodes(xpath);
					for (var i = 0; i < result.length; i++)
						nodes.push(new $WI.Class.XmlNode().Init(this.xmlDoc, result[i]));
			} catch(e) {
				var result = this.getNodeByTagName(xpath);
			}
		}
		return nodes;
	},
	//set node value
	setNodeValue: function(nodeValue, CData) {
		if(!this.xmlNode) return this;
		if(this.xmlNode.firstChild) this.xmlNode.removeChild(this.xmlNode.firstChild);
		if(nodeValue) {
			if(CData)
				var newtext = this.xmlDoc.createCDATASection(nodeValue);
			else
				var newtext = this.xmlDoc.createTextNode(nodeValue);
  		this.xmlNode.appendChild(newtext);
		}
		return this;
	},
	getChildren: function() {
		return this.getNodes('./*');
	},
	removeNode: function() {
		if(!this.xmlNode || !this.xmlNode.parentNode) return this;
		this.xmlNode.parentNode.removeChild(this.xmlNode);
		return this;
	}
});