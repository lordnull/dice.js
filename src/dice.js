var dice = {
	parse: require('./parser').parse,
	eval: require('./evaluate').eval,
	version: require('../package').version
};

function roll(str, scope){
	var parsed = dice.parse(str);
	var evaled = dice.eval(parsed, scope);
	return evaled;
};

dice.roll = roll;

dice.statistics = function(str, scope, samples){
	if(typeof(scope) == "number"){
		samples = scope;
		scope = {};
	}
	scope = scope || {};
	samples = samples || 1000;
	var resultSet = [];
	var i;
	for(i = 0; i < samples; i++){
		resultSet.push(roll(str, scope));
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
};

function stringify_expression(evaled_op){
	var sub = stringify(evaled_op.expression);
	var prefix = evaled_op.op[0];
	if(prefix === 'p'){
		prefix = '';
	}
	
	return prefix + "( " + sub + " )";
};

function stringify_op(evaled_op){
	var rs = stringify(evaled_op.rightSide);
	var ls = stringify(evaled_op.leftSide);
	return rs + ' ' + evaled_op.op + ' ' + ls;
};

function stringify_rolls(evaled_roll){
	var minStr = evaled_roll.min > 1 ? evaled_roll.min + '..' : '';
	var preamble = evaled_roll.x + evaled_roll.mode + minStr + evaled_roll.max + ':[';
	return preamble + evaled_roll.rolls.join(', ') + ']';
};

function stringify(evaled){
	if(evaled.expression){
		return stringify_expression(evaled);
	}

	if(evaled.op){
		return stringify_op(evaled);
	}

	if(evaled.rolls){
		return stringify_rolls(evaled);
	}

	return evaled.toString();
};

dice.stringify = stringify;

var k;
for(k in dice){
    exports[k] = dice[k];
}

return dice;
