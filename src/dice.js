dice = {
	version: "0.7.0",

	roll: function(str, scope){
		var parsed = dice.parse.parse(str);
		var evaled = dice.eval.eval(parsed, scope);
		return evaled;
	},

	statistics: function(str, scope, samples){
		if(typeof(scope) == "number"){
			samples = scope;
			scope = {};
		}
		scope = scope || {};
		samples = samples || 1000;
		var resultSet = [];
		var i;
		for(i = 0; i < samples; i++){
			resultSet.push(dice.roll(str, scope));
		}
		var mean = resultSet.reduce(function(n, acc){ return n + acc; }, 0) / samples;
		var min = resultSet.reduce(function(n, acc){ return n < acc ? n : acc; }, resultSet[0]);
		var max = resultSet.reduce(function(n, acc){ return n > acc ? n : acc; }, resultSet[0]);
		return {
			'results': resultSet,
			'mean': mean,
			'min': parseInt(min.toFixed()),
			'max': parseInt(max.toFixed())
		};
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
