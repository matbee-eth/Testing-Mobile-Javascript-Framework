/*********************************************************
*		HASH CLASS
*		Class generates hashed value with md5 encryption
*		Class: hash.js
*	  Extends: system.js
*********************************************************/
$WI.Class.Hash = new $WI.Class({
	MD5: function(val, hexcase) {	
		this.val = val;
		this.chrsz = 8;
		if(hexcase) this.hexcase = 1; else this.hexcase = 0;			
		this.val = this.str2binl();		
		this.val = this.core_md5(val.length*this.chrsz);		
		this.val = this.binl2hex();
		return this.val;
	},
	str2binl: function() {
	  var bin = Array();
	  var mask = (1 << this.chrsz) - 1;
	  for(var i = 0; i < this.val.length * this.chrsz; i += this.chrsz)
	    bin[i>>5] |= (this.val.charCodeAt(i / this.chrsz) & mask) << (i%32);
	  return bin;
	},
	binl2hex: function ()	{
	  var hex_tab = this.hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
	  var str = "";
	  for(var i = 0; i < this.val.length * 4; i++) {
	    str += hex_tab.charAt((this.val[i>>2] >> ((i%4)*8+4)) & 0xF) +
	           hex_tab.charAt((this.val[i>>2] >> ((i%4)*8  )) & 0xF);
	  }
	  return str;
	},
	core_md5: function(len) {
	  this.val[len >> 5] |= 0x80 << ((len) % 32);
	  this.val[(((len + 64) >>> 9) << 4) + 14] = len;	
	  var a =  1732584193;
	  var b = -271733879;
	  var c = -1732584194;
	  var d =  271733878;	
	  for(var i = 0; i < this.val.length; i += 16) {
	    var olda = a;
	    var oldb = b;
	    var oldc = c;
	    var oldd = d;	
	    a = this.md5_ff(a, b, c, d, this.val[i+ 0], 7 , -680876936);d = this.md5_ff(d, a, b, c, this.val[i+ 1], 12, -389564586);c = this.md5_ff(c, d, a, b, this.val[i+ 2], 17,  606105819);b = this.md5_ff(b, c, d, a, this.val[i+ 3], 22, -1044525330);a = this.md5_ff(a, b, c, d, this.val[i+ 4], 7 , -176418897);d = this.md5_ff(d, a, b, c, this.val[i+ 5], 12,  1200080426);c = this.md5_ff(c, d, a, b, this.val[i+ 6], 17, -1473231341);b = this.md5_ff(b, c, d, a, this.val[i+ 7], 22, -45705983);a = this.md5_ff(a, b, c, d, this.val[i+ 8], 7 ,  1770035416);d = this.md5_ff(d, a, b, c, this.val[i+ 9], 12, -1958414417);c = this.md5_ff(c, d, a, b, this.val[i+10], 17, -42063);b = this.md5_ff(b, c, d, a, this.val[i+11], 22, -1990404162);a = this.md5_ff(a, b, c, d, this.val[i+12], 7 ,  1804603682);d = this.md5_ff(d, a, b, c, this.val[i+13], 12, -40341101);c = this.md5_ff(c, d, a, b, this.val[i+14], 17, -1502002290);b = this.md5_ff(b, c, d, a, this.val[i+15], 22,  1236535329);a = this.md5_gg(a, b, c, d, this.val[i+ 1], 5 , -165796510);d = this.md5_gg(d, a, b, c, this.val[i+ 6], 9 , -1069501632);c = this.md5_gg(c, d, a, b, this.val[i+11], 14,  643717713);b = this.md5_gg(b, c, d, a, this.val[i+ 0], 20, -373897302);a = this.md5_gg(a, b, c, d, this.val[i+ 5], 5 , -701558691);d = this.md5_gg(d, a, b, c, this.val[i+10], 9 ,  38016083);c = this.md5_gg(c, d, a, b, this.val[i+15], 14, -660478335);b = this.md5_gg(b, c, d, a, this.val[i+ 4], 20, -405537848);a = this.md5_gg(a, b, c, d, this.val[i+ 9], 5 ,  568446438);d = this.md5_gg(d, a, b, c, this.val[i+14], 9 , -1019803690);c = this.md5_gg(c, d, a, b, this.val[i+ 3], 14, -187363961);b = this.md5_gg(b, c, d, a, this.val[i+ 8], 20,  1163531501);a = this.md5_gg(a, b, c, d, this.val[i+13], 5 , -1444681467);d = this.md5_gg(d, a, b, c, this.val[i+ 2], 9 , -51403784);c = this.md5_gg(c, d, a, b, this.val[i+ 7], 14,  1735328473);b = this.md5_gg(b, c, d, a, this.val[i+12], 20, -1926607734);a = this.md5_hh(a, b, c, d, this.val[i+ 5], 4 , -378558);d = this.md5_hh(d, a, b, c, this.val[i+ 8], 11, -2022574463);c = this.md5_hh(c, d, a, b, this.val[i+11], 16,  1839030562);b = this.md5_hh(b, c, d, a, this.val[i+14], 23, -35309556);a = this.md5_hh(a, b, c, d, this.val[i+ 1], 4 , -1530992060);d = this.md5_hh(d, a, b, c, this.val[i+ 4], 11,  1272893353);c = this.md5_hh(c, d, a, b, this.val[i+ 7], 16, -155497632);b = this.md5_hh(b, c, d, a, this.val[i+10], 23, -1094730640);a = this.md5_hh(a, b, c, d, this.val[i+13], 4 ,  681279174);d = this.md5_hh(d, a, b, c, this.val[i+ 0], 11, -358537222);c = this.md5_hh(c, d, a, b, this.val[i+ 3], 16, -722521979);b = this.md5_hh(b, c, d, a, this.val[i+ 6], 23,  76029189);a = this.md5_hh(a, b, c, d, this.val[i+ 9], 4 , -640364487);d = this.md5_hh(d, a, b, c, this.val[i+12], 11, -421815835);c = this.md5_hh(c, d, a, b, this.val[i+15], 16,  530742520);b = this.md5_hh(b, c, d, a, this.val[i+ 2], 23, -995338651);a = this.md5_ii(a, b, c, d, this.val[i+ 0], 6 , -198630844);d = this.md5_ii(d, a, b, c, this.val[i+ 7], 10,  1126891415);c = this.md5_ii(c, d, a, b, this.val[i+14], 15, -1416354905);b = this.md5_ii(b, c, d, a, this.val[i+ 5], 21, -57434055);a = this.md5_ii(a, b, c, d, this.val[i+12], 6 ,  1700485571);d = this.md5_ii(d, a, b, c, this.val[i+ 3], 10, -1894986606);c = this.md5_ii(c, d, a, b, this.val[i+10], 15, -1051523);b = this.md5_ii(b, c, d, a, this.val[i+ 1], 21, -2054922799);a = this.md5_ii(a, b, c, d, this.val[i+ 8], 6 ,  1873313359);d = this.md5_ii(d, a, b, c, this.val[i+15], 10, -30611744);c = this.md5_ii(c, d, a, b, this.val[i+ 6], 15, -1560198380);b = this.md5_ii(b, c, d, a, this.val[i+13], 21,  1309151649);a = this.md5_ii(a, b, c, d, this.val[i+ 4], 6 , -145523070);d = this.md5_ii(d, a, b, c, this.val[i+11], 10, -1120210379);c = this.md5_ii(c, d, a, b, this.val[i+ 2], 15,  718787259);b = this.md5_ii(b, c, d, a, this.val[i+ 9], 21, -343485551);	
	    a = this.safe_add(a, olda);
	    b = this.safe_add(b, oldb);
	    c = this.safe_add(c, oldc);
	    d = this.safe_add(d, oldd);
	  }
	  return Array(a, b, c, d);	
	},
	md5_cmn: function (q, a, b, x, s, t) {
	  return this.safe_add(this.bit_rol(this.safe_add(this.safe_add(a, q), this.safe_add(x, t)), s),b);
	},
	md5_ff: function (a, b, c, d, x, s, t) {
	  return this.md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
	},
	md5_gg: function (a, b, c, d, x, s, t) {
	  return this.md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
	},
	md5_hh: function (a, b, c, d, x, s, t) {
	  return this.md5_cmn(b ^ c ^ d, a, b, x, s, t);
	},
	md5_ii: function (a, b, c, d, x, s, t) {
	  return this.md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
	},
	safe_add: function (x, y) {
	  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  return (msw << 16) | (lsw & 0xFFFF);
	},
	bit_rol: function (num, cnt) {
	  return (num << cnt) | (num >>> (32 - cnt));
	}
});

