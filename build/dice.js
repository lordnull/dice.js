(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dice = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports={
  "name": "dice.js",
  "version": "1.0.0",
  "description": "A parser and evaluator for a useful rpg dice syntax.",
  "main": "build/dice.js",
  "directories": {
    "test": "tests"
  },
  "devDependencies": {
    "browserify": "^17.0.0",
    "jasmine": "^3.10.0",
    "jasmine-browser-runner": "^0.9.0",
    "jasmine-core": "^3.10.1",
    "jasmine-node": "^3.0.0",
    "peggy": "^1.2.0"
  },
  "scripts": {
    "test": "make test"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/lordnull/dice.js.git"
  },
  "keywords": [
    "rpg",
    "dice",
    "parser",
    "roll",
    "peg"
  ],
  "author": "Micah Warren (Lord Null)",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/lordnull/dice.js/issues"
  },
  "homepage": "https://github.com/lordnull/dice.js"
}

},{}],2:[function(require,module,exports){
var dice = {
	parse: require('./parser').parse,
	eval: require('./evaluate').eval,
	ops: require('./evaluate').ops,
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

	var parsed = dice.parse(str);

	var minMaxPossible = determine_min_max_possible(parsed, scope);

	return {
		'results': resultSet,
		'mean': mean,
		'min': parseInt(min.toFixed()),
		'max': parseInt(max.toFixed()),
		'min_possible': minMaxPossible[0],
		'max_possible': minMaxPossible[1]
	};
};

function determine_min_max_possible(opObject, scope){
	if(opObject.op == 'static'){
		return [opObject.value, opObject.value];
	}
	if(opObject.op == 'lookup'){
		var lookup = dice.ops.lookup.call(opObject, scope);
		return [lookup(scope), lookup(scope)];
	}
	if(opObject.op == 'floor'){
		var minmax = determine_min_max_possible(opObject.args[0], scope);
		return [Math.floor(minmax[0]), Math.floor(minmax[1])];
	}
	if(opObject.op == 'ceil'){
		var minmax = determine_min_max_possible(opObject.args[0], scope);
		return [Math.ceil(minmax[0]), Math.ceil(minmax[1])];
	}
	if(opObject.op == 'round'){
		var minmax = determine_min_max_possible(opObject.args[0], scope);
		return [Math.round(minmax[0]), Math.round(minmax[1])];
	}
	if(opObject.op == 'd'){
		var multipleMinMax = determine_min_max_possible(opObject.args[0], scope);
		var randPartMinMax = determine_min_max_possible(opObject.args[1], scope);
		var min = randPartMinMax[0] * multipleMinMax[0];
		var max = randPartMinMax[1] * multipleMinMax[1];
		return [min, max];
	}
	if(opObject.op == 'w'){
		var multipleMinMax = determine_min_max_possible(opObject.args[0], scope);
		var randPartMinMax = determine_min_max_possible(opObject.args[1], scope);
		var min = randPartMinMax[0] * multipleMinMax[0];
		var max = randPartMinMax[1] * multipleMinMax[1];
		return [min, max];
	}
	if(opObject.op == 'random'){
		var minMinMax = determine_min_max_possible(opObject.args[0], scope);
		var maxMinMax = determine_min_max_possible(opObject.args[1], scope);
		return [minMinMax[0], maxMinMax[1]];
	}
	if(opObject.op == 'sum'){
		var minMaxes = opObject.addends.map(function(sumOp){
			return [sumOp[0], determine_min_max_possible(sumOp[1], scope)];
		});
		var minMaxInit = minMaxes.shift();
		var min = minMaxes.reduce(function(acc, sumOp){
			if(sumOp[0] === '+'){
				return acc + sumOp[1][0];
			} else {
				return acc - sumOp[1][1];
			}
		}, minMaxInit[1][0]);
		var max = minMaxes.reduce(function(acc, sumOp){
			if(sumOp[0] === '+'){
				return acc + sumOp[1][1];
			} else {
				return acc - sumOp[1][0];
			}
		}, minMaxInit[1][1]);
		return [min, max];
	}
	if(opObject.op == 'mult'){
		var minMaxes = opObject.multiplicants.map(function(multOp){
			return [multOp[0], determine_min_max_possible(multOp[1], scope)];
		});
		var minMaxInit = minMaxes.shift();
		var min = minMaxes.reduce(function(acc, multOp){
			if(multOp[0] === '*'){
				return acc * multOp[1][0];
			} else {
				return acc / multOp[1][1];
			}
		}, minMaxInit[1][0]);
		var max = minMaxes.reduce(function(acc, multOp){
			if(multOp[0] === '*'){
				return acc * multOp[1][1];
			} else {
				return acc / multOp[1][0];
			}
		}, minMaxInit[1][1]);
		return [min, max];
	}
	if(opObject.op == 'paren_express'){
		return determine_min_max_possible(opObject.args[0], scope);
	}
}

function stringify_expression(evaled_op){
	var sub = stringify(evaled_op.expression);
	var prefix = evaled_op.op[0];
	if(prefix === 'p'){
		prefix = '';
	}
	
	return prefix + "( " + sub + " )";
};

function stringify_op(evaled_op){
	if(evaled_op.op === 'sum'){
		return stringify_seq(evaled_op.addends);
	}
	if(evaled_op.op === 'mult'){
		return stringify_seq(evaled_op.multiplicants);
	}
	var rs = stringify(evaled_op.rightSide);
	var ls = stringify(evaled_op.leftSide);
	return rs + ' ' + evaled_op.op + ' ' + ls;
};

function stringify_seq(sequence){
	var allThings = [];
	sequence.map(function(opRes){
		var op = opRes[0];
		var res = stringify(opRes[1]);
		allThings.push(op);
		allThings.push(res);
	});
	allThings.shift();
	return allThings.join(" ");
}

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


},{"../package":1,"./evaluate":3,"./parser":5}],3:[function(require,module,exports){

let grammer = require("./grammerAST");

/*function makeSeq(endIndex){
	var seq = [];
	seq[endIndex] = true;
	for(var i = 0; i < seq.length; i++){
		seq[i] = true;
	}
	return seq;
};*/

// got an ast.
// keys to resolve, and the actual constructor.
// resolving ast; keys done; keys left.
// foreach keys left:
// get key value.
// if 'resolveable':
//     add new resolving to stack,
//     resolveing ast; keys done = []; keys left = resolvalble.keys
//     continue
// else
//     move key to keys done w/ value
// end
// if keys left === []
//     resolved = new resolveable w/ keys
//     pop stack
//     move top of keys left keys to done w/ value.
// end

class ResolveEngine {
	#resolving;
	#keysLeft;
	#currentKey;
	#done = false;
	constructor(thing){
		this.#resolving = thing;
	}
	get done(){
		return this.#done;
	}
	get currentKey(){
		return this.#currentKey;
	}
	get resolving(){
		return this.#resolving;
	}
	start(){
		this.#keysLeft = new Set(this.#resolving.children).keys();
		this.#done = false;
		return this.next();
	}
	setResolving(value){
		this.#resolving[currentKey] = value;
	}
	next(){
		let out = this.#keysLeft.next();
		this.#currentKey = out.value;
		this.#done = out.done;
		out.value = this.#resolving[out.value];
		return out;
	}
}

function resolve_parsed(ast, scope){
	let stepStack = [];
	let currentStep = new ResolveEngine(ast);
	currentStep.start();
	let done = false;
	while(! done){
		let kid = currentStep.next();
		if(kid === undefined){
			if(stepStack.length === 0){
				console.log('all done!');
				done = true;
			} else {
				let popped = stepStack.pop();
				let currentResolved = currentStep.resolving.resolve(scope);
				popped.setResolving(currentResolved);
				currentStep = popped;
			}
		} else {
			stepStack.push(currentStep);
			currentStep = new ResolveEngine(kid);
			currentStep.start();
		}
	}
	let readyAst = currentStep.resolving();
	return readyAst.resolve(scope);
}

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
	return resolve_parsed(parsed, scope);
}

},{"./grammerAST":4}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
// Generated by Peggy 1.2.0.
//
// https://peggyjs.org/

