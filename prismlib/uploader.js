/*********************************************************
*		File Uploader CLASS
*		Designed & developed by Dima Svirid, 2007	
*		Class: uploader.js
*	  Extends: system.js
*********************************************************/
$WI.Uploader = function(options) {			
	return new $WI.Class.Uploader().OpenUpload(options);
};
$WI.Method.Uploader = {
	Progress: function(uuid, file_uuid, filename, filesize, filetype, percent, bytesLoaded, bytesTotal) {		
		$WI.Method.Uploader.OnSelect(uuid, file_uuid, filename, filesize, filetype);
		$WI.Method.Uploader.GetObject(uuid)._onProgress(file_uuid, percent, bytesLoaded, bytesTotal);			
		return;		
	},
	OnSelect: function(uuid, file_uuid, filename, filesize, filetype) {		
		$WI.Method.Uploader.GetObject(uuid)._onSelect(file_uuid, filename, filesize, filetype);
		return;		
	},
	OnIOError: function(uuid, file_uuid, filename) {
		$WI.Method.Uploader.GetObject(uuid)._onError(file_uuid, "IO error with " + filename);
		return;			
	},
	OnError: function(uuid, file_uuid, error) {
		$WI.Method.Uploader.GetObject(uuid)._onError(file_uuid, error);	
		return;			
	},
	OnSecurityError: function(uuid, file_uuid, error) {
		$WI.Method.Uploader.GetObject(uuid)._onError(file_uuid, "Security Error: " + error);	
		return;		
	},
	OnHTTPError: function(uuid, file_uuid, error) {
		$WI.Method.Uploader.GetObject(uuid)._onError(file_uuid, "HTTP Error " + error);	
		return;			
	},	
	Done: function(uuid, file_uuid, filename, filesize, filetype) {
		setTimeout(function(){this._onUploaded(file_uuid, filename, filesize, filetype)}.Apply($WI.Method.Uploader.GetObject(uuid)), 1000);
		return;		
	},	
	CloseProgress: function(uuid, file_uuid) {
		$WI.Method.Uploader.GetObject(uuid)._closeProgress(file_uuid);
		return;				
	},
	GetObject: function(uuid) {
		return eval("$WI.Object." + uuid);
	},
	SetButton: function(options) {
		var file_uuid = 'WI' + $WI.UUID().replace(/-/g,'');
		var flash_vars = '';
		if(!options.remotecall) options.remotecall = {};
		if(!options.allowed) options.allowed = '*.*';
		if(!options.description||options.description=='') options.description = 'Files: (' + options.allowed + ')';
		if(!options.maxFileSize) options.maxFileSize = '99999999999';

		if(!options.action) options.action = '/api2.0/src/php/wi_uploader.php';
		if(options.remotecall.action) options.action = options.remotecall.action;
				
		flash_vars += 'uuid=' + options.uuid + '&file_uuid=' + file_uuid + '&allowed=' + options.allowed + '&description=' + options.description + '&uploadScript=' + options.action + '&maxFileSize=' + options.maxFileSize;
		if(options.ci_uuid) flash_vars += '&ci_uuid=' + options.ci_uuid;
		if(options.remotecall.key) flash_vars += '&key=' + options.remotecall.key;
		if(options.multiple) flash_vars += '&multipleUpload=1';
		if($WI.DOM._isIE()) flash_vars += '&asynchronousUpload=0';	//fix IE bug to upload file by file, disable asynchronous upload
		else flash_vars += '&asynchronousUpload=0';		//always use 0 because of the often IO error
					
		return $WI.DOM._insertDOM(options.obj, {objType: 'span', id: options.uuid, position: 'absolute', left: '0px', top: '0px', zIndex: '1000', width: $WI.DOM._fixPx($WI.DOM._getWidth(options.obj)), height: $WI.DOM._fixPx($WI.DOM._getHeight(options.obj)), html: $WI.Flash('src', '/api2.0/src/objects/wi_uploader_v_2', 'width', '100%', 'height', '100%', 'flashvars', flash_vars, 'wmode', 'transparent')}, 'insertinto');	
	}
};
$WI.Class.Uploader = new $WI.Class({
	Create: function(options) {	
		this.options = options;
		this.upload_files = [];
		this.uploaded_files = [];
		this.uuid = 'WI' + $WI.UUID().replace(/-/g,'');
		
		this.obj = this._insertDOM(null, {objType: 'table', cellSpacing: '0px', cellPadding: '0px'});
		
		var area = this._insertDOM(this.obj.tr, {objType: 'td', height: '30px'}, 'insertinto');	
		
		//create default text area
		this.default_field = this._insertDOM(area, {objType: 'div', objClass: 'element-uploader-upload-default', html: (this.options.defaultText) ? this.options.defaultText: ''}, 'insertinto');
		//create progress bar
		this.progress = this._insertDOM(area, {objType: 'div', objClass: 'element-uploader-progress-bar', display: 'none'}, 'insertinto');	
	  //create filler
		this.progress.bar = this._insertDOM(this.progress, {objType: 'div', objClass: 'element-uploader-progress-bar-inside', width: '0%', height: '100%', html: '<font></font>'}, 'insertinto');
		
		if(this._isMac())
			this.progress.bar.innerHTML = '<img src="/api2.0/src/images/uploader/uploading.gif" style="width:60px;height:7px;" />';
		
		//create percent
		var td = this._insertDOM(this.obj.tr, {objType: 'td'}, 'insertinto');
		this.progress.percent = this._insertDOM(td, {objType: 'div', objClass: 'element-uploader-progress-percent'}, 'insertinto');
		
		this.button_area = this._insertDOM(this.obj.tr, {objType: 'td', display: 'block', position: 'relative'}, 'insertinto');		
		this.button_div = this._insertDOM(this.button_area, {objType: 'div', position: 'relative'}, 'insertinto');	
		
		this.browse_button = this._insertDOM(this.button_div, {objType: 'input', objClass: 'element-uploader-button', type: 'button', value: (this.options.browseButtonText) ? this.options.browseButtonText : 'Browse'}, 'insertinto');
		//this.cancel_button = this._insertDOM(this.button_area, {objType: 'input', objClass: 'element-uploader-button', type: 'button', value: 'Cancel', display: 'none'}, 'insertinto');
		this.file_field = this._insertDOM(this.button_area, {objType: 'input', type: 'hidden', name: (this.options.name)?this.options.name:'', value: ''}, 'insertinto');
		this.tmp_field = this._insertDOM(this.button_area, {objType: 'input', type: 'hidden', name: (this.options.name)?'tmp_' + this.options.name:'', value: ''}, 'insertinto');	

	
		if(this.options.multiple) {
			var _multiarea = this._insertDOM(this.obj.tbody, {objType: 'table', cellSpacing: '0px', cellPadding: '0px'});
			this.multi_area = this._insertDOM(this.obj.tbody, {newNode: this._createMultiArea()}, 'insertinto');				
			this._reloadFiles();
		}
		
	},	
	Write: function(where) {			
		this._insertDOM((where&&$E(where))?$E(where):null, null, 'insertinto');
		eval("$WI.Object." + this.uuid + " = this;");		
		this.AjustDivs();
		//init flash uploader, change made after the security fix in Flash 10
		this.options.obj = this.button_div;
		this.options.uuid = this.uuid;
		this.uploader_obj = $WI.Method.Uploader.SetButton(this.options);				
	},
	AjustDivs: function() {
		var w = this._getWidth(this.obj);
		var wb = this._getWidth(this.button_area);
		var wp = this._getWidth(this.progress.percent);
		this._setStyle(this.progress, 'width', this._fixPx(w-wb-wp));
	},
	AddFileNote: function(file_name, tmp_file_name) {
		this._onUploaded(tmp_file_name, file_name);
	},
	OnUploaded: function(file_uuid, filename, filesize, filetype) {		
	},
	Reset: function() {		
		this.file_field.value = '';
		this.tmp_field.value = '';
		this.upload_files = [];
		this.uploaded_files = [];
		this.default_field.innerHTML = (this.options.defaultText) ? this.options.defaultText: '';
		this._reloadFiles();
    if (this.multi_area_legend) {
		  this.multi_area_legend.innerHTML = (this.options.multipleFieldsetText) ? this.options.multipleFieldsetText : 'Uploaded Files';
    }
	},
	GetFileName: function() {		
		return this.file_field.value;
	},
	GetTmpFileName: function() {		
		return this.tmp_field.value;
	},
	GetFiles: function() {
		if(this.uploaded_files)
			return this.uploaded_files;
		else
			return [];
	},
	_createMultiArea: function() {
		var obj = this._insertDOM(null, {objType: 'tr'});
		var td = this._insertDOM(obj, {objType: 'td', colSpan: 3}, 'insertinto');
		var f = this._insertDOM(td, {objType: 'fieldset', objClass: 'element-uploader-multiple'}, 'insertinto');		
		this.multi_area_legend = this._insertDOM(f, {objType: 'legend', objClass: 'element-uploader-multiple', html: (this.options.multipleFieldsetText) ? this.options.multipleFieldsetText : 'Uploaded Files'}, 'insertinto');
		
		obj.files = this._insertDOM(f, {objType: 'div', objClass: 'element-uploader-multiple-files'}, 'insertinto');	

		return obj;
	},
	_reloadFiles: function() {		
		if(this.options.multiple && (!this.uploaded_files||this.uploaded_files.length==0)) {
			var t = "<table width=\"100%\"><tr><td align=center style=\"height:75px;background: url(/api2.0/src/images/uploader/empty.gif) no-repeat center center\">&nbsp;</tr></table>";
			this.multi_area.files.innerHTML = t;
			return;
		}		
	},
	_createFile: function(file) {
		var newfile = this._insertDOM(this.multi_area.files, {objType: 'div', objClass: 'element-uploader-multiple-file', backgroundColor: (this.upload_files.length%2)?'#efefef':''}, 'insertinto');	
		//newfile.num = num;
		
		newfile.progress = this._insertDOM(newfile, {objType: 'div', objClass: 'element-uploader-file-progress-bar'}, 'insertinto');	
	  //create filler
		newfile.progress.bar = this._insertDOM(newfile.progress, {objType: 'div', objClass: 'element-uploader-progress-bar-inside element-uploader-file-progress-bar-inside', width: '0%', html: '<font></font>'}, 'insertinto');
		//output filename
		newfile.progress.filename = this._insertDOM(newfile, {objType: 'div', objClass: 'element-uploader-filename', html: file.filename}, 'insertinto');
		//output total 
		this._insertDOM(newfile, {objType: 'div', objClass: 'element-uploader-progress-KB', html: (file.filesize ? Math.ceil(file.filesize/1024) + ' KB' : '')}, 'insertinto');	
		//output uploaded
		newfile.progress.bytes = this._insertDOM(newfile, {objType: 'div', objClass: 'element-uploader-progress-KB element-uploader-progress-KB-Done', html: '0 KB'}, 'insertinto');	
		if(this._isMac())
			newfile.progress.bytes.innerHTML = '<img src="/api2.0/src/images/uploader/uploading.gif" style="width:60px;height:7px;" />';
		newfile.remove = this._insertDOM(newfile, {objType: 'div', objClass: 'element-uploader-remove-button', visibility: 'hidden'}, 'insertinto');	
		newfile.remove.uuid = file.uuid;
		
		file.obj = newfile;
		
		this.AddEvent({obj: newfile.remove, type: 'click', onevent: this._removeFile});
		
		this._setStyle(newfile, 'top', '0px');
		//move scroller to the bottom of the files list
		this.multi_area.files.scrollTop = 1000;
		return file;
	},
	_removeFile: function(event, _target, obj) {
		var index = this.upload_files.Search(obj.uuid, 'uuid');		
		if(index != -1) this.upload_files.splice(index, 1);
		
		var index = this.uploaded_files.Search(obj.uuid, 'uuid');		
		if(index != -1) this.uploaded_files.splice(index, 1);
		
		this._removeDOM(obj.parentNode);
		this._modifyFormFields();
	},
	_modifyFormFields: function(){
		var total_size = 0;
		this.file_field.value = '';
		this.tmp_field.value = '';			
		
		for(var i=0;i<this.uploaded_files.length;i++) {
		
			if(this.file_field.value!='') this.file_field.value += ',';
			if(this.tmp_field.value!='') this.tmp_field.value += ',';
			
			this.file_field.value += this.uploaded_files[i].filename.replace(/,/g, ' ');
			this.tmp_field.value += this.uploaded_files[i].uuid;	
			
			total_size +=	this.uploaded_files[i].filesize*1;	
		}
		
		if(this.multi_area_legend) {
			var mtitle = (this.options.multipleFieldsetText) ? this.options.multipleFieldsetText : 'Uploaded Files';
			mtitle += ', Total files: ' + this.uploaded_files.length + (total_size ? ', Total size: ' + Math.ceil(total_size/1024) + ' KB' : '');
			this.multi_area_legend.innerHTML = mtitle;
		}			

	},
	_setTotal: function(){
		//update total uploader
		var total = totalLoaded = 0;
		for(var i=0; i< this.upload_files.length; i++) {
			total += this.upload_files[i].bytesTotal;
			totalLoaded += this.upload_files[i].bytesLoaded;
		}			
		var total_percent = totalLoaded*100/total;
		if(total_percent >= 100) { 
			this._isDisplay(this.default_field, true);
			this._isDisplay(this.progress, false);
			this.progress.percent.innerHTML = '';
		} else {
			this._isDisplay(this.default_field, false);
			this._isDisplay(this.progress, true);
			this.progress.percent.innerHTML = this._fixP$(totalLoaded*100/total);
			this._setStyle(this.progress.bar, 'width', this._fixP$(total_percent));				
		}
	},
	_onProgress: function(file_uuid, percent, bytesLoaded, bytesTotal) {		
		var index = this.upload_files.Search(file_uuid, 'uuid');
		var file = null;
		if(index == -1)	return false;
		else file = this.upload_files[index];
		
		file.percent = percent;
		file.bytesLoaded = bytesLoaded;
		file.bytesTotal = bytesTotal;
		
		if(file.obj) {
			file.obj.progress.bytes.innerHTML = Math.ceil(bytesLoaded/1024) + ' KB';
			this._setStyle(file.obj.progress.bar, 'width', this._fixP$(percent));	
		} else {
			this.progress.percent.innerHTML = Math.ceil(percent) + ' %';
			this._setStyle(this.progress.bar, 'width', this._fixP$(percent));	
		}
		
		if(!this.options.multiple)
			this._setTotal();
		
		return;		
	},
	_onSelect: function(file_uuid, filename, filesize, filetype) {			
		if(!this.options.multiple) {
			this.uploaded_files = [];
			this.file_field.value == '';
			this.tmp_field.value == '';
		}	
		
		//clean up the area
		if(!this.upload_files || this.upload_files.length == 0)
			if(this.multi_area)
				this.multi_area.files.innerHTML = "";
		
		//check not to run it twise
		if(this.upload_files.Search(file_uuid, 'uuid') != -1)	
			return false;
		
		var file = {uuid: file_uuid, filename: filename, filesize: filesize, filetype: filetype, obj: null, percent: 0, bytesLoaded: 0, bytesTotal: 0};
		this.upload_files.push(file);	
		
		//create a file row to show progress bar
		if(this.options.multiple) {
			var file = this._createFile(file);
			this._isDisplay(file.obj.progress, true);
		} else {
			this._isDisplay(this.default_field, false);
			this._isDisplay(this.progress, true);
		}
		return;		
	},	
	_onUploaded: function(file_uuid, filename, filesize, filetype) {		
		var index = this.upload_files.Search(file_uuid, 'uuid');
		var index_uploaded = this.uploaded_files.Search(file_uuid, 'uuid');
				
		if(index == -1)	{
			//fixing a bug in IE for a very small file upload
			this._onSelect(file_uuid, filename, filesize, filetype);
			var index = this.upload_files.Search(file_uuid, 'uuid');
			var index_uploaded = this.uploaded_files.Search(file_uuid, 'uuid');
		}
		
		var file = this.upload_files[index];
		if(file.obj) {
			//enable remove button
			this._visibility(file.obj.remove, true);
			this._isDisplay(file.obj.progress, false);
			this._addClass(file.obj.progress.filename, 'element-uploader-filename-Done');
			file.obj.progress.bytes.innerHTML = 'Done';
		}
		
		//lets update uploaded array
		if(index_uploaded != -1) return false;
		
		this.uploaded_files.push(file);		
		this._closeProgress(file_uuid);
		
		this._modifyFormFields();		

		if(!this.options.multiple)
			this.default_field.innerHTML = filename + ', ' + Math.ceil(filesize/1024) + ' KB';

		if(this._construct)
			this.OnUploaded.apply(this._construct, [file_uuid, filename, filesize, filetype]);
		else	
			this.OnUploaded(file_uuid, filename, filesize, filetype);
		return;		
	},
	_onError: function(file_uuid, error_message) {
		if(!this.options.multiple)
			alert(error_message);		
		else {
			var index = this.upload_files.Search(file_uuid, 'uuid');			
			if(index != -1) {
				var file = this.upload_files[index];
				file.obj.progress.bytes.innerHTML = 'Error';
				file.obj.progress.filename.innerHTML = error_message;
				this._isDisplay(file.obj.progress.bar, false);
			}
		}
		this._closeProgress(file_uuid);
		return;
	},
	_cancel: function(event, _target, obj) {		
		//this._isDisplay(this.uploader_obj, false);
		this._closeProgress(file_uuid);		
		//this._removeDOM(this.uploader_obj);		
		return;				
	},
	_closeProgress: function(file_uuid) {		
		if(this.options.multiple) {
			
		} else {
			this._setStyle(this.progress.bar, 'width', '0%');
			this.progress.percent.innerHTML = '';		
			this._isDisplay(this.progress, false);
			this._isDisplay(this.default_field, true);
		}
		return;				
	}
});

