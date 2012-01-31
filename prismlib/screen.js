/*********************************************************
*		Screen class
*		controls screen functionality
*		Call: $WI.Screen.Method
*********************************************************/
$WI.Class.Screen = new $WI.Class({
	Confirm: function(options) {
		if($WI.Class.Window&&$WI.Class.Button){
			var win = new $WI.Class.Window;
			win.Create({windowType: 'dialog', label: (options.label)?options.label:'Confirm', width: '400px', height: '150px', icon: (options.icon)?options.icon:'/prism_resource/images/icons16x16/system_question.png', resize: false, buttons: false, textArea: {padding: '20px', textAlign: 'center'}});			
			win.Write();			
			win._maxZ();
			
			var t = this._insertDOM(win.GetContent(), {objType: 'table', cellSpacing: '10px', cellPadding: '10px', width: '100%'}, 'insertinto');	
			this._insertDOM(t.tr, {objType: 'td', html: options.message, textAlign: 'center', colSpan: 2}, 'insertinto');
			var tr = this._insertDOM(t.tbody, {objType: 'tr'}, 'insertinto');
			var td = this._insertDOM(tr, {objType: 'td', height: '50px', align: 'right'}, 'insertinto');				
			//create Yes Button
			var button_yes = new $WI.Class.Button;
			button_yes.Create({title: 'Yes', icon: '/prism_resource/images/icons16x16/system_yes.png', width: '50px'});					
			button_yes.Write(td);						
			button_yes.OnClickEvent(options.YesFunction);
			button_yes.AddEvent({obj: button_yes.GetBody(), type: 'click', onevent: function(){win.CloseWindow()}.Apply(win)});
			
			//create No Button
			var td = this._insertDOM(tr, {objType: 'td'}, 'insertinto');	
			var button_no = new $WI.Class.Button;
			button_no.Create({title: 'No', icon: '/prism_resource/images/icons16x16/system_delete.gif', width: '50px'});					
			button_no.Write(td);	
			button_no.AddEvent({obj: button_no.GetBody(), type: 'click', onevent: function(){win.CloseWindow()}.Apply(win)});

			//ajust window height by the body
			win.AjustHeight();
			this._centerObject(win.GetBody());							
		} else {
			if(confirm(options.message))
				options.YesFunction();
		}		
		return false;
	},
	Alert: function(options) {
		if($WI.Class.Window){
			this.DisableScreen({enableOnClick: false, effect: false});
			var win = new $WI.Class.Window;
			win.Create({label: (options.label)?options.label:'Alert!', width: '300px', height: '150px', icon: (options.icon)?options.icon:'/prism_resource/images/icons16x16/system_alert.png', resize: false, buttons: false, textArea: {padding: '20px', textAlign: 'center'}});
			win.AddEvent({type: 'closewindow', obj: win, onevent: function(){this.EnableScreen()}.Apply(this)});
			win.Write();			
			win._maxZ();
			win.GetContent().innerHTML = options.message + '<br><br><br>';	
			
			//create OK Button
			var button_yes = new $WI.Class.Button;
			button_yes.Create({title: 'OK', width: '80px', config: {align: 'center'}});					
			button_yes.Write(win.GetContent());
			button_yes.AddEvent({obj: button_yes.GetBody(), type: 'click', onevent: function(){this.CloseWindow()}.Apply(win)});
			
			//ajust window height by the body
			win.AjustHeight();
			this._centerObject(win.GetBody());	
			return win;
		} else
			alert(options.message);
		return false;
	},
	SetActiveStyleSheet: function(title) {			
		var i, a, main;
	  title = title.replace(/%20/g, " "); 
		if(title) {
	    var links = document.getElementsByTagName('link');
	    for(i = 0; (a = links[i]); i++) {
	      if (/style/.test(a.getAttribute('rel')) && a.getAttribute('title')) {
	        a.disabled = true;
	        if (a.getAttribute('title') == title)
	          a.disabled = false;						
	        else if (a.getAttribute('title') == 'IE7')
						a.disabled = false;	
	      }
	    }
		}	  
	},
	DisableScreen: function(options) {		
		if(this.screen) return false;
		if(!options) var options = {};		
		this.screen = $WI.DOM._insertDOM((options.parent)?options.parent:null, {objType: 'div', objClass: '_element-screen-disabled', opacity: .8, backgroundColor: '#000000', position: 'absolute', textAlign: 'center',	top: '0px', left: '0px', zIndex: 10000}, 'insertinto');	
		this.screen.options = options;
		this._hideElements('SELECT');
		this._hideElements('OBJECT');
		this._maxZ(this.screen);
		this.AjustScreen();
		if(options.onDisable)options.onDisable();
		this.AddEvent({obj: window, type: 'resize', onevent: function(){this.AjustScreen()}.Apply(this)});
		//enable screen on click
		if($WI.Check(options.enableOnClick, true)) 
			this.AddEvent({obj: this.screen, type: 'click', onevent: function(){this.EnableScreen()}.Apply(this)});
	},
	EnableScreen: function() {		
		if(this.screen) {
			this.RemoveEvent({obj: window, type: 'resize', onevent: function(){this.AjustScreen()}.Apply(this)});	
			this._removeDOM(this.screen);
		}
				
		if(this.screen.options)
			if(this.screen.options.onEnable)
				this.screen.options.onEnable();
		this._showElements();
		this.screen = null;
	},
	AjustScreen: function() {
		if(!this.screen) return;
		var scrl = this._getPageWH();
		this._applyConfig(this.screen, {width: this._fixPx(scrl.pageW), height: this._fixPx(scrl.pageH)});
	},
	BrowserAlert: function(options) {
		var _alert = this._insertDOM((options.objDoc) ? options.objDoc : null, {objType: 'div', overflow: 'hidden', width: '100%', height: '20px', color: '#000000', backgroundColor: '#ffffe1', borderBottom: '2px ridge #cccccc', position: 'absolute', zIndex: 999999, top: '-30px', left: '0px', cursor: 'pointer', display: 'none'}, 'insertinto');
		var table = this._insertDOM(_alert, {objType: 'table', width: '100%'}, 'insertinto');			
		var td = this._insertDOM(table.tr, {objType: 'td', width: '25px', vAlign: 'top'}, 'insertinto');	
		this._insertDOM(td, {objType: 'img', display: 'block', width: '16px', height: '16px', src: (options.icon)?options.icon:'/prism_resource/images/icons16x16/system_alert.png', objClass: 'png'}, 'insertinto');	

		_alert.txt = this._insertDOM(table.tr, {objType: 'td', font: 'menu', whiteSpace: 'nowrap', html: options.message}, 'insertinto');	
		//create close button
		var td = this._insertDOM(table.tr, {objType: 'td', textAlign: 'right', vAlign: 'top'}, 'insertinto');	
		var _delete = this._insertDOM(td, {objType: 'img', align: 'right', display: 'block', width: '16px', height: '16px', src: '/prism_resource/images/icons16x16/system_close.gif'}, 'insertinto');
		
		this.AddEvent({obj: _alert, type: 'click', onevent: function(){this._removeDOM(_alert);}});
		this.AddEvent({obj: _alert, type: 'mouseover', onevent: function(){this._setStyle(_alert, 'backgroundColor', '#001c84');this._setStyle(_alert.txt, 'color', '#ffffff');}});
		this.AddEvent({obj: _alert, type: 'mouseout', onevent: function(){this._setStyle(_alert, 'backgroundColor', '#ffffe1');this._setStyle(_alert.txt, 'color', '#000000');}});
		
		if($WI.Class.Animation)
			new $WI.Animation({obj: _alert, style: 'top', from: -30, to: 0, speed: 20});
		else
			this._setStyle(_alert, 'top', '0px');					
		
		this._maxZ(_alert);
		this._isDisplay(_alert, true);
		
		if(options.timeout) {
			setTimeout(function(){$WI.DOM._removeDOM(_alert);}, options.timeout*1000);
		}
	}	
});
$WI.Screen = new $WI.Class.Screen();
