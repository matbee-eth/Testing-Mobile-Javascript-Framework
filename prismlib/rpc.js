/***********************************************************
* RPC (Remote Procedure Call) Class
*	Designed & developed by Dima Svirid, 2009	
*	Class: $WI.Class.Rpc
************************************************************/
$WI.Rpc = function() {	
	return new $WI.Class.Rpc().RpcInit();
};
$WI.Class.Rpc = new $WI.Class({			
	RpcInit: function() {		
		this.obj = new $WI.XmlDocument('<RPC_Request />');
		return this;
	},
	Rpc: function() {			
		return $WI.Rpc();
	},		
	RpcAppend: function(oAttributes, oParameters) {
		var rpcnode = this.obj.getNode('/RPC_Request')
													.createNode('RPC_Call')	
													.getLastChild()
													;				
													
		for (var i in oAttributes) 		
			rpcnode.createAttribute(i, oAttributes[i]);
		
		//assign parameters if required
		if(oParameters) {
			var paramnode = rpcnode.createNode('Parameters')	
														 .getLastChild()	
														 ;			
			for (var i in oParameters) {
				var _str = oParameters[i];
				if(typeof _str == 'object') { //data is an object
					var _str = "";		
					for (var j in oParameters[i])
						_str += "&" + j + "=" + oParameters[i][j];
				} 
				
				paramnode.createNode('Param', escape(_str).replace(new RegExp( "\\+", "g" ),"%2B"), ((/\&|</i).test(_str)) ? true : false)	
							 .getLastChild()
							 .createAttribute('name', i)
							 .createAttribute('type', ((/\&|</i).test(_str)) ? 'array' : 'string') //removed check for <, must pass xml as string
							 .createAttribute('type', ((/^\&/i).test(_str)) ? 'array' : 'string')
							;	

			}	
		}
		
		return this;
	},
	RpcCache: function(status) {
		this.rpc_cache_request = status;
		return this;
	},
	RpcAsync: function(status) {
		this.rpc_async = status;
		return this;
	},
	RpcBinary: function(status) {
		this.rpc_binary = status;
		return this;
	},
	RpcCall: function(cls, instance) {		
		//alert(this.obj.Write())
		return cls.Request({url: '/index.php?ci_namespace=wi.prism.webservice.Membership', parameters: this.obj.Write(), method: 'post', onComplete: (this.onCompleteRpc) ? this.onCompleteRpc : null, instance: instance, cache: (this.rpc_cache_request) ? this.rpc_cache_request : false, async: $WI.Check(this.rpc_async, true)});	
	},
	RpcResponse: function(xml) {	
		var responses = xml.getNodes('/RPC_Response/RPC_Call/Response');
		if(responses.length)
			for(var i=0;i<responses.length;i++) {
				var __value = responses[i].getNodeValue();
				if(__value != '' && (/^<\?xml/i).test(__value)) {						
						var oXmlDoc = new $WI.XmlDocument(__value);
						//check if node array exists to genereate array
					if(__value != '' && (/<array>/i).test(__value)) {
						//to implement xml to array conversion
					}	else {
						if(responses[i].getParentNode() && (methodName = responses[i].getParentNode().getAttribute('method')))
							responses[methodName] = oXmlDoc;		
						responses[i] = oXmlDoc;						
					}	
				} else if(__value != '') {
					if(responses[i].getParentNode() && (methodName = responses[i].getParentNode().getAttribute('method')))
							responses[methodName] = __value;		
						responses[i] = __value;		
				}					
			}		
		return responses;						
	},
	RpcOnComplete: function(method) {		
		this.onCompleteRpc = method;	
		return this;					
	},
	RpcGetCalls: function() {
		return this.obj.getNodes('/RPC_Request/RPC_Call');
	},
	RpcButton: function(but) {return this;},
	RpcMessage: function(message) {return this;}
});
$WI.extend($WI.Class.DOM, $WI.Class.Rpc);