/*********************************************************
*		UUID Generator CLASS
*********************************************************/
$WI.UUID = function(options) {
	return new $WI.Class.UUID().Create();
};
$WI.Class.UUID = new $WI.Class({
	Create: function(){
		var dg = this.timeInMs(new Date(1582, 10, 15, 0, 0, 0, 0));
		var dc = this.timeInMs(new Date());
		var t = dc - dg;
		var h = '-';
		var tl = this.getIntegerBits(t,0,31);
		var tm = this.getIntegerBits(t,32,47);
		var thv = this.getIntegerBits(t,48,59) + '1'; 
		var csar = this.getIntegerBits(this.randrange(0,4095),0,7);
		var csl = this.getIntegerBits(this.randrange(0,4095),0,7);	
		var n = this.getIntegerBits(this.randrange(0,8191),0,7) + 
				this.getIntegerBits(this.randrange(0,8191),8,15) + 
				this.getIntegerBits(this.randrange(0,8191),0,7) + 
				this.getIntegerBits(this.randrange(0,8191),8,15) + 
				this.getIntegerBits(this.randrange(0,8191),0,15); 
		return tl + h + tm + h + thv + h + csar + csl + h + n; 
	},
	getIntegerBits: function(val,start,end){
		var base16 = this.returnBase(val,16);
		var quadArray = new Array();
		var quadString = '';
		for(var i=0;i<base16.length;i++)
			quadArray.push(base16.substring(i,i+1));	
		for(i=Math.floor(start/4);i<=Math.floor(end/4);i++){
			if(!quadArray[i] || quadArray[i] == '') quadString += '0';
			else quadString += quadArray[i];
		}
		return quadString;
	},
	returnBase: function(number, base){
		var convert = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
	    if (number < base) var output = convert[number];
	    else {
	        var MSD = '' + Math.floor(number / base);
	        var LSD = number - MSD*base;
	        if (MSD >= base) var output = this.returnBase(MSD,base) + convert[LSD];
	        else var output = convert[MSD] + convert[LSD];
	    }
	    return output;
	},
	timeInMs: function(d){
		var ms_per_second = 100; 
		var ms_per_minute = 6000; 
		var ms_per_hour   = 360000; 
		var ms_per_day    = 8640000; 
		var ms_per_month  = 207360000;
		var ms_per_year   = 75686400000; 
		return Math.abs((d.getUTCFullYear() * ms_per_year) + (d.getUTCMonth() * ms_per_month) + (d.getUTCDate() * ms_per_day) + (d.getUTCHours() * ms_per_hour) + (d.getUTCMinutes() * ms_per_minute) + (d.getUTCSeconds() * ms_per_second) + d.getUTCMilliseconds());
	},
	randrange: function(min,max){
		var num = Math.round(Math.random() * max);
		if(num < min)	num = min;
		else if (num > max)	num = max;
		return num;
	}
});

