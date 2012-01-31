/***********************************************************
* IMAGE PRELOADER 
*	Designed & developed by Dima Svirid, 2007	
*	Extends: system.js
*
* Specify images in an array below, to preload them before use.
* Current images will be loaded into the actual page.
************************************************************/
/*
PreloadImages: function(imgs) {
		for(var i=0;i<imgs.length;i++)
			$WI.DOM._insertDOM(null, {objType: 'img', src: imgs[i], top: '-3000px', left: '-3000px', zIndex: '-999', display: 'none'}, 'insertinto');
	},*/
$WI.Images = function() {
	$WI.System.PreloadImages([
		"images/toolbar/toolbar.gif",
		$WI.Variables.imagesURL + "prism/window_shadow.png",
		$WI.Variables.imagesURL + "prism/window.gif",
		$WI.Variables.imagesURL + "prism/window_buttons.gif",
		$WI.Variables.imagesURL + "mac/window_shadow.png",
		$WI.Variables.imagesURL + "mac/window.gif",
		$WI.Variables.imagesURL + "mac/window_buttons.gif",
		$WI.Variables.imagesURL + "xp/window_shadow.png",
		$WI.Variables.imagesURL + "xp/window.gif",
		$WI.Variables.imagesURL + "xp/window_buttons.gif",
		$WI.Variables.imagesURL + "impact/window_shadow.png",
		$WI.Variables.imagesURL + "impact/window.gif",
		$WI.Variables.imagesURL + "impact/window_buttons.gif"
		]);
};
$WI.Event.OnLoadDOM($WI.Images);