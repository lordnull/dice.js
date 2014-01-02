dice = {
	version: "0.4.0",

	roll: function(str, scope){
		var parsed = dice.parse.parse(str);
		var evaled = dice.eval.eval(parsed, scope);
		return evaled;
	},

	stringify_op: function(evaled_op){
		if(evaled_op.op === "parenExpress"){
			var sub = dice.stringify(evaled_op.expression);
			return "( " + sub + " )";
		}

		var rs = dice.stringify(evaled_op.rightSide);
		var ls = dice.stringify(evaled_op.leftSide);
		return rs + ' ' + evaled_op.op + ' ' + ls;
	},

	stringify_rolls: function(evaled_roll){
		var minStr = evaled_roll.min > 1 ? evaled_roll.min + '..' : '';
		var preamble = evaled_roll.x + evaled_roll.mode + minStr + evaled_roll.max + ':[';
		return preamble + evaled_roll.rolls.join(', ') + ']';
	},

	stringify: function(evaled){
		if(evaled.op){
			return dice.stringify_op(evaled);
		}

		if(evaled.rolls){
			return dice.stringify_rolls(evaled);
		}

		return evaled.toString();
	}

};