/*********************************************************
*		BASE64 CLASS
*		Class encodes and decodes data to base64 or utf-8 encoding
*		Class: hash.js
*	  Extends: system.js
*********************************************************/
$WI.Base64 = { 	
	Encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0; 
		input = $WI.Base64._utf8_encode(input); 
		while (i < input.length) { 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++); 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63; 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			} 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		} 
		return output;
	}, 
	Decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0; 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, ""); 
		while (i < input.length) { 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++)); 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4; 
			output = output + String.fromCharCode(chr1); 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			} 
		} 
		output = $WI.Base64._utf8_decode(output); 
		return output;
 
	}, 
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = ""; 
		for (var n = 0; n < string.length; n++) { 
			var c = string.charCodeAt(n); 
			if (c < 128) 
				utftext += String.fromCharCode(c);
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			} 
		} 
		return utftext;
	},
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0; 
		while ( i < utftext.length ) { 
			c = utftext.charCodeAt(i); 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			} 
		} 
		return string;
	},
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
};
/*********************************************************
*		SYSTEM HELPFUL STATIC METHODS
*********************************************************/
$WI._append($WI, {	
	IsUuid: function(val) {
		return (/^[0-9A-Z]{8}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{16}$/i).test(val);
	},
	IsBase64: function(val) {	 
	 	return (val.Trim() !="" && (/^[a-zA-Z0-9/+]*={0,2}$/).test(val)) ? true : false;	 
  }
});