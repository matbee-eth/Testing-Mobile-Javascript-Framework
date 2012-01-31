/**
	@Name: system2.0
	@Description: Javascript API v2 core library
	@Version: 2.2.3.1
	@Author: Dima Svirid

	~History~
	Date         Author          [Ver] Description
	-----------  -------------   --------------------------------
	2010-11-10   Ky Patterson    [2.1] add __new, __static, __extends, __interface
	2011-01-13   Dima Svirid     [2.2] added method NumberFormat, call $WI.NumberFormat(..)
	2011-02-15   Ky Patterson    [2.2.0.1] add Class member to class objects; add DOM.AddDOMEvent for api1 compatibility
	2011-02-18   Ky Patterson    [2.2.1] automatically clone class properties that are objects; fix method name "isDataObject" to "IsDataObject"
	2011-02-18   Ky Patterson    [2.2.1.1] fix small bug in NumberFormat per Dima
	2011-02-21   Ky Patterson    [2.2.1.2] fix bug in $WI.Clone with arrays, fix Clone generally; add lots of documentation
	2011-02-23   Ky Patterson    [2.2.2] add more trace.js methods, make logger available as $WI.Logger; make Check() skip null
	2011-03-01   Ihor Kharchenko [2.2.2.1] fix problem with _getHeight & _getWidth method when element has client*=offset*=0
	2011-04-08   Dima Svirid		 [2.2.3] _getChildren, _getDescendents fix a bug when searching byTagName
	2011-04-08   Dima Svirid		 [2.2.3.1] Array.Search, added support to search in the attributes
*/
var $WI = {
	//////////////////////////
	// Public core methods
	/**
		@Name: global function $WI.Class
		@Description: Create a new class
		@Param: cls - class definition object

		~Usage~
		$WI.Class.MyClass = new $WI.Class({
			__extends: $WI.Class.MySuperClass,
			__implements: [ $WI.Interface.MyInterface ],
			__new: function(a) {
				$WI.trace('my constructor called: a=' + a);
			},
			__static: {
				MyStaticMethod: function() {
					$WI.trace('MyStaticMethod called');
				},
				MyStaticPublicProperty: 'string',
				_mystaticproperty: 1
			},
			MyMethod: function() {
				$WI.trace('MyMethod called');
			},
			MyPublicProperty: {
				a: 1,
				b: 2
			},
			_myprivateproperty: 1
		});

		var myobj = new $WI.Class.MyClass('value for a');
		myobj.MyMethod();
		$WI.Class.MyClass.MyStaticMethod();
		myobj.Class.MyStaticMethod(); // same as calling $WI.Class.MyClass.MyStaticMethod()
	*/
	Class: function(cls) {
		// Prepare class constructor
		var F = function() {
			this.__objid = $WI.Class.__max_objid = $WI.Check($WI.Class.__max_objid, 0) + 1;
			this.Class = this.__class;
			for (var i = 0; i < this.__class.__cloneproperties.length; i++)
				this[this.__class.__cloneproperties[i]] = $WI.Clone(this[this.__class.__cloneproperties[i]], true);
			if ($WI.IsFunc(this.__new))
				this.__new.apply(this, arguments);
		};
		F.__isClass = true;
		F.__extends = [];
		F.__implements = [];
		F.__clsid = $WI.Class.__max_clsid = $WI.Check($WI.Class.__max_clsid, 0) + 1;
		F.__static = {};
		F.__cloneproperties = [];
		F.prototype = {__class: F};

		// Set up class instance members
		for (var k in cls) {
			if (k == '__extends' || k == '__implements' || k == '__static' || k == '__class' || k == '__objid')
				continue;
			F.prototype[k] = cls[k];
			if ($WI.IsDataObject(cls[k]))
				F.__cloneproperties.push(k);
		}

		// Set up class static members
		if ($WI.IsObject(cls.__static)) {
			F.__static = cls.__static;
			$WI._append(F, F.__static)
		}

		// Append superclasses
		if (cls.__extends != undefined) {
			// Append superclasses specified in class definition
			if ($WI.IsArray(cls.__extends)) {
				for (var i = 0; i < cls.__extends.length; i++)
					F = $WI.Extend(F, cls.__extends[i], false);
			}
			else if ($WI.IsClass(cls.__extends))
				F = $WI.Extend(F, cls.__extends, false);
		}

		// Append base system classes
		if ($WI.CFG.AutoExtendClasses != undefined) {
			for (var i = 0; i < $WI.CFG.AutoExtendClasses.length; i++)
				F = $WI.Extend(F, $WI.CFG.AutoExtendClasses[i], false, true);
		}

		// Append interfaces
		if (cls.__implements != undefined) {
			if ($WI.IsArray(cls.__implements)) {
				for (var i = 0; i < cls.__implements.length; i++)
					F = $WI.Implement(F, cls.__implements[i]);
			}
			else
				F = $WI.Implement(F, cls.__implements);
		}

		return F;
	},
	/**
		@Name: global function $WI.Interface
		@Description: Create a new interface
		@Param: cls - interface definition object

		~Usage~
		$WI.Class.MyInterface = new $WI.Interface({
			__extends: $WI.Class.MySuperInterface,
			__static: {
				MyStaticMethod: function() {}
			},
			MyMethod: function() {}
		});
	*/
	Interface: function(cls) {
		// Prepare interface "constructor"
		var F = function() {
			$WI.Throw('Cannot instantiate interface "' + this.GetClassName, 'FATAL ERROR');
		};
		F.__isInterface = true;
		F.__implements = [];
		F.__clsid = $WI.Class.__max_clsid = $WI.Check($WI.Class.__max_clsid, 0) + 1;
		F.__static = {};
		F.prototype = {__class: F};

		// Set up class instance members
		for (var k in cls) {
			if (k == '__extends' || k == '__implements' || k == '__static' || k == '__class' || k == '__objid')
				continue;
			F.prototype[k] = cls[k];
		}

		// Set up class static members
		if ($WI.IsObject(cls.__static)) {
			F.__static = cls.__static;
		}

		// Append superclasses (interfaces)
		if (cls.__extends != undefined) {
			if ($WI.IsArray(cls.__extends)) {
				for (var i = cls.__extends.length - 1; i >= 0; i--)
					F = $WI.Implement(F, cls.__extends[i]);
			}
			else if ($WI.IsInterface(cls.__extends))
				F = $WI.Implement(F, cls.__extends);
		}

		return F;
	},
	/**
		@Name: global function $WI.Extend
		@Description: Tell system that class A extends (inherits) class B
		@Param: subClass - class to extend
		@Param: superClass - class that will be inherited
		@Param: overwrite - system use only, overwrite existing properties of subClass using superClass
		@Param: systemclass - system use only, do not include superClass in inheritance tree for subClass
		~Usage~
		Only call this if you must set class inheritance at runtime
		Otherwise just define property __extends in your class definition
	*/
	Extend: function(subClass, superClass, overwrite, systemclass) {
		overwrite = $WI.Check(overwrite, true);
		systemclass = $WI.Check(systemclass, false);
		if (subClass == superClass || subClass.__extends.InArray(superClass))
			return subClass;
		for (var k in superClass.__static) {
			if (overwrite || subClass.__static[k] == undefined) {
					subClass.__static[k] = superClass.__static[k];
					subClass[k] = superClass.__static[k];
				}
		}
		for (var k in superClass.prototype) {
			if (k != '__class' && k != '__objid' && (overwrite || subClass.prototype[k] == undefined)) {
				subClass.prototype[k] = superClass.prototype[k];
				if ($WI.IsDataObject(superClass.prototype[k]))
					subClass.__cloneproperties.push(k);
			}
		}
		if (!systemclass) {
			subClass.__extends.push(superClass);
			if ($WI.IsArray(superClass.__extends)) {
				for (var i = 0; i < superClass.__extends.length; i++) {
					var c = superClass.__extends[i];
					if ($WI.IsClass(c) && !subClass.__extends.InArray(c))
						subClass.__extends.push(c);
				}
			}
		}
		return subClass;
	},
	/**
		@Name: global function $WI.Implement
		@Description: Tell system that class A implements all members of interface B
		@Param: subClass - class implementing the interface
		@Param: superClass - interface being implemented
		~Usage~
		Only call this if you must set class interfaces at runtime
		Otherwise just define property __implements in your class definition
		This will throw an exception if subClass does not correctly implement superClass!
	*/
	Implement: function(subClass, superClass) {
		if (subClass.__implements.InArray(superClass))
			return subClass;
		if ($WI.IsInterface(subClass)) {
			$WI.Extend(subClass, superClass, false, true);
		}
		else {
			for (var k in superClass.__static) {
				if (subClass.__static[k] == undefined)
					$WI.Throw('Cannot register a class that implements "' + $WI.GetClassName(superClass) + '" but does not define static member '
							+ (typeof superClass.__static[k]) + ' "' + k + '"', 'FATAL ERROR');
			}
			for (var k in superClass.prototype) {
				if (subClass.prototype[k] == undefined) {
					if (isinterface)
						subClass.prototype[k] = superClass.prototype[k];
					else
						$WI.Throw('Cannot register a class that implements "' + $WI.GetClassName(superClass) + '" but does not define member '
								+ (typeof superClass.prototype[k]) + ' "' + k + '"', 'FATAL ERROR');
				}
			}
		}
		subClass.__implements.push(superClass);
		if ($WI.IsArray(superClass.__implements)) {
			for (var i = 0; i < superClass.__implements.length; i++) {
				var c = superClass.__implements[i];
				if ($WI.IsInterface(c) && !subClass.__implements.InArray(c))
					subClass.__implements.push(c);
			}
		}
		return subClass;
	},
	/**
		@Name: global function $WI.extend
		@Description: Deprecated. Alias of <Extend()>
	*/
	extend: function(subClass, superClass, overwrite, systemclass) {
		return $WI.Extend(subClass, superClass, overwrite, systemclass);
	},
	/**
		@Name: global function $WI.implement
		@Description: Deprecated. Alias of <Implement()>
	*/
	implement: function(subClass, superClass) {
		return $WI.Implement(subClass, superClass);
	},

	//////////////////////////
	// Top level containers
	//configuration container
	CFG: {},
	//system registry
	REG: {Buttons: {}},
	Method: {},
	Object: {},
	Variables: {},

	//////////////////////////
	// Core private methods
	_init: function() {
		D = document;
		this.DOM = new $WI.Class.DOM;
		this.Event = this.DOM;
		this.KeyEvent = {};
		this.CFG.AutoExtendClasses = [$WI.Class.ClassObject, $WI.Class.DOM];
		//Initialize onDOMLoad event
		this.Event._initLoadDOM();
		//Initialize keypress handler
		this.Event.AddEvent({obj: D, type: (this.DOM._isiTouch()) ? 'gesturestart' : 'keydown', onevent: this.Event._keyEvent});
		this.Event.AddEvent({obj: D, type: (this.DOM._isiTouch()) ? 'gestureend' : 'keyup', onevent: this.Event._keyEvent});
		//FIX IE6 BUG
		if (this.DOM._isIE6())
			try	{document.execCommand("BackgroundImageCache", false, true);} catch(e){}
	},
	_extend: function(subClass, overrides) {
		for(var i in overrides)
			subClass.prototype[i] = overrides[i];
	},
	_append: function(main, overrides, overwrite) {
		for(var i in overrides)
			if(overwrite==undefined||overwrite===true||!main[i])
				main[i] = overrides[i];
	},

	// Public static helpful methods
	/**
		@Name: global function $WI.IsArray
		@Description: Return true if value is an array object
		@Param: val - value to test
		@Returns: (boolean)
	*/
	IsArray: function(val) {
		if(!val) return false;
		return val._isArray;
	},
	/**
		@Name: global function $WI.IsFunc
		@Description: Return true if value is a function
		@Param: val - value to test
		@Returns: (boolean)
	*/
	IsFunc: function(val) {
		return ((typeof val).toLowerCase() == 'function') ? true : false;
	},
	/**
		@Name: global function $WI.IsBool
		@Description: Return true if value is a boolean scalar
		@Param: val - value to test
		@Returns: (boolean)
	*/
	IsBool: function(val) {
		return (val.toString() == 'true' || val.toString() == 'false') ? true : false;
	},
	/**
		@Name: global function $WI.GetBool
		@Description: Return true if value is a boolean and true, otherwise return false
		@Param: val - value to test
		@Returns: (boolean)
	*/
	GetBool: function(val) {
		return ($WI.IsBool(val)) ? val: false;
	},
	/**
		@Name: global function $WI.IsNumeric
		@Description: Return true if value is a valid numeric scalar
		@Param: val - value to test
		@Returns: (boolean)
	*/
	IsNumeric: function(val) {
		return (!val && val !== 0 || isNaN(val * 1)) ? false : true;
	},
	/**
		@Name: global function $WI.IntVal
		@Description: Returns value converted to a number, or 0 if value can't be converted
		@Param: val - value to test
		@Returns: (number)
	*/
	IntVal: function(val) {
		return ($WI.IsNumeric(val)) ? parseInt(val) : 0;
	},
	/**
		@Name: global function $WI.IsString
		@Description: Return true if value is a string scalar
		@Param: val - value to test
		@Returns: (boolean)
	*/
	IsString: function(val) {
		return ((typeof val).toLowerCase() == 'string') ? true : false;
	},
	/**
		@Name: global function $WI.IsScalar
		@Description: Return true if value is a scalar (not an object, array or function)
		@Param: val - value to test
		@Returns: (boolean)
	*/
	IsScalar: function(val) {
		return (!$WI.IsFunc(val) && !$WI.IsObject(val)) ? true : false;
	},
	/**
		@Name: global function $WI.IsObject
		@Description: Return true if value is an object of any kind
		@Param: val - value to test
		@Returns: (boolean)
	*/
	IsObject: function(val) {
		return (val && (typeof val).toLowerCase() == 'object') ? true : false;
	},
	/**
		@Name: global function $WI.IsDataObject
		@Description: Return true if value is a "basic object" or "data object", i.e. it is not a class instance object
		@Param: val - value to test
		@Returns: (boolean)
	*/
	IsDataObject: function(val) {
		return ($WI.IsObject(val) && val.__class == undefined) ? true : false;
	},
	/**
		@Name: global function $WI.IsClass
		@Description: Return true if value is a class, i.e. the return value of <$WI.Class()>
		@Param: F - value to test
		@Returns: (boolean)
	*/
	IsClass: function(F) {
		return ($WI.IsFunc(F) && F.__isClass) ? true : false;
	},
	/**
		@Name: global function $WI.IsInterface
		@Description: Return true if value is an interface, i.e. the return value of <$WI.Interface()>
		@Param: F - value to test
		@Returns: (boolean)
	*/
	IsInterface: function(F) {
		return ($WI.IsFunc(F) && F.__isInterface) ? true : false;
	},
	/**
		@Name:global function $WI. IsClassOrInterface
		@Description: Return true if value is a class or an interface, i.e. the return value of <$WI.Class()> or  <$WI.Interface()>
		@Param: F - value to test
		@Returns: (boolean)
	*/
	IsClassOrInterface: function(F) {
		return ($WI.IsFunc(F) && (F.__isClass || F.__isInterface)) ? true : false;
	},
	/**
		@Name: global function $WI.IsClassObject
		@Description: Return true if value is a class instance object, i.e. the return value of <new $WI.Class.X>
		@Param: obj - value to test
		@Returns: (boolean)
	*/
	IsClassObject: function(obj) {
		return ($WI.IsObject(obj) && obj.__class) ? true : false
	},
	/**
		@Name: global function $WI.IsInstanceOf
		@Description: Return true if object is an instance of a given class or interface (counting class inheritance)
		@Param: obj - value to test
		@Param: F - class or interface to test for
		@Returns: (boolean)
	*/
	IsInstanceOf: function(obj, F) {
		if ($WI.IsClassOrInterface(obj))
			var SF = obj;
		else if ($WI.IsClassObject(obj))
			var SF = obj.__class;
		else
			return false;
		if ($WI.IsClass(F) && $WI.IsArray(SF.__extends)) {
			var test_clsid = F.__clsid;
			if (test_clsid == SF.__clsid)
				return true;
			for (var i = 0; i < SF.__extends.length; i++) {
				if (test_clsid == SF.__extends[i].__clsid)
					return true;
			}
		}
		else if ($WI.IsInterface(F) && $WI.IsArray(SF.__implements)) {
			var test_clsid = F.__clsid;
			for (var i = 0; i < SF.__implements.length; i++) {
				if (test_clsid == SF.__implements[i].__clsid)
					return true;
			}
		}
		return false;
	},
	/**
		@Name: global function $WI.GetClassName
		@Description: Return an object's class name
		@Param: obj - value to test (can be an instance object, a class or an interface)
		@Returns: (string) class name e.g. "$WI.Class.MyClass"
	*/
	GetClassName: function(obj) {
		function findclass(clsid, path) {
			var a = eval(path);
			for (var k in a) {
				if ($WI.IsFunc(a[k]) && a[k].__clsid == clsid)
					return path + '.' + k;
				if ($WI.IsObject(a[k])) {
					var test = findclass(clsid, path + '.' + k);
					if (test != null)
						return test;
				}
			}
			return '(unknown)';
		}
		if ($WI.IsClassObject(obj)) {
			var F = obj.__class;
			var path = '$WI.Class';
		}
		else if ($WI.IsClass(obj)) {
			var F = obj;
			var path = '$WI.Class';
		}
		else if ($WI.IsInterface(obj)) {
			var F = obj;
			var path = '$WI.Interface';
		}
		else
			return '(invalid)';
		if (F.__classname == undefined)
			F.__classname = findclass(F.__clsid, path);
		return F.__classname;
	},
	/**
		@Name: global function $WI.Clone
		@Description: Create a copy of a variable
		@Param: val - variable to copy
		@Param: deep - specify type/depth of copy:
			false - (default) create a shallow copy: value is copied to a new variable, but its members are not copied
			true - recursively clone members of value, except instance objects
			2 - recursively clone members of value, including instance objects
		@Returns: (mixed) copy of val
		~Usage~
		Note that some variables cannot be copied (functions, native browser objects such as HTML elements); these are returned as-is
	*/
	Clone: function(val, deep) {
		if ($WI.IsArray(val)) {
			deep = $WI.Check(deep, false);
			var c = [];
			for (var i = 0; i < val.length; i++) {
				if ($WI.IsClassObject(val[i]))
					c[i] = (deep === 2) ? $WI.Clone(val[i], deep) : val[i];
				else
					c[i] = deep ? $WI.Clone(val[i], deep) : val[i];
			}
			return c;
		}
		else if ($WI.IsObject(val)) {
			deep = $WI.Check(deep, false);
			if ($WI.IsClassObject(val))
				return deep === 2 ? val.Clone() : val;
			var c = {};
			for (var k in val) {
				if ($WI.IsClassObject(val[k]))
					c[k] = (deep === 2) ? $WI.Clone(val[k], deep) : val[k];
				else
					c[k] = deep ? $WI.Clone(val[k], deep) : val[k];
			}
			return c;
		}
		return val;
	},
	Cursor: function(cursor, options) {
		var doc = D;
		if(options&&options.objDoc) doc = options.objDoc;
		doc.body.style.cursor = (cursor)?cursor:'default';
	},
	/**
		@Name: global function $WI.Check
		@Description: Return the first argument that is defined
		@ParamList: any values including undefined values
		~Usage~
		Use this to set optional parameters or data, e.g.

		function eg(a, b) {
			// b is optional
			b = $WI.Check(b, 'default');
		}
	*/
	Check: function() {
		var val;
		for (var i=0,length=arguments.length;i<length;i++) {
			if (arguments[i] != undefined && arguments[i] != null) {
				if ($WI.IsFunc(arguments[i]))
					try {val = arguments[i]();break;} catch (e) {}
				else
					val = arguments[i];break;
			}
		}
		return val;
	},
	/**
		@Name: global function $WI.Random
		@Description: Return a random integer number
		@Param: val - Upper limit of random number range. Default is 9999999
		@Returns: (number) integer between 0 and val (inclusive)
	*/
	Random: function(val) {
		if(val!==undefined)
			return Math.round(val*Math.random());
		else
			return Math.round(9999999*Math.random());
	},
	/**
		@Name: global function $WI.NumberFormat
		@Description: Format value into required number format, dollar format or any other curr
		~Example~
		$WI.NumberFormat(-10044324324323243, 2, ', ','.','$',' CAD','-',' CR')	//$-10, 044, 324, 324, 323, 244.00 CR CAD
	*/
	NumberFormat: function(num, dec, thou, pnt, curr1, curr2, n1, n2) {
		if(!n1)n1='';if(!n2)n2='';if(!curr1)curr1='';if(!curr2)curr2='';if(!pnt)pnt='';if(!thou)thou='';if(!dec)dec=0;
		var x = Math.round(num * Math.pow(10,dec));
		if (x >= 0) n1=n2='';
		var y = (''+Math.abs(x)).split('');
		var z = y.length - dec;
		if (z<0) z--;
		for(var i = z; i < 0; i++)
			y.unshift('0');
		if (z<0) z = 1; y.splice(z, 0, pnt);
		if(y[0] == pnt) y.unshift('0');
		while (z > 3) {
			z-=3;
			y.splice(z,0,thou);
		}
		var r = curr1+n1+y.join('')+n2+curr2;
		return r;
	},
	/**
		@Name: global function $WI.BrowserTab
		@Description: Open a URL in a new browser tab or window
		@Param: url - URL to open in new window/tab
	*/
	BrowserTab: function(url) {
		//if(!$WI.DOM._isChrome() || confirm("A new tab is about to be openned, please hold 'Shift' button to ignore Popup blocker!"))	{
			var frm = $WI.DOM._insertDOM(document.body, {objType: 'form', target: '_blank', action: url, method: 'post'}, 'insertinto');
			frm.submit();$WI.DOM._removeDOM(frm);
		//}
	},
	/**
		@Name: global function $WI.PopUp
		@Description: Open a URL in a popup window
		@Param: url - URL to open in new window
		@Param: winname - optional identifier for new window (can be used in script to refer to the window)
		@Param: options - string of window opening options per <javascript:window.open()>
	*/
	PopUp: function(url, winname, options) {
		/*	options: status|toolbar|location|menubar|directories|resizable|scrollbars|height|width|top|left  */
		if(!winname) var winname = "POPUP_" + $WI.Random();
		var mywin = window.open(url, winname, options);
		if(mywin)	mywin.focus();
		else alert("Please turn off PopUp Blocker!");
	},
	/**
		@Name: global function $WI.Throw
		@Description: Throw a user exception (and log it)
		@Param: msg - Exception message string
		@Param: type - optional exception type string
	*/
	Throw: function(msg, type) {
		type = $WI.Check(type, 'RUNTIME ERROR');
		msg = type + ': ' + msg;
		if ($WI.Class.Logger != undefined)
			$WI.trace(msg);
		throw msg;
	},
	/**
		@Name: global function $WI.Trace
		@Description: Show a debugging message in a floating layer
		@Param: message - message to display, can contain html
		~Notes~
		To clear tracer contents, call <$WI.TraceClear>
		For more trace and log functions use $WI.Logger (<library trace>)
	*/
	Trace: function(message) {
		if(!$WI.Class.Logger)
			$WI.DOM.LoadJS({src: '/api2.0/src/javascript/trace.js', include_once: true, onload: function(){$WI.Trace(message)}.Apply(this)});
		else
			$WI.Logger.TraceWrite(message);
	},
	/**
		@Name: global function $WI.TraceClear
		@Description: Clear contents of tracer layer
	*/
	TraceClear: function() {
		if($WI.Class.Logger)
			$WI.Logger.TraceClear();
	},
	/**
		@Name: global function $WI.LogWrite
		@Description: Record a log message
		@Param: logname - Name of log
		@Param: message - Message to write into log
		@Param: flush - true to flush messages to file immediately
		~Notes~
		To write messages to server logs, call <LogFlush>
		For more trace and log functions use $WI.Logger (<library trace>)
	*/
	LogWrite: function(logname, message, flush) {
		if(!$WI.Class.Logger)
			$WI.DOM.LoadJS({src: '/api2.0/src/javascript/trace.js', include_once: true, onload: function(){$WI.LogWrite(logname, message, flush)}.Apply(this)});
		else
			return $WI.Logger.LogWrite(logname, message, flush);
	},
	/**
		@Name: global function $WI.LogFlush
		@Description: Write all logged messages to server-side files
	*/
	LogFlush: function() {
		if(!$WI.Class.Logger)
			$WI.DOM.LoadJS({src: '/api2.0/src/javascript/trace.js', include_once: true, onload: function(){$WI.LogFlush()}.Apply(this)});
		else
			return $WI.Logger.LogFlush();
	},
	/**
		@Name: global function $WI.trace
		@Description: Deprecated. Alias of <Trace()>
	*/
	trace: function(message) {
		$WI.Trace(message);
	}
};

