/*********************************************************
*		DATE TIME FORMAT CLASS
*		Designed & developed by Dima Svirid, 2009
*		Class: datetime.js
*	  Extends: system.js
*
*********************************************************/
$WI.Method.DateTime = {
	DateTimeFormat: function(datetime, mask) {
		return this.DateFormat(datetime, this.TimeFormat(datetime, mask));
	},
	DateFormat: function(datedata, mask) {
		var datedata = this.ParseDate(datedata);
		if(!mask) return datedata;
		var date_string = '';
		var day_names = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
		var	day_value = datedata.getDay();
		var	date_value = datedata.getDate();
		var	day_text = day_names[day_value];
		var month_names = ["January","February","March","April","May","June","July","August","September","October","November","December"];
		var	month_value = datedata.getMonth();
		var month_text = month_names[month_value];
		var year_value = datedata.getFullYear();
		//increament month value for the digit output
		month_value++;

		//create year
		mask = mask.replace(/([$][y]{3,4})/g, year_value);
		mask = mask.replace(/([$][y]{1,2})/g, year_value.toString().substring(2,4));
		//create month
		mask = mask.replace(/([$][m]{4})/g, month_text);
		mask = mask.replace(/([$][m]{3})/g, month_text.substring(0,3));
		mask = mask.replace(/([$][m]{2})/g, (month_value.toString().length==1)?'0'+month_value.toString():month_value.toString());
		mask = mask.replace(/([$][m]{1})/g, month_value.toString());
		//create day and day of the week
		mask = mask.replace(/([$][d]{4})/g, day_text);
		mask = mask.replace(/([$][d]{3})/g, day_text.substring(0,3));
		mask = mask.replace(/([$][d]{2})/g, (date_value.toString().length==1)?'0'+date_value.toString():date_value.toString());
		mask = mask.replace(/([$][d]{1})/g, date_value.toString());

		return mask;
	},
	TimeFormat: function(timedata, mask) {
		var timedata = this.ParseDate(timedata);
		var hour_value = timedata.getHours();
		var minute_value = timedata.getMinutes();
		var second_value = timedata.getSeconds();
		if(hour_value<12) {
			var hour_value12 = hour_value;
			var time_mode = "AM";
		} else {
			var hour_value12 = hour_value - 12;
			var time_mode = "PM";
		}
		//create hours
		mask = mask.replace(/([$][h]{2})/g, (hour_value12.toString().length==1)?'0'+hour_value12.toString():hour_value12.toString());
		mask = mask.replace(/([$][h]{1})/g, hour_value12.toString());
		mask = mask.replace(/([$][H]{2})/g, (hour_value.toString().length==1)?'0'+hour_value.toString():hour_value.toString());
		mask = mask.replace(/([$][H]{1})/g, hour_value.toString());
		//create minutes
		mask = mask.replace(/([$][n]{2})/g, (minute_value.toString().length==1)?'0'+minute_value.toString():minute_value.toString());
		mask = mask.replace(/([$][n]{1})/g, minute_value.toString());
		//create seconds
		mask = mask.replace(/([$][s]{2})/g, (second_value.toString().length==1)?'0'+second_value.toString():second_value.toString());
		mask = mask.replace(/([$][s]{1})/g, second_value.toString());
		//create mode
		mask = mask.replace(/([$][t]{1})/g, time_mode.toString().toLowerCase());
		mask = mask.replace(/([$][T]{1})/g, time_mode.toString());

		return mask;
	},
	ParseDate: function(data) {
		var datedata = new Date();
		if (data == null || data == undefined)
			return datedata;
		if (typeof data == 'object' && typeof data.getTime == 'function') {
			datedata.setTime(data.getTime());
		}
		else if (typeof data == 'string') {
			//replace all the dashes with /, firefox could not parse dates 2010-05 ... when time is inclided
			data = data.replace(/-/ig, '/');
			var ms = Date.parse(data);
			datedata.setTime(ms);
		}
		return (datedata == 'Invalid Date') ? new Date() : datedata;
	}
};
$WI._append($WI, $WI.Method.DateTime);