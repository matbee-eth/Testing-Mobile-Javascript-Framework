/*********************************************************
*		Cookie Methods
*		Designed & developed by Dima Svirid, 2009	
*		Class: cookie.js
*	  Extends: system.js $WI.System
*		Call: 
*			Set cookie: 		$WI.Cookie.Set('cookie_name', 'cookie value');
*			Delete cookie:  $WI.Cookie.Delete('cookie_name');
*			Read cookie:		$WI.Cookie.Get('cookie_name');
*			Check cookie: 	$WI.Cookie.IsEnabled();
*********************************************************/
$WI.Cookie = {
	IsEnabled: function() {	 
	 document.cookie = "Enabled=true";
	 var cookieValid = document.cookie;
	 if (cookieValid.indexOf("Enabled=true") != -1)  return true;
	 else return false;	 
  },
	Get: function (name) {
		var start = document.cookie.indexOf( name + "=" );
		var len = start + name.length + 1;
		if ( ( !start ) && ( name != document.cookie.substring( 0, name.length ) ) ) {
			return null;
		}
		if ( start == -1 ) return null;
		var end = document.cookie.indexOf( ';', len );
		if ( end == -1 ) end = document.cookie.length;
		return unescape( document.cookie.substring( len, end ) );
	},
 	Set: function(name, value, expires, path, domain, secure) {
		var today = new Date();
		if(!path) var path = '/';
		today.setTime( today.getTime() );
		if ( expires ) 
			expires = expires * 1000 * 60 * 60 * 24;
		else
			expires = 365 * 1000 * 60 * 60 * 24; //never
		var expires_date = new Date( today.getTime() + (expires) );
		document.cookie = name+'='+escape( value ) +
			( ( expires ) ? ';expires='+expires_date.toGMTString() : '' ) + //expires.toGMTString()
			( ( path ) ? ';path=' + path : '' ) +
			( ( domain ) ? ';domain=' + domain : '' ) +
			( ( secure ) ? ';secure' : '' );
	},
	Delete: function (name, path, domain) {
		if(!path) var path = '/';
		if ( $WI.Cookie.Get( name ) ) document.cookie = name + '=' +
				( ( path ) ? ';path=' + path : '') +
				( ( domain ) ? ';domain=' + domain : '' ) +
				';expires=Thu, 01-Jan-1970 00:00:01 GMT';
	}	
};