$WI.Class.ClassObject = new $WI.Class({
	__static: {
		/**
			@Name: Super
			@Description: Return immediate superclass of this class
		*/
		Super: function() {
			return this.__extends.length ? this.__class.__extends[0] : this;
		},
		/**
			@Name: SuperClasses
			@Description: Return array of all superclasses of this class
		*/
		SuperClasses: function() {
			return $WI.Clone(this.__extends);
		},
		/**
			@Name: GetClassName
			@Description: Return canonical name of this class
			(Same as <$WI.GetClassName(this)>)
		*/
		GetClassName: function() {
			return $WI.GetClassName(this);
		},
		/**
			@Name: IsInstanceOf
			@Description: Check if this class extends class F
			@Param: F - Class/interface to test inheritance of
			(Same as <$WI.IsInstanceOf(this, F)>)
		*/
		IsInstanceOf: function(F) {
			return $WI.IsInstanceOf(this, F);
		},
		/**
			@Name: CallSuper
			@Description: Call an overloaded superclass static method
			@Param: funcname - Static method name to call (string)
			@Param: argumentarray - array of arguments to pass to superclass method
		*/
		CallSuper: function(funcname, argumentarray) {
			function findSuperClassWithMethod(c, funcname, counter) {
				var ext = c.__extends;
				for (var i = 0; i < ext.length; i++) {
					if ($WI.IsFunc(ext[i].__static[funcname])) {
						if (counter)
							return findSuperClassWithMethod(ext[i], funcname, counter - 1);
						return ext[i];
					}
				}
				return null;
			};
			if (!$WI.IsObject(this.CallSuper.recursion))
				this.CallSuper.recursion = {};
			if (typeof this.CallSuper.recursion[funcname] == 'undefined')
				this.CallSuper.recursion[funcname] = 0;
			var counter = this.CallSuper.recursion[funcname];
			var c = findSuperClassWithMethod(this, funcname, counter);
			if (!$WI.IsClass(c))
				return null;
			this.CallSuper.recursion[funcname]++;
			var val = c.__static[funcname].apply(this, argumentarray);
			this.CallSuper.recursion[funcname]--;
			return val;
		}
	},
	/**
		@Name: Static
		@Description: Return this object's class
		(Same as <this.Class>)
	*/
	Static: function() {
		return this.__class;
	},
	/**
		@Name: Super
		@Description: Return our class' immediate superclass
		(Same as <this.Class.Super()>
	*/
	Super: function() {
		return this.__class.Super();
	},
	/**
		@Name: SuperClasses
		@Description: Return array of all superclasses of this class
		(Same as <this.Class.SuperClasses()>
	*/
	SuperClasses: function() {
		return this.__class.SuperClasses();
	},
	/**
		@Name: GetClassName
		@Description: Return canonical name of this object's class
		(Same as <$WI.GetClassName(this)>)
	*/
	GetClassName: function() {
		return $WI.GetClassName(this);
	},
	/**
		@Name: IsInstanceOf
		@Description: Check if this object's class extends class F
		@Param: F - Class/interface to test inheritance of
		(Same as <$WI.IsInstanceOf(this, F)>)
	*/
	IsInstanceOf: function(F) {
		return $WI.IsInstanceOf(this, F);
	},
	/**
		@Name: __super_new
		@Description: Call superclass constructor
		~Usage~
		Use this inside a constructor method to invoke the superclass constructor
		You must call this method if you wish the superclass constructor to be executed, it will not be called automatically
	*/
	__super_new: function() {
		return this.CallSuper('__new', arguments);
	},
	/**
		@Name: CallSuper
		@Description: Call an overloaded superclass instance method
		@Param: funcname - Method name to call (string)
		@Param: argumentarray - array of arguments to pass to superclass method
	*/
	CallSuper: function(funcname, argumentarray) {
		function findSuperClassWithMethod(c, funcname, counter) {
			var ext = c.__extends;
			for (var i = 0; i < ext.length; i++) {
				if ($WI.IsFunc(ext[i].prototype[funcname])) {
					if (counter)
						return findSuperClassWithMethod(ext[i], funcname, counter - 1);
					return ext[i];
				}
			}
			return null;
		};
		if (!$WI.IsObject(this.CallSuper.recursion))
			this.CallSuper.recursion = {};
		if (typeof this.CallSuper.recursion[funcname] == 'undefined')
			this.CallSuper.recursion[funcname] = 0;
		var counter = this.CallSuper.recursion[funcname];
		var c = findSuperClassWithMethod(this.__class, funcname, counter);
		if (!$WI.IsClass(c))
			return null;
		this.CallSuper.recursion[funcname]++;
		var val = c.prototype[funcname].apply(this, argumentarray);
		this.CallSuper.recursion[funcname]--;
		return val;
	},
	/**
		@Name: Clone
		@Description: Create a copy of this object
		~Usage~
		Overload this method to modify copying logic, or to disallow cloning (call <$WI.Throw()>)
		If you overload Clone you should call <var copy = this.CallSuper('Clone')> as the first line of your method
	*/
	Clone: function() {
		var copy = $WI.Clone(this, $WI.Check(deep, true));
		copy.__objid = $WI.Class.__max_objid = $WI.Check($WI.Class.__max_objid, 0) + 1;
		return copy;
	},
	/**
		@Name: Equals
		@Description: Test whether this object is the same as another object
		@Param: obj - instance object to compare ourself to
		~Usage~
		By default this method returns true only if obj is the same instance.
		Overload this to implement custom logic that can test for datacentric equality
	*/
	Equals: function(obj) {
		return this.__objid == $WI.Check(obj.__objid, null);
	}
});

