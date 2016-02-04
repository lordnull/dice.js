
function makeSeq(endIndex){
	var seq = [];
	seq[endIndex] = true;
	for(var i = 0; i < seq.length; i++){
		seq[i] = true;
	}
	return seq;
};

var ops = {

	'static': function(){
		var outValue = this.value;
		return function(){
			return outValue;
		};
	},

	'lookup': function(){
		var variableName = this.value;
		return function(scope){
			var undef;
			var out = scope[variableName];
			if(out != undef){
				return out;
			}
			var split = variableName.split('.');
			if(variableName == split){
				return out;
			}
			reduceRes = split.reduce(function(acc, elem){
				if(acc == undef){
					return;
				}
				return acc[elem];
			}, scope);
			return reduceRes;
		}
	},

	'floor': function(value){
		return function(scope){
			var floorable = value(scope);
			var tots = new Number(Math.floor(floorable));
			tots.op = 'floor';
			tots.expression = floorable;
			return tots;
		}
	},

	'ceil': function(value){
		return function(scope){
			var ceilable = value(scope);
			var tots = new Number(Math.ceil(ceilable));
			tots.op = 'ceil';
			tots.expression = ceilable;
			return tots;
		}
	},

	'round': function(value){
		return function(scope){
			var roundable = value(scope);
			var tots = new Number(Math.round(roundable));
			tots.op = 'round';
			tots.expression = roundable;
			return tots;
		}
	},

	'd': function(numRolls, minMax){
		return function(scope){
			var x = numRolls(scope);
			var seq = makeSeq(x - 1);
			var outMin, outMax;
			var rolled = seq.map(function(){
				var rolledRet = minMax(scope);
				outMin = rolledRet.min;
				outMax = rolledRet.max;
				return rolledRet;
			});
			var out = rolled.reduce(function(sum, val){
				return sum + val;
			}, 0);
			out = new Number(out);
			out.rolls = rolled;
			out.min = outMin;
			out.max = outMax;
			out.x = x;
			out.mode = 'd';
			return out;
		};
	},

	'w': function(numRolls, minMax){
		return function(scope){
			var x = numRolls(scope);
			var seq = makeSeq(x - 1);
			var outMin, outMax;
			var rolled = seq.map(function(){
				var lastRolled = minMax(scope);
				var wildrolled = 0;
				outMin = minMax.min;
				outMax = minMax.max;
				if(minMax.min === minMax.max){
					return lastRolled;
				}
				while(lastRolled === minMax.max){
					wildrolled += lastRolled;
					lastRolled = mimMax(scope);
				}
				return wildrolled;
			});
			var out = rolled.reduce(function(sum, val){
				return sum + val;
			}, 0);
			out = new Number(out);
			out.rolls = rolled;
			out.min = outMin;
			out.max = outMax;
			out.x = x;
			out.mode = 'w';
			return out;
		};
	},

	'random': function(minFun, maxFun){
		return function(scope){
			var rawRandom = Math.random();
			var max = maxFun(scope);
			var min = minFun(scope);
			var diff = max - min;
			var rawRandom = diff * rawRandom;
			var rndNumber = Math.round(rawRandom + min);
			rndNumber = new Number(rndNumber);
			rndNumber.min = min;
			rndNumber.max = max;
			return rndNumber;
		};
	},

	'+': function(v1, v2){
		return function(scope){
			var rightSide = v1(scope);
			var leftSide = v2(scope);
			var sum = rightSide + leftSide;
			sum = new Number(sum);
			sum.op = '+';
			sum.rightSide = rightSide;
			sum.leftSide = leftSide;
			return sum;
		};
	},

	'-': function(v1, v2){
		return function(scope){
			var rightSide = v1(scope);
			var leftSide = v2(scope);
			var sum = rightSide - leftSide;
			sum = new Number(sum);
			sum.op = '-';
			sum.rightSide = rightSide;
			sum.leftSide = leftSide;
			return sum;
		};
	},

	'*': function(v1, v2){
		return function(scope){
			var rightSide = v1(scope);
			var leftSide = v2(scope);
			var tots = rightSide * leftSide;
			tots = new Number(tots);
			tots.op = '*';
			tots.rightSide = rightSide;
			tots.leftSide = leftSide;
			return tots;
		};
	},

	'/': function(v1, v2){
		return function(scope){
			var rightSide = v1(scope);
			var leftSide = v2(scope);
			var tots = rightSide / leftSide;
			tots = new Number(tots);
			tots.op = '/';
			tots.rightSide = rightSide;
			tots.leftSide = leftSide;
			return tots;
		};
	},

	'paren_express': function(op){
		return function(scope){
			var tots = op(scope);
			outtots = new Number(tots);
			outtots.op = 'paren_express';
			outtots.expression = tots;
			return outtots;
		};
	}

};

function resolve_ops(args){
	args = args || [];
	return args.map(resolve_op);
};

function resolve_op(opObj){
	var subArgs = resolve_ops(opObj.args);
	return ops[opObj.op].apply(opObj, subArgs);
};


exports.eval = function(parsed, scope){
	scope = scope || {};
	var ops = resolve_op(parsed)
	return ops(scope);

	/*var acc = {sum: 0, mode: "+", rolls: [], 'scope':scope}
	var reduced = parsed.reduce(reduceThemBones, acc);
	return {sum: reduced.sum, rolls: reduced.rolls};*/
}

exports.ops = ops;

