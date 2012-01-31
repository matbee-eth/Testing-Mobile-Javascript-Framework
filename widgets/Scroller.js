$WI.Class.Scroller = new $WI.Class({
	__extends: [$WI.Class.Widget],
	__construct: function() {
		this.addClass("scroller");
		// this.setHeight("300px");
		document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
		var listdoc = this._dom.getElementsByTagName("ul")[0];
		var list = listdoc.getElementsByTagName("li");
		var height = 0;
		for (var i = 0; i < list.length; i++) {
			var elem = list[i];
			height += elem.offsetHeight;
		}
		
		// alert();
		// listdoc.style.height = height+"px";
		var height = (window.innerHeight >= height) ? height : window.innerHeight;
		this.setHeight(height+"px");
		// navigator.notification.showBanner(this.getHeight());
		this._scroller = new iScroll(this._dom, {
				onBeforeScrollStart: function (e) {
					var target = e.target;
					while (target.nodeType != 1) {
						target = target.parentNode;
					}
					if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
						e.preventDefault();
					}
				}
			});
	},
	addItem: function(item) {
		var li = document.createElement('li');
		li.appendChild(item);
		this._dom.getElementsByTagName("ul")[0].appendChild(li);
		this._scroller.refresh();
	},
	refresh: function() {
		this._scroller.refresh();
	}
});

$WI.Scroller = function(dom) {
	var scroller = new $WI.Class.Scroller();
	scroller.setDom(dom);
	return $WI.chain(scroller).__construct();
}