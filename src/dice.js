dice = {
	version: "0.5.0",

	roll: function(str, scope){
		var parsed = dice.parse.parse(dice.correctInput(str));
		var evaled = dice.eval.eval(parsed, scope);
		return evaled;
	},

	correctInput: function(input) {
		if (input.charAt(0).match(/[dw]/i)) {
			input = 1 + input;   
		}

		var match;
		while ((match = input.match(/\D[dw]\d*/i)) !== null) {
		var str = match.toString();
		var edit = str.charAt(0) + 1 + str.substring(1,str.length);
			input = input.replace(/\D[dw]\d*/i, edit);
		}
		input = input.replace(/D/g,'d').replace(/W/g,'w');
		return input;
	},

	stringify_expression: function(evaled_op){
		var sub = dice.stringify(evaled_op.expression);
		var prefix = evaled_op.op[0];
		if(prefix === 'p'){
			prefix = '';
		}
		
		return prefix + "( " + sub + " )";
	},

	stringify_op: function(evaled_op){
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
		if(evaled.expression){
			return dice.stringify_expression(evaled);
		}

		if(evaled.op){
			return dice.stringify_op(evaled);
		}

		if(evaled.rolls){
			return dice.stringify_rolls(evaled);
		}

		return evaled.toString();
	}

};