/**
	@Name: global function $E
	@Description: Return an HTML element by id
	(Shortform of <document.getElementById()>)
	~Usage~
	Can also return multiple elements in one call, e.g.:

	var el_array = $E('id1', 'id2', 'id3');
*/
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
/**
	@Name: global function $V
	@Description: Get/set the contents of/value of an HTML element by id
*/
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
			else if (key && this[i].getAttribute && this[i].getAttribute(key) == value && (!noteq || noteq != this[i]))
				return i;
		}
		return -1;
	},
	Remove: function(value, key, noteq) {
		var num = this.Search(value, key, noteq);
		if(num!=-1) this.splice(num, 1);
	},
	Append: function() {
		for (var i = 0; i < arguments.length; i++) {
			var values = arguments[i];
			for (var j = 0; j < values.length; j++)
				this.push(values[j]);
		}
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
			var copy = $WI.Method.cloneNode.call(this, deep);copy.ratio=this.ratio;
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
		if(!options.start) options.start = 0;
		if(options.libs.length==options.start){if(options.onComplete)options.onComplete.call();}
		else this.LoadJS({src: options.libs[options.start], include_once: true, onload: function(){options.start++;this.PreloadJSLibraries(options)}.Apply(this)});

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
			if(!doms[i]) return el;
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
		if(this._isIE()) {
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
		//fix for IE LEGEND element
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
			this.AddEvent({obj: img, type: 'error', onevent: function(event, _target, obj) {
				this.Fire(null, 'error', el, obj);
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
			if(!options) options = {};
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
		if (oStringList.length == 1)
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
	_getWidth: function(el, style) {
		return (!el) ? 0 : ((el.clientWidth) ? parseInt(el.clientWidth) : ((el.offsetWidth || !style) ? parseInt(el.offsetWidth) : parseInt(el.style.width)));
	},
	_getHeight: function(el, style) {
		return (!el) ? 0 : ((el.clientHeight) ? parseInt(el.clientHeight) : ((el.offsetHeight || !style) ? parseInt(el.offsetHeight) : parseInt(el.style.height)));
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
					options.byTagName&&i.tagName&&i.tagName.toLowerCase()==options.byTagName.toLowerCase() ||
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
				options.byTagName&&el.tagName&&el.tagName.toLowerCase()==options.byTagName.toLowerCase() ||
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
			if((!options[attr]&&options[attr]!==0)||attr=='backgroundImage'&&(/undefined/).test(options[attr])) continue;

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
					try{
						el.style.setProperty(property, val, '');
					}
					catch(ex){
						el.style[property] = val;
					}
				}
			}	else {
			//Fix an issue if object is inside the scollable div, only for PX
			//THIS IS A BUG NOT SURE WHAT IS THAT BY IT MUST BE REMOVED OR FIXED, BREAKS 0px
			//if((property=='left'||property=='top')&&(typeof val=='string')&&val.indexOf('%')==-1)
				//this._setScrollStyle(el, property, val);
			//else if(property=='scrollTop'||property=='scrollLeft')
			if(property=='scrollTop'||property=='scrollLeft')
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
		if(options.byParent)
			allelements = this._getDescendents(options.byParent);
		else if(options.byTagName)
			allelements = document.getElementsByTagName(options.byTagName);
		else if(options.byElement)
			allelements = [options.byElement];
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
		}
		//event passed as Function
		else if(typeof config.onevent == 'function') {
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
	AddDOMEvent: function(config) {
		return this.AddEvent(config);
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
	DispatchEvent: function(type) {
		var args = [];for(var j=1;j<arguments.length;j++)args.push(arguments[j]);
		var evObj = document.createEvent(type);
		evObj.initUIEvent.apply(evObj, args);
		window.dispatchEvent(evObj);
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
$WI.Extend($WI.Class.DOM, $WI.Class.EventManager, true, true);

/*********************************************************
*		DOM BROWSER HELPFUL STATIC METHODS
*********************************************************/
$WI._extend($WI.Class.DOM, {
	_isiFrame: function() {
		return (window.location != window.parent.location) ? true : false;
	},
	_isPortrait: function() {
		return (this._getClientWH().w < this._getClientWH().h);
	},
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

//Initialize System Class, do not remove
$WI._init();