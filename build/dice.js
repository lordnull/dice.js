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
    "jasmine-browser-runner": "^0.9.0",
    "jasmine-core": "^3.10.1",
    "jasmine-node": "^3.0.0",
    "pegjs": "^0.10.0"
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


},{"../package":1,"./evaluate":3,"./parser":4}],3:[function(require,module,exports){

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

	'mult': function(){
		var args = this.multiplicants;
		args = args.map(function(multOp){
			return [multOp[0], resolve_op(multOp[1])];
		});
		return function(scope){
			var scopedArgs = args.map(function(multOp){
				return [multOp[0], multOp[1](scope)];
			});
			var product = scopedArgs.reduce(function(acc, multOp){
				if(multOp[0] === '*'){
					return acc * multOp[1];
				} else {
					return acc / multOp[1];
				}
			}, 1);
			product = new Number(product);
			product.op = 'mult';
			product.multiplicants = scopedArgs;
			return product;
		}
	},

	'sum': function(){
		var args = this.addends;
		args = args.map(function(sumOp){
			return [sumOp[0], resolve_op(sumOp[1])];
		});
		return function(scope){
			var scopedArgs = args.map(function(sumOp){
				return [sumOp[0], sumOp[1](scope)]
			});
			var sum = scopedArgs.reduce(function(acc, sumOp){
				if(sumOp[0] === '+'){
					return acc + sumOp[1];
				} else {
					return acc - sumOp[1];
				}
			}, 0);
			sum = new Number(sum);
			sum.op = 'sum';
			sum.addends = scopedArgs;
			return sum;
		}
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
}

exports.ops = ops;


},{}],4:[function(require,module,exports){
/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */

"use strict";

function peg$subclass(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message  = message;
  this.expected = expected;
  this.found    = found;
  this.location = location;
  this.name     = "SyntaxError";

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return "\"" + literalEscape(expectation.text) + "\"";
        },

        "class": function(expectation) {
          var escapedParts = "",
              i;

          for (i = 0; i < expectation.parts.length; i++) {
            escapedParts += expectation.parts[i] instanceof Array
              ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
              : classEscape(expectation.parts[i]);
          }

          return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },

        any: function(expectation) {
          return "any character";
        },

        end: function(expectation) {
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
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g,  '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
        i, j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

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
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},

      peg$startRuleFunctions = { start: peg$parsestart },
      peg$startRuleFunction  = peg$parsestart,

      peg$c0 = function(r) { return r; },
      peg$c1 = function(out) { return out; },
      peg$c2 = "(",
      peg$c3 = peg$literalExpectation("(", false),
      peg$c4 = ")",
      peg$c5 = peg$literalExpectation(")", false),
      peg$c6 = function(rolls) { return {'op':'paren_express', args: [rolls]} },
      peg$c7 = "*",
      peg$c8 = peg$literalExpectation("*", false),
      peg$c9 = function() { return '*'; },
      peg$c10 = "/",
      peg$c11 = peg$literalExpectation("/", false),
      peg$c12 = function() { return '/'; },
      peg$c13 = function(multHead, op, multTail) {
      		if(multTail.op !== 'mult'){
      			multTail = {'op':'mult', 'multiplicants':[['*', multTail]]};
      		}
      		multTail.multiplicants[0][0] = op;
      		multTail.multiplicants.unshift(['*', multHead]);
      		return multTail;
      		},
      peg$c14 = function(d) { return d; },
      peg$c15 = function(paren) { return paren; },
      peg$c16 = function(addHead, op, addTail) {
      		if(addTail.op !== 'sum'){
      			addTail = {'op':'sum', 'addends':[['+', addTail]]};
      		}
      		addTail.addends[0][0] = op;
      		addTail.addends.unshift(['+', addHead]);
      		return addTail;
      	},
      peg$c17 = function(op) { return op; },
      peg$c18 = "+",
      peg$c19 = peg$literalExpectation("+", false),
      peg$c20 = function() { return "+"; },
      peg$c21 = "-",
      peg$c22 = peg$literalExpectation("-", false),
      peg$c23 = function() { return "-"; },
      peg$c24 = function(x, mode, mm) { return {'op':mode.toLowerCase(), 'args':[x, mm]} },
      peg$c25 = function(mode, mm) { return {'op':mode.toLowerCase(), 'args':[{'op':'static', 'value':1}, mm]}; },
      peg$c26 = function(mm) { return { 'op':'d', 'args':[ {'op':'static', 'value':1}, mm]}; },
      peg$c27 = function(x) { return x; },
      peg$c28 = "d",
      peg$c29 = peg$literalExpectation("d", false),
      peg$c30 = "D",
      peg$c31 = peg$literalExpectation("D", false),
      peg$c32 = "w",
      peg$c33 = peg$literalExpectation("w", false),
      peg$c34 = "W",
      peg$c35 = peg$literalExpectation("W", false),
      peg$c36 = function(mm) { return mm; },
      peg$c37 = function(max) { return {'op':'random', 'args':[{'op':'static', 'args':[], 'value':1}, max]}; },
      peg$c38 = "..",
      peg$c39 = peg$literalExpectation("..", false),
      peg$c40 = function(min, max) { return {'op':'random', 'args':[min, max]}; },
      peg$c41 = /^[ ]/,
      peg$c42 = peg$classExpectation([" "], false, false),
      peg$c43 = function(i) {
      		return {'op': 'static', value: i};
      	},
      peg$c44 = function(l) {
      		return l;
      	},
      peg$c45 = function(f, v) {
      		return {'op':f, args:[v]};
      	},
      peg$c46 = function(f, ex) {
      		return {'op':f, args:ex.args};
      	},
      peg$c47 = "f",
      peg$c48 = peg$literalExpectation("f", false),
      peg$c49 = function() { return 'floor'; },
      peg$c50 = "r",
      peg$c51 = peg$literalExpectation("r", false),
      peg$c52 = function() { return 'round'; },
      peg$c53 = "c",
      peg$c54 = peg$literalExpectation("c", false),
      peg$c55 = function() { return 'ceil'; },
      peg$c56 = function(v) { return {'op':'lookup', 'value':v}; },
      peg$c57 = "[",
      peg$c58 = peg$literalExpectation("[", false),
      peg$c59 = /^[^[\]]/,
      peg$c60 = peg$classExpectation(["[", "]"], true, false),
      peg$c61 = "]",
      peg$c62 = peg$literalExpectation("]", false),
      peg$c63 = function(varname) { return varname.join(""); },
      peg$c64 = peg$otherExpectation("integer"),
      peg$c65 = /^[0-9]/,
      peg$c66 = peg$classExpectation([["0", "9"]], false, false),
      peg$c67 = function(digits) { return parseInt(digits.join(""), 10); },
      peg$c68 = function(digits) { return parseInt(digits.join(""), 10) * -1; },

      peg$currPos          = 0,
      peg$savedPos         = 0,
      peg$posDetailsCache  = [{ line: 1, column: 1 }],
      peg$maxFailPos       = 0,
      peg$maxFailExpected  = [],
      peg$silentFails      = 0,

      peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

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
    var details = peg$posDetailsCache[pos], p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line:   details.line,
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
    var startPosDetails = peg$computePosDetails(startPos),
        endPosDetails   = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line:   startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line:   endPosDetails.line,
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
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsedicerolls();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
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

  function peg$parsedicerolls() {
    var s0, s1;

    s0 = peg$currPos;
    s1 = peg$parseadditionSeq();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c1(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseparenExpress();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c1(s1);
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parseparenExpress() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c2;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c3); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsews();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsedicerolls();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsews();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c4;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c5); }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c6(s3);
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

    return s0;
  }

  function peg$parsemultiplicationOp() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 42) {
        s2 = peg$c7;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c9();
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
      s1 = peg$parsews();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 47) {
          s2 = peg$c10;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c11); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsews();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c12();
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

    return s0;
  }

  function peg$parsemultiplicationSeq() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsemultHead();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsemultiplicationOp();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsemultiplicationSeq();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c13(s1, s2, s3);
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
      s1 = peg$parsediceroll();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c14(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseparenExpress();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c15(s1);
        }
        s0 = s1;
      }
    }

    return s0;
  }

  function peg$parsemultHead() {
    var s0;

    s0 = peg$parsediceroll();
    if (s0 === peg$FAILED) {
      s0 = peg$parseparenExpress();
    }

    return s0;
  }

  function peg$parseadditionSeq() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsemultiplicationSeq();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseadditionOp();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseadditionSeq();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c16(s1, s2, s3);
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
      s1 = peg$parsemultiplicationSeq();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c17(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseparenExpress();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c17(s1);
        }
        s0 = s1;
      }
    }

    return s0;
  }

  function peg$parseadditionOp() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsews();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 43) {
        s2 = peg$c18;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c19); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsews();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c20();
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
      s1 = peg$parsews();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 45) {
          s2 = peg$c21;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsews();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c23();
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

    return s0;
  }

  function peg$parsediceroll() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parseintval();
    if (s1 !== peg$FAILED) {
      s2 = peg$parserollmode();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsemaybe_minmax();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c24(s1, s2, s3);
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
      s1 = peg$parserollmode();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsemaybe_minmax();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c25(s1, s2);
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
        s1 = peg$parseminmax();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c26(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseintval();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c27(s1);
          }
          s0 = s1;
        }
      }
    }

    return s0;
  }

  function peg$parserollmode() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 100) {
      s0 = peg$c28;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c29); }
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 68) {
        s0 = peg$c30;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c31); }
      }
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 119) {
          s0 = peg$c32;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c33); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 87) {
            s0 = peg$c34;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c35); }
          }
        }
      }
    }

    return s0;
  }

  function peg$parsemaybe_minmax() {
    var s0, s1;

    s0 = peg$currPos;
    s1 = peg$parseminmax();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c36(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseintval();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c37(s1);
      }
      s0 = s1;
    }

    return s0;
  }

  function peg$parseminmax() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parseintval();
    if (s1 !== peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c38) {
        s2 = peg$c38;
        peg$currPos += 2;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c39); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseintval();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c40(s1, s3);
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

  function peg$parsews() {
    var s0, s1;

    s0 = [];
    if (peg$c41.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c42); }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      if (peg$c41.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c42); }
      }
    }

    return s0;
  }

  function peg$parseintval() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parseinteger();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c43(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parselookup();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c44(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsemathit();
        if (s1 !== peg$FAILED) {
          s2 = peg$parselookup();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c45(s1, s2);
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
          s1 = peg$parsemathit();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseparenExpress();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c46(s1, s2);
              s0 = s1;
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

    return s0;
  }

  function peg$parsemathit() {
    var s0, s1;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 102) {
      s1 = peg$c47;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c48); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c49();
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 114) {
        s1 = peg$c50;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c51); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c52();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 99) {
          s1 = peg$c53;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c55();
        }
        s0 = s1;
      }
    }

    return s0;
  }

  function peg$parselookup() {
    var s0, s1;

    s0 = peg$currPos;
    s1 = peg$parsevariable();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c56(s1);
    }
    s0 = s1;

    return s0;
  }

  function peg$parsevariable() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 91) {
      s1 = peg$c57;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c58); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      if (peg$c59.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c60); }
      }
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          if (peg$c59.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c60); }
          }
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 93) {
          s3 = peg$c61;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c62); }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c63(s2);
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

  function peg$parseinteger() {
    var s0, s1, s2, s3;

    peg$silentFails++;
    s0 = peg$currPos;
    s1 = [];
    if (peg$c65.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c66); }
    }
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        if (peg$c65.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c66); }
        }
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c67(s1);
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s1 = peg$c21;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c22); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c65.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c66); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c65.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c66); }
            }
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c68(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }
    peg$silentFails--;
    if (s0 === peg$FAILED) {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c64); }
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
  parse:       peg$parse
};

},{}]},{},[2])(2)
});
