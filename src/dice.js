dice = {

	version: "0.2.0",

	roll: function(str, scope){
		var parsed = dice.parse.parse(str);
		return dice.eval.eval(parsed, scope);
	}

};
