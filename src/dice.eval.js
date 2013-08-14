dice.eval = (function(){

	var sum = function(i, a){
		return i + a;
	};

	var simplifyParsed = function(parsed){
		if(! (parsed instanceof Array)){
			parsed = [parsed];
		}

		return _.flatten(parsed);
	};

	var fixDice = function(dice){
		if(dice.min == 1){
			dice.min = function(){ return 1; };
		}

		if(dice.x == 1){
			dice.x = function(){ return 1; };
		}

		return dice;
	};

	var reduceThemBones = function(acc, diceSpec){
		if(_.contains(["+", "-", "*"], diceSpec)){
			acc.mode = diceSpec;
			return acc;
		}

		var rollRes = rollThemBones(diceSpec, acc.scope);
		var rollSum = rollRes.reduce(sum);
		acc.rolls = acc.rolls.concat(rollRes);
		if(acc.mode == "+"){
			acc.sum += rollSum;
		} else if(acc.mode == "-") {
			acc.sum -= rollSum;
		} else if(acc.mode == "*") {
			acc.sum *= rollSum;
		}
		return acc;
	};

	var rollABone = function(min, max, mode){
		if(min == max){
			return max;
		}
		var lastRes = _.random(min, max);
		if(mode == "d"){
			return lastRes;
		}
		var res = lastRes;
		while(lastRes == max){
			lastRes = _.random(min, max);
			res += lastRes;
		}
		return res;
	};

	var rollThemBones = function(diceSpec, scope){
		diceSpec = fixDice(diceSpec);
		var rng = _.range(0, diceSpec.x(scope));
		return rng.map(function(){
			return rollABone(diceSpec.min(scope), diceSpec.max(scope), diceSpec.mode);
		});
	};

	var result = {
		eval: function(parsed, scope){
			scope = scope || {};
			parsed = simplifyParsed(parsed);
			var acc = {sum: 0, mode: "+", rolls: [], 'scope':scope}
			var reduced = parsed.reduce(reduceThemBones, acc);
			return {sum: reduced.sum, rolls: reduced.rolls};
		}
	}

	return result;

})();
