$WI.Method.Chain = {
	chain: function(obj) {
		for (var fn in obj) {
                if (typeof obj[fn] == "function") {
                    obj[fn] = obj[fn].chain();
                }
    	}
        return obj;
	}
};
$WI._append($WI, $WI.Method.Chain);