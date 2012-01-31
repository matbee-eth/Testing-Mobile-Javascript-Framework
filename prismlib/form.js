/*********************************************************
*		FORM ELEMENTS
*		Form element manipulation, static methods
*		Designed & developed by Dima Svirid, 2007	
*		Class: form.js
*	  Extends: system2.0.js
*********************************************************/
$WI.Method.Form = {
   ToObject: function(frm) {
		if(!frm) return null;
		if(!$WI.IsArray(frm)) var frm = frm.elements;
		var obj = {};
		for(var i=0;i<frm.length;i++) 		
			if(frm[i]&&frm[i].type&&frm[i].name)
				obj[frm[i].name] = escape($V(frm[i]));
		return obj;
	},
	ToString: function(frm) {
		if(!frm) return null;
		if(!$WI.IsArray(frm)) var frm = frm.elements;
		var str = "";		
		for(var i=0;i<frm.length;i++) 		
			if(frm[i]&&frm[i].type&&frm[i].name)
				str += "&" + frm[i].name + "=" + escape($V(frm[i]));
		return str;
	},
	Get: function(frm, val) {
		var str = [];		
		for(var i=0;i<frm.elements.length;i++) 		
			if(frm.elements[i]&&frm.elements[i].type&&frm.elements[i].name)
				if(frm.elements[i].name == val)
					str.push(frm.elements[i]);
		if(str.length==1)	return str[0];
		else if(str.length>1)	return str;
		else return null;
	},
	isEmail: function(email) {		
		var filter=/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;		
		if (filter.test(email)) return true;
		else return false;
	},
	input: function(element, value) {
    if($WI.Check(value, false) !== false) {
			switch (element.type.toLowerCase()) {
	      case 'checkbox':
					if(element.value==value)
						element.checked = true;
					break;
	      case 'radio':
				 	var radios = element.form[element.name];
				 	if(!radios) radios = element.form.elements;		
					if(radios) {
					for(var r=0;r<radios.length;r++)
						if(radios[r].type == 'radio' && radios[r].name == element.name && radios[r].value == value) {
							radios[r].checked = true;
							break;
						}
				 break;
				 }
   	 	}		
		}
		switch (element.type.toLowerCase()) {
      case 'checkbox':
				return $WI.Method.Form.inputSelector(element);
      case 'radio':
       	var radios = element.form[element.name];       	
       	if(!radios) radios = element.form.elements;				
       	if(radios) {
					for(var r=0;r<radios.length;r++){		
						if(radios[r].type == 'radio' && radios[r].name == element.name && radios[r].checked) 
							return [radios[r].name, radios[r].value];
					}
				}
				return '';      	
			default:
        return $WI.Method.Form.textarea(element, value);
    }
    return false;
  },
  inputSelector: function(element) {
    if (element.checked)
      return [element.name, element.value];
		else
			return [element.name, 0];
  },
  textarea: function(element, value) {
		if($WI.Check(value, false) !== false)	element.value = value;
		return [element.name, element.value];
  },
  select: function(element, value) {
    if($WI.Check(value, false) !== false)	element.value = value;
		return $WI.Method.Form[element.type=='select-one'?'selectOne':'selectMany'](element);
  },
  selectOne: function(element, value) {
    if($WI.Check(value, false) !== false)	element.value = value;
		var value = '', opt, index = element.selectedIndex;
    if (index >= 0) {
      opt = element.options[index];
      value = opt.value;
    }
    return [element.name, value];
  },
  selectMany: function(element, value) {
    if($WI.Check(value, false) !== false)	element.value = value;
		var value = [];
    for (var i = 0; i < element.length; i++) {
      var opt = element.options[i];
      if (opt.selected)
        value.push(opt.value.replace(/,/g, "$comma;"));
    }
    return [element.name, value];
  }
};