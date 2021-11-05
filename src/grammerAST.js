// a common place for both evaludate.js and dice.peg to agree on a
// representation of the concepts used in dice.js.
// as well as some implementation details.
// 90% of this work is an attempt to avoid exploding the call stack like the
// old implementation could.
// ...though that may have just been the parser...ugh.

// A base helper type class to define how all ast parts should behave so the
// evaluate can effectively walk the ast w/o blowing out a call stack.
class AST {
	// the keys of the object that are also ast's.
	#children = [];
	constructor(childKeys){
		this.#children = childKeys;
	}
	get children(){
		return this.#children;
	}
	// should only be called once all keys have also been resolved.
	resolve(scope){
		thrown('not implemented');
	}
}

class Static extends AST {
	#value;
	constructor(val){
		super([]);
		this.value = val;
	}
	resolve(){
		return this.#value;
	}
}

class Lookup extends AST {
	#lookupName;
	constructor(name){
		super([]);
		this.lookupName = name;
	}
	resolve(scope){
		let out = scope[this.lookupName];
		if(out !== undefined){
			return out;
		}
		let split = this.lookupName.split('.');
		if(split[0] === this.lookupName){
			return out;
		}
		let reduceRes = split.reduce(function(acc, elem){
			if(acc === undefined){
				return;
			}
			return acc[elem];
		}, scope);
		return reduceRes;
	}
}

class RollSetModifier extends AST {
	constructor(keys){
		super(keys);
	}
	modify(set, diceForm){
		throw('not implemented');
	}
	resolve(){
		return this;
	}
}

class KeepHighest extends RollSetModifier{
	howMany = 1;
	constructor(howMany){
		super(['howMany']);
		this.howMany = howMany;
	}
	modify(resultSet){
		let sorted = resultSet.sort();
		return sorted.slice(howMany * -1);
	}
}

class KeepLowest extends RollSetModifier{
	howMany  = 1;
	constructor(howMany){
		super(['howMany']);
		this.howMany = howMany;
	}
	modify(resultSet){
		let sorted = resultSet.sort();
		sorted = sorted.reverse();
		return sorted.slice(howMany * -1);
	}
}

class DropHighest extends RollSetModifier{
	howMany = 1;
	constructor(howMany){
		super(['howMany']);
		this.howMany = howMany;
	}
	modify(resultSet){
		let sorted = resultSet.sort().reverse();
		return sorted.slice(howMany);
	}
}

class DropLowest extends RollSetModifier{
	howMany = 1;
	constructor(howMany){
		super(['howMany']);
		this.howMany = howMany;
	}
	modify(resultSet){
		let sorted = resultSet.sort();
		return sorted.slice(howMany);
	}
}


