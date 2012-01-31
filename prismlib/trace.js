/*********************************************************
*		LOGGER CLASS
*		Simple javascript debugger
*		Designed & developed by Dima Svirid, 2007	
*		Class: trace.js
*	  Extends: system.js
*		Call: $WI.trace(debug_value);
*********************************************************/
$WI.Class.Logger = new $WI.Class({
	Create: function(options) {	
		var loggerObj = this._insertDOM(null, {objType: 'div', bottom: '0px', right: '0px', zIndex: 100000, backgroundColor: '#eeeeee',	position: 'absolute',	overflow: 'hidden',	border: '1px dashed #000000',	width: '200px',	height: '300px'}, 'insertinto');	
		var handler = this._insertDOM(loggerObj, {objType: 'div', html: 'Tracer', cursor: 'pointer', backgroundColor: '#585858', border: '1px solid #000000', height: '20px', margin: '5px',	padding: '2px', paddingLeft: '5px',	color: '#e6e6e6', fontFamily:'Arial', overflow: 'hidden', fontSize: '11px'}, 'insertinto');		
		if($WI.Class.DragDrop){
			$WI.extend($WI.Class.Logger, $WI.Class.DragDrop);
			this.initDD(loggerObj, {handler: handler});
			this.Resize();
		}
		this.logBody = this._insertDOM(loggerObj, {objType: 'div', color: '#9c9c9c', cursor: 'default',	position: 'relative',	top: '0px', bottom: '0px', right: '0px', left: '0px',	backgroundColor: '#ffffff', border: '1px solid #000000',margin: '5px',	padding: '2px',	overflow: 'auto',	height: '85%', fontFamily:'Arial', fontSize: '11px'}, 'insertinto');
		return this;
	},	
	Write: function(message) {
		message = "<font style='color:#cbcbc8;font-size:7pt;'>------------" + new Date() + "-----------<\/font><br>" + message;		
		this._insertDOM(this.logBody, {objType: 'div', html: message}, 'insertfirst');
		return this;
	} 	
});
