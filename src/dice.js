dice = {

	roll: function(str, scope){
		var parsed = dice.parse.parse(str);
		return dice.eval.eval(parsed, scope);
	}

};
