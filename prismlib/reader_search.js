/*********************************************************
*		Reader Search CLASS
*		Designed & developed by Dima Svirid, 2009	
*		Class: reader_search.js
*	  Extends: system.js, reader.js
*********************************************************/
$WI.Class.ReaderSearch = new $WI.Class({
	Create: function(options) {
		var screen = this._getClientWH();
		this.title = {};
	
		this.obj = this._insertDOM(null, {objType: 'div', objClass: 'element-reader', width: this._fixPx(screen.w), height: this._fixPx(screen.h)});				
	
	},
	Write: function(where) {	
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');		
	}	
});








