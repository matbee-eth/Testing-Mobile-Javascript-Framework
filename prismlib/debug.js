/*********************************************************
*		Debugger class
*		Static class with helpful debugging methods
*		Designed & developed by Ky Patterson, 2010
*		Class: debug.js
*	  Extends: system.js
*		Call: $WI.Debug.Dump(variable);
*********************************************************/
/**
	@Name: $WI.Debug
	@Description: Useful debugging methods
	@Version: 1.0

	~Usage~
	$WI.DOM.LoadJS({src: '/api2.0/src/javascript/trace.js', include_once: true, onload: test });
	function test() {
		var myobj = {thing: 'hello', stuff: [1, 2, 3] };
		var debugstr = $WI.Debug.Dump(myobj);
		// debugstr contains a dump of myobj, you can print it using $WI.trace(debugstr) or whatever
	}
*/
$WI.Class.Debug = new $WI.Class({
	/**
		@Name: Dump
		@Param: variable - variable to dump to string
		@Param: maxlevels - maximum recursion depth for _dump, default is 2 levels
		@Return: string - contents of variable converted to string
	*/
	Dump: function(variable, maxlevels) {
		maxlevels = $WI.Check(maxlevels, this.INT_DUMP_DEFAULT_MAX_LEVELS);
		return this._dump(variable, maxlevels, 0);
	},

	INT_DUMP_DEFAULT_MAX_LEVELS: 2,
	INT_DUMP_MAX_STRING_LENGTH: 100,

	_dump: function(val, maxlevels, level) {
		var str = '';
		if (level > maxlevels)
			str = '...';
		else if (val == undefined)
			str = 'undefined';
		else if (val == null)
			str = 'null';
		else {
			try {
				switch (typeof val) {
					case 'boolean':
						str = (val ? 'boolean true' : 'boolean false');
						break;
					case 'number':
						str = 'number ' + val;
						break;
					case 'string':
						str = 'string(' + val.length + ')' + ((val.length > 0) ? (' "' + ((val.length > this.INT_DUMP_MAX_STRING_LENGTH) ? (val.substr(0, this.INT_DUMP_MAX_STRING_LENGTH) + ' ...') : val) + '"') : '');
						str = str.replace('<', '&lt;').replace('>', '&gt;');
						break;
					case 'function':
						str = 'function';
						break;
					case 'object':
						var spacer = '';
						var isarray = false;
						var classname = '';
						for (var i = 0; i < level; i++)
							spacer += spacer = '&nbsp;&nbsp;';
						if (val instanceof Array || val.isArray) {
							isarray = true;
							classname = 'Array';
						}
						else if (val.length != undefined) {
							// Sometimes we have fake variables like arguments that act like arrays but aren't arrays -- and can't be iterated with for (x in y)!
							isarray = true;
							for (var i in val) {
								isarray = false;
								break;
							}
							if (isarray)
								classname = 'pseudo-Array';
						}
						if (isarray) {
							str = classname + '(' + val.length + ') [';
							if (level >= maxlevels)
								str += ' ...  ]';
							else {
								str += '<br/>';
								for (var i = 0; i < val.length; i++)
									str += spacer + '&nbsp;&nbsp;[' + i + ']: ' + this._dump(val[i], maxlevels, level + 1) + '<br/>';
								str += spacer + ']';
							}
							return str;
						}
						if (typeof val.constructor == 'function') {
							var m = val.constructor.toString().match(/function\s+(\w+)/);
							if (m.length && m[1] != 'Object')
								classname = m[1];
						}
						if (!classname) {
							try {
								var m = val.toString().match(/\[(:object\w*)(.+)\]/);
								if (m.length && m[1] != 'Object')
									classname = m[1];
							}
							catch (e) {}
						}
						if (!classname && val.prototype) {
							try {
								classname = val.prototype.toString().substr(0, 100);
							}
							catch (e) {}
						}
						if (classname)
							str = 'Object[' + classname + '] {';
						else
							str = 'Object {';
						if (level >= maxlevels)
							str += ' ...  }';
						else {
							str += '<br/>';
							for (var i in val) {
								str += spacer + '&nbsp;&nbsp;[' + i + ']: ' + ((maxlevels < level + 1) ? '...' : this._dump(val[i], maxlevels, level + 1)) + '<br/>';
							}
							str += spacer + '}';
						}
						break;
					default:
						str = '??unknown??';
				}
			}
			catch (e) {
				return '!!unable to dump this value (' + e.message + ')!!';
			}
		}
		return str;
	},

	GetSuperClassNameArray: function(obj) {
		var n = [];
		for (var i = 0; i < obj.__proto__.__extends.length; i++) {
			n.push($WI.GetClassName(obj.__proto__.__extends[i]));
		}
		return n;
	}
});
$WI.Debug = new $WI.Class.Debug;