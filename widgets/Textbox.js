$WI.Class.TextBox = new $WI.Class({
	__extends: [$WI.Class.Widget],
	__construct: function() {
		this._inputElement = document.createElement('input');
		this._inputElement.type = "text";
		this.addClass("textbox");
		this._dom.appendChild(this._inputElement);
		if (this.onInput)
		this._inputElement.onchange = this.onInput.Apply(this);
	},
	update: function() {
		
	},
	setMaxLength: function(length) {
		this._inputElement.maxLength = length;
	},
	setMinLength: function(length) {
		this._minLength = length;
	},
	onInput: function(event) {
		if (this._onchangeCallback) {
			this._onchangeCallback(event);			
		}
	},
	validate: function() {
		return ((this.getText().length >= this._minLength) && (this.getText().length <= this._maxLength));
	},
	getText: function() {
		return this._inputElement.value;
	},
	setHint: function(hint) {
		// this._hint = hint;
		this._inputElement.placeholder = hint;
	},
	setCallback: function (callback) {
		this._onchangeCallback = callback;
	}
});

$WI.TextBox = function (div, data) {
	var textBox = new $WI.Class.TextBox();
	textBox.setDom(div);
	textBox.__construct();

	textBox.setHint(div.getAttribute('hintText'))
	textBox.setMinLength(div.getAttribute('minLength'));
	textBox.setMaxLength(div.getAttribute('maxLength'));

	if (data.onchange) {
		textBox.setCallback(data.onchange);
	}
	return $WI.chain(textBox).update();
}