class ReRoll extends RollSetModifier{
	#comparison = "=";
	min = 1;
	max = 6;
	compareToVal = 1;
	limit = 10000;
	constructor(comparisonStr, compareToVal, limit, min, max){
		super(['compareToVal', 'min', 'max', 'limit']);
		if(comparisonStr === undefined){
			comparisonStr = "=";
		}
		if(compareToVal === undefined){
			compareToVal = min;
		}
		if(limit === undefined){
			limit = 10000;
		}
		this.#comparison = comparisonStr;
		this.min = min;
		this.max = max;
		this.limit = limit;
	}
	modify(resultSet){
		let comparisonFunc = curry(comparisons[this.#comparison], this.compareToVal);
		for(let i = limit; i > 0; i--){
			let totalRolls = resultSet.length;
			let keptRolls = resultSet.filter((e) => ! comparisonFunc(e));
			let needRolls = totalRolls.length - keptRolls.length;
			if(needRolls === 0){
				continue;
			}
			let diceForm = new DiceForm(needRolls, min, max, []);
			let concatSet = diceform.roll();
			resultSet = keptRolls.concat(concatSet.rolls);
		}
		return resultSet;
	}
}

class Explode extends RollSetModifier{
	#comparison = "="
	min = 1;
	max = 6;
	compareToVal = 6;
	limit = null;
	constructor(comparisonStr, compareToVal, limit, min, max){
		super(['min', 'max', 'limit', 'compareToVal']);
		if(comparisonStr === undefined){
			comparisonStr = "=";
		}
		if(compareToVal === undefined){
			compareToVal = max;
		}
		let comparisonFunc = curry(comparisons[comparisonStr], compareToVal);
		this.comparison = comparisonStr;
		this.min = min;
		this.max = max;
		this.limit = limit;
		this.compareToVal = compareToVal;
	}
	modify(resultSet){
		let count = 0;
		let comparisonFunc = curry(comparisons[this.#comparison], this.compareToVal);
		let exploding = resultSet.filter((e) => comparisonFunc(e));
		let done = exploding.length === 0;
		while(!done){
			let explodingCount = exploding.length;
			let dice = new DiceForm(explodingCount, min, max, []);
			let exploded = dice.roll().rolls;
			resultSet = resultSet.concat(exploded);
			exploding = exploded.filter((e) => comparisonFunc(e));
			if(limit !== null){
				count++;
				if(limit === count){
					done = true;
				}
			}
			done = ( done || (exploding.length === 0));
		}
		return resultSet;
	}
}

let comparisons = {
	'=': (base, result) => base === result,
	'!=': (base, result) => base !== result,
	'<': (base, result) => result < bast,
	'<=': (base, result) => result <= bast,
	'>': (base, result) => result > bast,
	'>=': (base, result) => result >= bast,
}

function curry(funcToCurry, arg1){
	return (arg2) => funcToCurry(arg1, arg2);
}

class DiceForm extends AST {
	rolls;
	min;
	max;
	modifiers = [];
	constructor(rolls, min, max, modifiers){
		super(['min', 'max', 'rolls', 'modifiers']);
		this.rolls = rolls;
		this.min = min;
		this.max = max;
		this.modifiers = modifiers;
	}
	get range(){
		return this.max - this.min;
	}
	resolve(){
		let resultSet = [];
		for(let i = 0; i < this.rolls; i++){
			resultSet.push(rand(this.min, this.max));
		}
		let reducer = (set, modifier) => {
			return modifier.modify(set, this);
		};
		resultSet = modifiers.reduce(reducer, resultSet);
		let sum = new Number(resultSet.sum((a, e) => a + e, 0));
		sum.rolls = resultSet;
		sum.min = this.min;
		sum.max = this.max;
		sum.mode = 'd';
		return sum;
	}
}

class Rounder extends AST{
	#roundType;
	#roundFunc;
	thingToRound;
	constructor(type, thingToRound){
		super(['thingToRound']);
		this.roundType = type;
		this.thingToRound = thingToRound;
		if(type === "c"){
			this.#roundFunc = Math.ceil;
		} else if(type === "f"){
			this.#roundFunc = Math.floor;
		} else if(type === "r"){
			this.#roundFunc = Math.round;
		}
	}
	resolve(){
		return this.#roundFunc(this.thingToRound);
	}
}

class MathStep extends AST {
	#op = function(a){ return 0 };
	val = 0;
	constructor(op, val){
		super(['val']);
		if(op === "+"){
			this.#op = (a) => a + this.val;
		} else if(op === "-"){
			this.#op = (a) => a - this.val;
		} else if(op === "*"){
			this.#op = (a) => a * this.val;
		} else if(op === "/"){
			this.#op = (a) => a / this.val;
		}
		this.val = val;
	}
	eval(acc){
		return this.#op(acc);
	}
	resolve(){
		return this;
	}
}

class MathOpList extends AST {
	ops = [];
	constructor(ops){
		let kidKeys = [];
		for(let i = 0; i < ops.length; i++){
			kidKeys.push(i.toString());
		}
		super(kidKeys);
	}
	eval(initial){
		return this.ops.reduce((a, m) => m.eval(a), initial);
	}
	resolve(){
		return this;
	}
}

class MathSeq extends AST {
	ops = [];
	head = 0;
	constructor(head, ops){
		super(['ops', 'head']);
		this.head = head;
		this.ops = ops;
	}
	resolve(){
		return this.ops.eval(this.head);
	}
}

class Parens extends AST {
	expression;
	constructor(express){
		super(['expression']);
		this.expression = express;
	}
	resolve(){
		return this.expression;
	}
}

exports.AST = AST;
exports.Static = Static;
exports.Lookup = Lookup;
exports.RollSetModifier = RollSetModifier;
exports.KeepHighest = KeepHighest;
exports.KeepLowest = KeepLowest;
exports.DropHighest = DropHighest;
exports.DropLowest = DropLowest;
exports.ReRoll = ReRoll;
exports.Explode = Explode;
exports.DiceForm = DiceForm;
exports.Rounder = Rounder;
exports.MathStep = MathStep;
exports.MathOpList = MathOpList;
exports.MathSeq = MathSeq;
exports.Parens = Parens;