"use strict";


let grammerAST = require("./grammerAST");


function peg$subclass(child, parent) {
  function C() { this.constructor = child; }
  C.prototype = parent.prototype;
  child.prototype = new C();
}

function peg$SyntaxError(message, expected, found, location) {
  var self = Error.call(this, message);
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(self, peg$SyntaxError.prototype);
  }
  self.expected = expected;
  self.found = found;
  self.location = location;
  self.name = "SyntaxError";
  return self;
}

peg$subclass(peg$SyntaxError, Error);

function peg$padEnd(str, targetLength, padString) {
  padString = padString || " ";
  if (str.length > targetLength) { return str; }
  targetLength -= str.length;
  padString += padString.repeat(targetLength);
  return str + padString.slice(0, targetLength);
}

peg$SyntaxError.prototype.format = function(sources) {
  var str = "Error: " + this.message;
  if (this.location) {
    var src = null;
    var k;
    for (k = 0; k < sources.length; k++) {
      if (sources[k].source === this.location.source) {
        src = sources[k].text.split(/\r\n|\n|\r/g);
        break;
      }
    }
    var s = this.location.start;
    var loc = this.location.source + ":" + s.line + ":" + s.column;
    if (src) {
      var e = this.location.end;
      var filler = peg$padEnd("", s.line.toString().length);
      var line = src[s.line - 1];
      var last = s.line === e.line ? e.column : line.length + 1;
      str += "\n --> " + loc + "\n"
          + filler + " |\n"
          + s.line + " | " + line + "\n"
          + filler + " | " + peg$padEnd("", s.column - 1)
          + peg$padEnd("", last - s.column, "^");
    } else {
      str += "\n at " + loc;
    }
  }
  return str;
};

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function(expectation) {
      return "\"" + literalEscape(expectation.text) + "\"";
    },

    class: function(expectation) {
      var escapedParts = expectation.parts.map(function(part) {
        return Array.isArray(part)
          ? classEscape(part[0]) + "-" + classEscape(part[1])
          : classEscape(part);
      });

      return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
    },

    any: function() {
      return "any character";
    },

    end: function() {
      return "end of input";
    },

    other: function(expectation) {
      return expectation.description;
    }
  };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g,  "\\\"")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g,          function(ch) { return "\\x0" + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return "\\x"  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/\]/g, "\\]")
      .replace(/\^/g, "\\^")
      .replace(/-/g,  "\\-")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g,          function(ch) { return "\\x0" + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return "\\x"  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = expected.map(describeExpectation);
    var i, j;

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== undefined ? options : {};

  var peg$FAILED = {};
  var peg$source = options.grammarSource;

  var peg$startRuleFunctions = { start: peg$parsestart };
  var peg$startRuleFunction = peg$parsestart;

  var peg$c0 = "*";
  var peg$c1 = "/";
  var peg$c2 = "+";
  var peg$c3 = "-";
  var peg$c4 = "..";
  var peg$c5 = ":";
  var peg$c6 = ":rr";
  var peg$c7 = "{";
  var peg$c8 = "}";
  var peg$c9 = ";";
  var peg$c10 = "keep";
  var peg$c11 = "drop";
  var peg$c12 = "highest";
  var peg$c13 = "lowest";
  var peg$c14 = "explode";
  var peg$c15 = "x";
  var peg$c16 = "reroll";
  var peg$c17 = ">=";
  var peg$c18 = "<=";
  var peg$c19 = "!=";
  var peg$c20 = "(";
  var peg$c21 = ")";
  var peg$c22 = "[";
  var peg$c23 = "]";

  var peg$r0 = /^[dD]/;
  var peg$r1 = /^[wW]/;
  var peg$r2 = /^[kKdD]/;
  var peg$r3 = /^[hHlL]/;
  var peg$r4 = /^[>=<]/;
  var peg$r5 = /^[cCfFrR]/;
  var peg$r6 = /^[^[\]]/;
  var peg$r7 = /^[\-]/;
  var peg$r8 = /^[0-9]/;
  var peg$r9 = /^[\n\r\t ]/;

  var peg$e0 = peg$literalExpectation("*", false);
  var peg$e1 = peg$literalExpectation("/", false);
  var peg$e2 = peg$literalExpectation("+", false);
  var peg$e3 = peg$literalExpectation("-", false);
  var peg$e4 = peg$classExpectation(["d", "D"], false, false);
  var peg$e5 = peg$literalExpectation("..", false);
  var peg$e6 = peg$classExpectation(["w", "W"], false, false);
  var peg$e7 = peg$literalExpectation(":", false);
  var peg$e8 = peg$classExpectation(["k", "K", "d", "D"], false, false);
  var peg$e9 = peg$classExpectation(["h", "H", "l", "L"], false, false);
  var peg$e10 = peg$literalExpectation(":rr", false);
  var peg$e11 = peg$literalExpectation("{", false);
  var peg$e12 = peg$literalExpectation("}", false);
  var peg$e13 = peg$literalExpectation(";", false);
  var peg$e14 = peg$literalExpectation("keep", false);
  var peg$e15 = peg$literalExpectation("drop", false);
  var peg$e16 = peg$literalExpectation("highest", false);
  var peg$e17 = peg$literalExpectation("lowest", false);
  var peg$e18 = peg$literalExpectation("explode", false);
  var peg$e19 = peg$literalExpectation("x", false);
  var peg$e20 = peg$literalExpectation("reroll", false);
  var peg$e21 = peg$otherExpectation("comparison operator");
  var peg$e22 = peg$literalExpectation(">=", false);
  var peg$e23 = peg$literalExpectation("<=", false);
  var peg$e24 = peg$literalExpectation("!=", false);
  var peg$e25 = peg$classExpectation([">", "=", "<"], false, false);
  var peg$e26 = peg$literalExpectation("(", false);
  var peg$e27 = peg$literalExpectation(")", false);
  var peg$e28 = peg$otherExpectation("integer or rounded expression");
  var peg$e29 = peg$classExpectation(["c", "C", "f", "F", "r", "R"], false, false);
  var peg$e30 = peg$literalExpectation("[", false);
  var peg$e31 = peg$classExpectation(["[", "]"], true, false);
  var peg$e32 = peg$literalExpectation("]", false);
  var peg$e33 = peg$classExpectation(["-"], false, false);
  var peg$e34 = peg$classExpectation([["0", "9"]], false, false);
  var peg$e35 = peg$otherExpectation("whitespace");
  var peg$e36 = peg$classExpectation(["\n", "\r", "\t", " "], false, false);
  var peg$e37 = peg$otherExpectation("required whitespace");


  var peg$currPos = 0;
  var peg$savedPos = 0;
  var peg$posDetailsCache = [{ line: 1, column: 1 }];
  var peg$maxFailPos = 0;
  var peg$maxFailExpected = [];
  var peg$silentFails = 0;

  var peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function offset() {
    return peg$savedPos;
  }

  function range() {
    return {
      source: peg$source,
      start: peg$savedPos,
      end: peg$currPos
    };
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== undefined
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== undefined
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos];
    var p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;

      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos);
    var endPosDetails = peg$computePosDetails(endPos);

    return {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parsestart() {
    var s0;

    s0 = peg$parsemathSeq();

    return s0;
  }

  function peg$parsemathSeq() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

    s0 = peg$currPos;
    s1 = peg$parseopt_ws();
    s2 = peg$parseexpression();
    if (s2 !== peg$FAILED) {
      s3 = [];
      s4 = peg$currPos;
      s5 = peg$parseopt_ws();
      s6 = peg$parsemathOp();
      if (s6 !== peg$FAILED) {
        s7 = peg$parseopt_ws();
        s8 = peg$parseexpression();
        if (s8 !== peg$FAILED) {
          s4 = [ s6, s8 ];
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$currPos;
        s5 = peg$parseopt_ws();
        s6 = peg$parsemathOp();
        if (s6 !== peg$FAILED) {
          s7 = peg$parseopt_ws();
          s8 = peg$parseexpression();
          if (s8 !== peg$FAILED) {
            s4 = [ s6, s8 ];
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
      }
      s4 = peg$parseopt_ws();
      s1 = [s1, s2, s3, s4];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsemathOp() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 42) {
      s0 = peg$c0;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e0); }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 47) {
        s0 = peg$c1;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e1); }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 43) {
          s0 = peg$c2;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e2); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 45) {
            s0 = peg$c3;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e3); }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseexpression() {
    var s0;

    s0 = peg$parsediceroll();
    if (s0 === peg$FAILED) {
      s0 = peg$parseparenExpress();
      if (s0 === peg$FAILED) {
        s0 = peg$parseintVal();
      }
    }

    return s0;
  }

  function peg$parsediceroll() {
    var s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    s1 = peg$parseintVal();
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (peg$r0.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e4); }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseintVal();
      if (s3 !== peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c4) {
          s4 = peg$c4;
          peg$currPos += 2;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e5); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseintVal();
          if (s5 !== peg$FAILED) {
            s6 = peg$parserollModifiers();
            if (s6 === peg$FAILED) {
              s6 = null;
            }
            s1 = [s1, s2, s3, s4, s5, s6];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseintVal();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (peg$r0.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e4); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseintVal();
        if (s3 !== peg$FAILED) {
          s4 = peg$parserollModifiers();
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          s1 = [s1, s2, s3, s4];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseintVal();
        if (s1 === peg$FAILED) {
          s1 = null;
        }
        if (peg$r1.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e6); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseintVal();
          if (s3 !== peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c4) {
              s4 = peg$c4;
              peg$currPos += 2;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e5); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parseintVal();
              if (s5 !== peg$FAILED) {
                s6 = peg$parserollModifiers();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                s1 = [s1, s2, s3, s4, s5, s6];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseintVal();
          if (s1 === peg$FAILED) {
            s1 = null;
          }
          if (peg$r1.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e6); }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseintVal();
            if (s3 !== peg$FAILED) {
              s4 = peg$parserollModifiers();
              if (s4 === peg$FAILED) {
                s4 = null;
              }
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseintVal();
            if (s1 !== peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c4) {
                s2 = peg$c4;
                peg$currPos += 2;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e5); }
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parseintVal();
                if (s3 !== peg$FAILED) {
                  s4 = peg$parserollModifiers();
                  if (s4 === peg$FAILED) {
                    s4 = null;
                  }
                  s1 = [s1, s2, s3, s4];
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parserollModifiers() {
    var s0;

    s0 = peg$parsesimpleModifiers();
    if (s0 === peg$FAILED) {
      s0 = peg$parsefullModifiers();
    }

    return s0;
  }

  function peg$parsesimpleModifiers() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 58) {
      s1 = peg$c5;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e7); }
    }
    if (s1 !== peg$FAILED) {
      if (peg$r2.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e8); }
      }
      if (s2 !== peg$FAILED) {
        if (peg$r3.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e9); }
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        s4 = peg$parseintVal();
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        s1 = [s1, s2, s3, s4];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 58) {
        s1 = peg$c5;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e7); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$r3.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e9); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseintVal();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 3) === peg$c6) {
          s1 = peg$c6;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e10); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseintVal();
          if (s2 === peg$FAILED) {
            s2 = null;
          }
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
    }

    return s0;
  }

  function peg$parsefullModifiers() {
    var s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    s1 = peg$parseopt_ws();
    if (input.charCodeAt(peg$currPos) === 123) {
      s2 = peg$c7;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e11); }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parseopt_ws();
      s4 = peg$parsemodifierSeq();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseopt_ws();
        if (input.charCodeAt(peg$currPos) === 125) {
          s6 = peg$c8;
          peg$currPos++;
        } else {
          s6 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e12); }
        }
        if (s6 !== peg$FAILED) {
          s1 = [s1, s2, s3, s4, s5, s6];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsemodifierSeq() {
    var s0, s1, s2, s3, s4, s5, s6, s7;

    s0 = peg$currPos;
    s1 = peg$parsemodifier();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parseopt_ws();
      if (input.charCodeAt(peg$currPos) === 59) {
        s5 = peg$c9;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e13); }
      }
      if (s5 !== peg$FAILED) {
        s6 = peg$parseopt_ws();
        s7 = peg$parsemodifier();
        if (s7 !== peg$FAILED) {
          s3 = s7;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parseopt_ws();
        if (input.charCodeAt(peg$currPos) === 59) {
          s5 = peg$c9;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e13); }
        }
        if (s5 !== peg$FAILED) {
          s6 = peg$parseopt_ws();
          s7 = peg$parsemodifier();
          if (s7 !== peg$FAILED) {
            s3 = s7;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      s1 = [s1, s2];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsemodifier() {
    var s0;

    s0 = peg$parsekeepDropModifier();
    if (s0 === peg$FAILED) {
      s0 = peg$parseexplodeModifier();
      if (s0 === peg$FAILED) {
        s0 = peg$parsererollModifier();
      }
    }

    return s0;
  }

  function peg$parsekeepDropModifier() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 4) === peg$c10) {
      s1 = peg$c10;
      peg$currPos += 4;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e14); }
    }
    if (s1 === peg$FAILED) {
      if (input.substr(peg$currPos, 4) === peg$c11) {
        s1 = peg$c11;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e15); }
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$parseneed_ws();
      if (s3 !== peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c12) {
          s4 = peg$c12;
          peg$currPos += 7;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e16); }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseneed_ws();
        if (s3 !== peg$FAILED) {
          if (input.substr(peg$currPos, 6) === peg$c13) {
            s4 = peg$c13;
            peg$currPos += 6;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e17); }
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$currPos;
        s4 = peg$parseneed_ws();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseintVal();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        s1 = [s1, s2, s3];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseexplodeModifier() {
    var s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c14) {
      s1 = peg$c14;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e18); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$parseneed_ws();
      if (s3 !== peg$FAILED) {
        s4 = peg$parsecomparison();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseopt_ws();
          s6 = peg$parseintVal();
          if (s6 !== peg$FAILED) {
            s3 = [s3, s4, s5, s6];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      s3 = peg$currPos;
      s4 = peg$parseneed_ws();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseintVal();
        if (s5 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 120) {
            s6 = peg$c15;
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e19); }
          }
          if (s6 !== peg$FAILED) {
            s4 = [s4, s5, s6];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s1 = [s1, s2, s3];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsererollModifier() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 6) === peg$c16) {
      s1 = peg$c16;
      peg$currPos += 6;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e20); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseopt_ws();
      s3 = peg$parsecomparison();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseopt_ws();
        s5 = peg$parseintVal();
        if (s5 !== peg$FAILED) {
          s6 = peg$parseneed_ws();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseintVal();
            if (s7 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 120) {
                s8 = peg$c15;
                peg$currPos++;
              } else {
                s8 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e19); }
              }
              if (s8 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4, s5, s6, s7, s8];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c16) {
        s1 = peg$c16;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e20); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseneed_ws();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseintVal();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseneed_ws();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseintVal();
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 120) {
                  s6 = peg$c15;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$e19); }
                }
                if (s6 !== peg$FAILED) {
                  s1 = [s1, s2, s3, s4, s5, s6];
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 6) === peg$c16) {
          s1 = peg$c16;
          peg$currPos += 6;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e20); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseopt_ws();
          s3 = peg$parsecomparison();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseopt_ws();
            s5 = peg$parseintVal();
            if (s5 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4, s5];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 6) === peg$c16) {
            s1 = peg$c16;
            peg$currPos += 6;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e20); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parseneed_ws();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseintVal();
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 120) {
                  s4 = peg$c15;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$e19); }
                }
                if (s4 !== peg$FAILED) {
                  s1 = [s1, s2, s3, s4];
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 6) === peg$c16) {
              s1 = peg$c16;
              peg$currPos += 6;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e20); }
            }
            if (s1 !== peg$FAILED) {
              s2 = peg$parseneed_ws();
              if (s2 !== peg$FAILED) {
                s3 = peg$parseintVal();
                if (s3 !== peg$FAILED) {
                  s1 = [s1, s2, s3];
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 6) === peg$c16) {
                s0 = peg$c16;
                peg$currPos += 6;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e20); }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parsecomparison() {
    var s0, s1;

    peg$silentFails++;
    if (input.substr(peg$currPos, 2) === peg$c17) {
      s0 = peg$c17;
      peg$currPos += 2;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e22); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c18) {
        s0 = peg$c18;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e23); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c19) {
          s0 = peg$c19;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e24); }
        }
        if (s0 === peg$FAILED) {
          if (peg$r4.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e25); }
          }
        }
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e21); }
    }

    return s0;
  }

  function peg$parseparenExpress() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parseroundIndicator();
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = peg$parserawParens();
    if (s2 !== peg$FAILED) {
      s1 = [s1, s2];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parserawParens() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c20;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e26); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseopt_ws();
      s3 = peg$parsemathSeq();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseopt_ws();
        if (input.charCodeAt(peg$currPos) === 41) {
          s5 = peg$c21;
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e27); }
        }
        if (s5 !== peg$FAILED) {
          s1 = [s1, s2, s3, s4, s5];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseintVal() {
    var s0, s1, s2;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = peg$parseroundIndicator();
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = peg$parsevariable();
    if (s2 !== peg$FAILED) {
      s1 = [s1, s2];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseroundIndicator();
      if (s1 !== peg$FAILED) {
        s2 = peg$parserawParens();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseintLiteral();
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e28); }
    }

    return s0;
  }

  function peg$parseroundIndicator() {
    var s0;

    if (peg$r5.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e29); }
    }

    return s0;
  }

  function peg$parsevariable() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      s1 = peg$c22;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e30); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (peg$r6.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e31); }
      }
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          if (peg$r6.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e31); }
          }
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 93) {
          s3 = peg$c23;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e32); }
        }
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseintLiteral() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (peg$r7.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e33); }
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    s2 = [];
    if (peg$r8.test(input.charAt(peg$currPos))) {
      s3 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s3 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e34); }
    }
    if (s3 !== peg$FAILED) {
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$r8.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e34); }
        }
      }
    } else {
      s2 = peg$FAILED;
    }
    if (s2 !== peg$FAILED) {
      s1 = [s1, s2];
      s0 = s1;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseopt_ws() {
    var s0, s1;

    peg$silentFails++;
    s0 = [];
    if (peg$r9.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e36); }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      if (peg$r9.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e36); }
      }
    }
    peg$silentFails--;
    s1 = peg$FAILED;
    if (peg$silentFails === 0) { peg$fail(peg$e35); }

    return s0;
  }

  function peg$parseneed_ws() {
    var s0, s1;

    peg$silentFails++;
    s0 = [];
    if (peg$r9.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e36); }
    }
    if (s1 !== peg$FAILED) {
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$r9.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e36); }
        }
      }
    } else {
      s0 = peg$FAILED;
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e37); }
    }

    return s0;
  }

  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

module.exports = {
  SyntaxError: peg$SyntaxError,
  parse: peg$parse
};

},{"./grammerAST":4}]},{},[2])(2)
});
