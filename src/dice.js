var dice = {
	parse: require('./parser').parse,
	eval: require('./evaluate').eval,
	stringify: require('./stringify').stringify,
	ops: require('./evaluate').ops,
	version: require('../package').version,
	grammer: require('./grammerAST'),
	statistics: require('./statistics').analyse
};

function roll(str, scope){
	let parsed = dice.parse(str);
	let evaled = dice.eval(parsed, scope);
	return evaled;
};

dice.roll = roll;

var k;
for(k in dice){
    exports[k] = dice[k];
}

