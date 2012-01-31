/*********************************************************
*		Calendar CLASS
*		Designed & developed by Dima Svirid, 2008
*		Class: calendar.js
*	  Extends: system.js
*		Requires: datetime.js
*		Call: $WI.Calendar(this, {format: 'dd/mm/yyyy'});
*********************************************************/
$WI.Class.Calendar = new $WI.Class({
	Create: function(options) {
		if(!$WI.DateTimeFormat) {
			alert('datetime.js Class is not loaded!');
			return;
		}
		if(options) this.options = options;
		else this.options = {};

		this._setSettings();

		this.obj = this._createDOM({objType: 'div', objClass: 'element-calendar', opacity: .9, config: {width: (this.options.width)?this._fixPx(this.options.width):null}});
		this._cancelSelect(null, true, this.obj);

		this.obj.wrapper = this._insertDOM(this.obj, {objType: 'div', objClass: 'element-calendar-wrapper'}, 'insertinto');

		this.obj.header = this._insertDOM(this.obj.wrapper, {objType: 'div', objClass: 'element-calendar-header'}, 'insertinto');
		this.obj.leftbutton = this._insertDOM(this.obj.header, {objType: 'div', objClass: 'element-calendar-button element-calendar-left-button'}, 'insertinto');
		this.obj.rightbutton = this._insertDOM(this.obj.header, {objType: 'div', objClass: 'element-calendar-button element-calendar-right-button'}, 'insertinto');
		this.obj.monthbutton = this._insertDOM(this.obj.header, {objType: 'div', objClass: 'element-calendar-button element-calendar-month-button'}, 'insertinto');
		this.obj.yearbutton = this._insertDOM(this.obj.header, {objType: 'div', objClass: 'element-calendar-button element-calendar-year-button'}, 'insertinto');
		this.obj.closebutton = this._insertDOM(this.obj.header, {objType: 'div', objClass: 'element-calendar-button element-calendar-close-button'}, 'insertinto');

		this.obj.body = this._insertDOM(this.obj.wrapper, {objType: 'div', objClass: 'element-calendar-body'}, 'insertinto');
		this._insertDOM(this.obj.body, {newNode: this._createCalendar(this.yearNow, this.monthNow)}, 'insertinto');
		this.obj.bottom = this._insertDOM(this.obj.wrapper, {objType: 'div', objClass: 'element-calendar-bottom', html: 'Today is ' + $WI.DateFormat(null, '$ddd, $d $mmm, $yyyy')}, 'insertinto');

		if(this.options.calendarType!='static') {
			this.obj.shadow = this._insertDOM(this.obj, {objType: 'img', src: '/api2.0/src/images/shadow_sharp.png', objClass: 'element-calendar-shadow png'}, 'insertinto');
			if(this._isIE6())	//IE6 transparency hack
				this.obj.iframe = this._insertDOM(this.obj, {objType: 'iframe', position: 'absolute', objClass: 'element-calendar-iframe-fix', frameBorder: 0}, 'insertinto');
		}

		this.AddEvent({obj: this.obj.header, type: 'mousedown', onevent: this._onMouseEvent});
		this.AddEvent({obj: this.obj.closebutton, type: 'click', onevent: this.CloseCalendar});
		this.AddEvent({obj: this.obj.body, type: 'mousedown', onevent: this._onMouseEvent});
	},
	Write: function(where) {
		this.SetDate();

		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');

		this.AjustDivs();

		//enable popup calendar
		if(this.options.calendarType=='static') {
			this._isDisplay(this.obj.closebutton, false);
		} else {

			var xy = this._getXY(this.options.element);
			var h = this._getHeight(this.options.element);

			if(this.options.objTop) xy.y += parseInt(this.options.objTop);
			if(this.options.objLeft) xy.x += parseInt(this.options.objLeft);

			this._applyConfig(this.obj, {position: 'absolute', top: this._fixPx(xy.y+h), left: this._fixPx(xy.x)});
			this._maxZ(this.obj);
		}

		this.AjustDivs();
	},
	GetBody: function(){
		return this.obj;
	},
	AjustDivs: function() {
		var w = this._getWidth(this.obj);
		var h = this._getHeight(this.obj);

		var hh = this._getHeight(this.obj.header);
		var hb = this._getHeight(this.obj.bottom);

		var _cellW = Math.ceil(w/8);
		var _cellH = Math.ceil((w-hh-hb)/8);

		var _columns = this.obj.body.getElementsByTagName('td');
		for(var c=0;c<_columns.length;c++)
			this._applyConfig(_columns[c], {width: this._fixPx(_cellW), height: this._fixPx(_cellH)});

		//reload w and h
		var w = this._getWidth(this.obj);
		var h = this._getHeight(this.obj);

		if(this.obj.shadow)
			this._applyConfig(this.obj.shadow, {width: this._fixPx(w), height: this._fixPx(h)});
		if(this.obj.iframe)
			this._applyConfig(this.obj.iframe, {width: this._fixPx(w), height: this._fixPx(h)});

		return;
	},
	SetMonth: function(month) {
		if(!month) var month = this.monthNow;
		else this.monthNow = month;
		this.obj.monthbutton.innerHTML = this.monthName[month];
		this.CloseMonth();
	},
	OpenMonth: function(obj) {
		if(!this.obj.monthdropdown) this._createMonthDropDown();
		var hh = this._getHeight(this.obj.header);
		var xy = this._getXY(obj, true);
		var w = this._getWidth(obj);

		this._applyConfig(this.obj.monthdropdown, {top: this._fixPx(hh-1), left: this._fixPx((this._isIE())?xy.x+2:xy.x), width: this._fixPx(w)});
		this._isDisplay(this.obj.monthdropdown, true);
		this._addClass(this.obj.monthbutton, 'element-calendar-button-mouseover');
	},
	CloseMonth: function() {
		if(!this.obj.monthdropdown) return;
		this._isDisplay(this.obj.monthdropdown, false);
		this._removeClass(this.obj.monthbutton, 'element-calendar-button-mouseover');
	},
	SetYear: function(year) {
		if(!year) var year = this.yearNow;
		else this.yearNow = year;
		this.obj.yearbutton.innerHTML = year;
		this.CloseYear();
	},
	OpenYear: function(obj) {
		if(!this.obj.yeardropdown) this._createYearDropDown();
		var hh = this._getHeight(this.obj.header);
		var xy = this._getXY(obj, true);
		var w = this._getWidth(obj);

		this._applyConfig(this.obj.yeardropdown, {top: this._fixPx(hh-1), left: this._fixPx((this._isIE())?xy.x+2:xy.x), width: this._fixPx(w)});
		this._isDisplay(this.obj.yeardropdown, true);
		this._addClass(this.obj.yearbutton, 'element-calendar-button-mouseover');
	},
	CloseYear: function() {
		if(!this.obj.yeardropdown) return;
		this._isDisplay(this.obj.yeardropdown, false);
		this._removeClass(this.obj.yearbutton, 'element-calendar-button-mouseover');
	},
	CloseCalendar: function() {
		//remove form registry first
		if(this.options.element&&this.options.element.CALENDAR_REGISTRY)
			this.options.element.CALENDAR_REGISTRY = null;

		if($WI.GLOBAL_CALENDAR_REGISTRY)
			$WI.GLOBAL_CALENDAR_REGISTRY.Remove(this.options.element);

		this._removeDOM(this.obj);
	},
	SetDate: function(month, year, markday) {
		this.SetMonth(month);
		this.SetYear(year);
		//remove all children
		var _children = this._getChildren(this.obj.body);
		for(var i=0;i<_children.length;i++)
			this._removeDOM(_children[i]);
		this._insertDOM(this.obj.body, {newNode: this._createCalendar(this.yearNow, this.monthNow, markday)}, 'insertinto');
		this.AjustDivs();
	},
	SetDateField: function(day, month, year) {
		if(day) this.dateNow = day;
		if(month) this.monthNow = month;
		if(year) this.yearNow = year;
		if(this.options.element)
			this.options.element.value = this._generateDateString()
		this.CloseCalendar();
		this.Fire(null, 'setdate', this);
		if(this.options.onSetDate) this.options.onSetDate();
	},
	PreviousMonth: function(){
		this.monthNow--;
		if(this.monthNow<0) {
			this.monthNow = 11;
			this.yearNow--;
		}
		this.SetDate(this.monthNow, this.yearNow, false);
	},
	NextMonth: function(){
		this.monthNow++;
		if(this.monthNow>11) {
			this.monthNow = 0;
			this.yearNow++;
		}
		this.SetDate(this.monthNow, this.yearNow, false);
	},
	CloseAllCalendars: function(_exclude) {
		for(var i=0;i<$WI.GLOBAL_CALENDAR_REGISTRY.length;i++) {
			var ___calendar = $WI.GLOBAL_CALENDAR_REGISTRY[i].CALENDAR_REGISTRY;
			if(_exclude&&_exclude==___calendar) continue;
			___calendar.CloseCalendar();
		}
	},
	_onMouseEvent: function(event, _target, obj) {
		if(event.type=='mousedown') {
			//day
			if(obj==this.obj.body&&_target.day) {
				this.SetDateField(_target.day);
			}
			//month
			if(_target == this.obj.monthbutton) {
				if(this.obj.monthdropdown&&this._display(this.obj.monthdropdown)) {
				 	this.CloseMonth();
				} else {
					this.OpenMonth(_target);
				}
			} else if(obj==this.obj.monthdropdown) {
				this.SetDate(_target.month, null);
			}
			//year
			if(_target == this.obj.yearbutton) {
				if(this.obj.yeardropdown&&this._display(this.obj.yeardropdown)) {
					this.CloseYear();
				} else {
					this.OpenYear(_target);
				}
			} else if(obj==this.obj.yeardropdown) {
				this.mouse_down = true;
				if(this._hasClass(_target, 'element-calendar-dropdown-minus'))
					this._minusYear();
				else if(this._hasClass(_target, 'element-calendar-dropdown-plus'))
					this._plusYear();
				else
					this.SetDate(null, _target.year);
			}
			//next month
			if(_target == this.obj.rightbutton)
				this.NextMonth();
			else if(_target == this.obj.leftbutton)
				this.PreviousMonth();

		} else if(event.type=='mouseover') {
			switch(obj) {
				case this.obj.monthdropdown:
					if(_target!=this.obj.monthdropdown) {
						this._addClass(_target, 'element-calendar-dropdown-row-mouseover');
					}
					break;
				case this.obj.yeardropdown:
					if(_target!=this.obj.yeardropdown) {
						this._addClass(_target, 'element-calendar-dropdown-row-mouseover');
					}
					break;
			}
		} else if(event.type=='mouseup') {
			this.mouse_down = false;
		} else if(event.type=='mouseout') {
			switch(obj) {
				case this.obj.monthdropdown:
					if(_target!=this.obj.monthdropdown) {
						this._removeClass(_target, 'element-calendar-dropdown-row-mouseover');
					}
					break;
				case this.obj.yeardropdown:
					if(_target!=this.obj.yeardropdown) {
						this._removeClass(_target, 'element-calendar-dropdown-row-mouseover');
					}
					break;
			}
		}
	},
	_createMonthDropDown: function() {
		this.obj.monthdropdown = this._insertDOM(this.obj.wrapper, {objType: 'div', objClass: 'element-calendar-button-mouseover element-calendar-month-dropdown', display: 'none'}, 'insertinto');

		for	(i=0;i<this.monthName.length;i++) {
			var month = this._insertDOM(this.obj.monthdropdown, {objType: 'div', objClass: 'element-calendar-dropdown-row', html: this.monthName[i]}, 'insertinto');
			month.month = i;
		}
		this.AddEvent({obj: this.obj.monthdropdown, type: 'mouseover', onevent: this._onMouseEvent});
		this.AddEvent({obj: this.obj.monthdropdown, type: 'mouseout', onevent: this._onMouseEvent});
		this.AddEvent({obj: this.obj.monthdropdown, type: 'mousedown', onevent: this._onMouseEvent});
	},
	_createYearDropDown: function() {
		this.obj.yeardropdown = this._insertDOM(this.obj.wrapper, {objType: 'div', objClass: 'element-calendar-button-mouseover element-calendar-year-dropdown', display: 'none'}, 'insertinto');

		var year_minus = this._insertDOM(this.obj.yeardropdown, {objType: 'div', objClass: 'element-calendar-dropdown-row element-calendar-dropdown-minus', html: '&nbsp;'}, 'insertinto');
		for	(var i=parseInt(this.yearNow-5);i<parseInt(this.yearNow+5);i++) {
			var year = this._insertDOM(this.obj.yeardropdown, {objType: 'div', objClass: 'element-calendar-dropdown-row', html: i}, 'insertinto');
			year.year = i;
		}
		var year_plus = this._insertDOM(this.obj.yeardropdown, {objType: 'div', objClass: 'element-calendar-dropdown-row element-calendar-dropdown-plus', html: '&nbsp;'}, 'insertinto');
		this.AddEvent({obj: this.obj.yeardropdown, type: 'mouseover', onevent: this._onMouseEvent});
		this.AddEvent({obj: this.obj.yeardropdown, type: 'mouseout', onevent: this._onMouseEvent});
		this.AddEvent({obj: this.obj.yeardropdown, type: 'mousedown', onevent: this._onMouseEvent});
		this.AddEvent({obj: this.obj.yeardropdown, type: 'mouseup', onevent: this._onMouseEvent});
	},
	_minusYear: function(plus) {
		var _children = this._getChildren(this.obj.yeardropdown);
		for	(var i=0;i<_children.length;i++) {
			if(_children[i].year) {
				(plus) ? _children[i].year++ : _children[i].year--;
				_children[i].innerHTML = _children[i].year;
			}
		}
		if(this.mouse_down) setTimeout(function(){this._minusYear(plus)}.Apply(this), 50);
	},
	_plusYear: function() {
		this._minusYear(true);
	},
	_createCalendar: function(yearSelected, monthSelected) {
		var startAt = 0;
		var	startDate =	new	Date (yearSelected,monthSelected, 1);
		var endDate	= new Date (yearSelected, monthSelected+1, 1);
				endDate	= new Date (endDate	- (24*60*60*1000));
		var	numDaysInMonth = endDate.getDate();
		var	dayPointer = startDate.getDay() - startAt;
		if (dayPointer<0)	dayPointer = 6;

		var table = this._createDOM({objType: 'table', cellSpacing: '0px', cellPadding: '0px'});
		var tr = table.tr;
		this._insertDOM(table.tr, {objType: 'td', objClass: 'element-calendar-day element-calendar-wk element-calendar-wkday', html: this.weekString}, 'insertinto');
		for	(var i=0; i<7; i++)
			this._insertDOM(table.tr, {objType: 'td', objClass: 'element-calendar-day element-calendar-wkday', html: this.dayName[i]}, 'insertinto');

		tr = this._insertDOM(table.tbody, {objType: 'tr'}, 'insertinto');
		this._insertDOM(tr, {objType: 'td', objClass: 'element-calendar-day element-calendar-wk', html: this._WeekNbr(startDate)}, 'insertinto');

		for	(var i=1; i<=dayPointer;i++)
			this._insertDOM(tr, {objType: 'td', objClass: 'element-calendar-day', html: '&nbsp;'}, 'insertinto');

		for	(var datePointer=1; datePointer<=numDaysInMonth; datePointer++)	{
			dayPointer++;

			var __day = this._insertDOM(tr, {objType: 'td', objClass: 'element-calendar-day', html: datePointer}, 'insertinto');
			__day.day  = datePointer;
			if(this.dateNow==datePointer&&this.monthNow==monthSelected&&this.yearNow==yearSelected) this._addClass(__day, 'element-calendar-day-selected');

			//if ((datePointer==this.dateNow)&&(monthSelected==this.monthNow)&&(yearSelected==this.yearNow))
			//	$WI.trace(datePointer)
			//else if	(dayPointer % 7 == (startAt * -1)+1 || dayPointer % 7 == (startAt * -1)+7)
				//$WI.trace('D: ' + datePointer)

			if ((dayPointer+startAt) % 7 == startAt) {
				tr = this._insertDOM(table.tbody, {objType: 'tr'}, 'insertinto');
				if (datePointer<numDaysInMonth)
					this._insertDOM(tr, {objType: 'td', objClass: 'element-calendar-day element-calendar-wk', html: this._WeekNbr(new Date(yearSelected,monthSelected,datePointer+1), startAt)}, 'insertinto');

			}

		}
		return table;
	},
	_WeekNbr: function(n, startAt) {
		var year = n.getFullYear();
		var month = n.getMonth() + 1;
		if (startAt == 0)
		 var day = n.getDate() + 1;
		else
		 var day = n.getDate();
		var a = Math.floor((14-month) / 12);
		var y = year + 4800 - a;
		var m = month + 12 * a - 3;
		var b = Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400);
		var J = day + Math.floor((153 * m + 2) / 5) + 365 * y + b - 32045;
		var d4 = (((J + 31741 - (J % 7)) % 146097) % 36524) % 1461;
		var L = Math.floor(d4 / 1460);
		var d1 = ((d4 - L) % 365) + L;
		var week = Math.floor(d1/7) + 1;
		return week;
  },
	_setSettings: function() {
		if(!this.options.format) this.options.format = 'dd/mm/yyyy';
		var _date = null;
		if(this.options.date)
			_date = $WI.ParseDate(this.options.date);
		else if(this.options.element)
			_date = $WI.ParseDate(this.options.element.value);
		else
			_date =	new	Date();

		this.dateNow = _date.getDate();
		this.monthNow = _date.getMonth();
		this.yearNow = _date.getYear();
		if (this.yearNow.toString().length < 4)  this.yearNow += 1900;

		if(this.monthNow>11||this.monthNow<0) this.monthNow = (new Date).getMonth();
		if(!this.yearNow) {this.yearNow = _date.getYear();if (this.yearNow.toString().length < 4) this.yearNow += 1900;}
		this._configuration();
	},
	_configuration: function() {
		this.dayName = new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
		this.monthName = new	Array("January","February","March","April","May","June","July","August","September","October","November","December");
		this.weekString = 'Wk';
	},
	_generateDateString: function() {
		var arr = this.options.format.split(this._getSeparator(this.options.format));
		var _string = '';
		var _date = new Date();

		for(var f=0;f<arr.length;f++) {
			_string += '$' + arr[f];
			if(f!=arr.length-1) _string += this._getSeparator(this.options.format);
		}
		_date.setDate(this.dateNow);
		_date.setYear(this.yearNow);
		_date.setMonth(this.monthNow);
		return $WI.DateFormat(_date, _string);
	},
	_getSeparator: function(format) {
		if((/\//i).test(format)) return '/';
		else if((/-/i).test(format)) return '-';
		else return '';
	}
});
$WI.Calendar = function(el, options) {
	if(!$WI.GLOBAL_CALENDAR_REGISTRY) $WI.GLOBAL_CALENDAR_REGISTRY = [];
	if(!$WI.GLOBAL_CALENDAR_REGISTRY.OBJECTS) $WI.GLOBAL_CALENDAR_REGISTRY.OBJECTS = [];
	if((idx = $WI.GLOBAL_CALENDAR_REGISTRY.Search(el)) != -1) return;	//cancel to show second same calendar
	options.element = el;
	var _temp = new $WI.Class.Calendar;
			_temp.Create(options);
			_temp.Write();
	if(options&&options.element) {
		$WI.GLOBAL_CALENDAR_REGISTRY.push(options.element);
		options.element.CALENDAR_REGISTRY = _temp;
	}
	//close all calendars before showing a new one
	_temp.CloseAllCalendars(_temp);
	return _temp;
};
//preload required class to format dates
$WI.DOM.LoadJS({src: '/api2.0/src/javascript/datetime.js', include_once: true});
