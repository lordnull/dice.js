(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dice = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports={
  "name": "dice.js",
  "version": "0.9.0",
  "description": "A parser and evaluator for a useful rpg dice syntax.",
  "main": "src/dice.js",
  "directories": {
    "test": "tests"
  },
  "dependencies": {},
  "devDependencies": {
    "karma": "~0.10.8",
    "karma-chrome-launcher": "~0.1.1",
    "karma-coffee-preprocessor": "~0.1.1",
    "karma-firefox-launcher": "~0.1.2",
    "karma-html2js-preprocessor": "~0.1.0",
    "karma-jasmine": "~0.1.5",
    "karma-phantomjs-launcher": "~0.1.1",
    "karma-requirejs": "~0.2.0",
    "karma-script-launcher": "~0.1.0",
    "requirejs": "~2.1.9",
    "pegjs": "~0.9.0",
    "jasmine-node": "~1.14.5",
    "browserify": "~11.0.1"
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
	if(opObject.op == '+'){
		var leftMinMax = determine_min_max_possible(opObject.args[0], scope);
		var rightMinMax = determine_min_max_possible(opObject.args[1], scope);
		var min = leftMinMax[0] + rightMinMax[0];
		var max = leftMinMax[1] + rightMinMax[1];
		return [min, max];
	}
	if(opObject.op == '-'){
		var leftMinMax = determine_min_max_possible(opObject.args[0], scope);
		var rightMinMax = determine_min_max_possible(opObject.args[1], scope);
		var min = leftMinMax[0] - rightMinMax[0];
		var max = leftMinMax[1] - rightMinMax[1];
		return [min, max];
	}
	if(opObject.op == '*'){
		var leftMinMax = determine_min_max_possible(opObject.args[0], scope);
		var rightMinMax = determine_min_max_possible(opObject.args[1], scope);
		var min = leftMinMax[0] * rightMinMax[0];
		var max = leftMinMax[1] * rightMinMax[1];
		return [min, max];
	}
	if(opObject.op == '/'){
		var leftMinMax = determine_min_max_possible(opObject.args[0], scope);
		var rightMinMax = determine_min_max_possible(opObject.args[1], scope);
		var min = leftMinMax[0] / rightMinMax[1];
		var max = leftMinMax[1] / rightMinMax[0];
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


},{}],4:[function(require,module,exports){
module.exports = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.9.0.
   *
   * http://pegjs.org/
   */

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

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = function(v1, op, v2) { return {'op':op, args: [v1, v2] }; },
        peg$c1 = function(out) { return out; },
        peg$c2 = "(",
        peg$c3 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c4 = ")",
        peg$c5 = { type: "literal", value: ")", description: "\")\"" },
        peg$c6 = function(rolls) { return {'op':'paren_express', args: [rolls]} },
        peg$c7 = "*",
        peg$c8 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c9 = function() { return '*'; },
        peg$c10 = "/",
        peg$c11 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c12 = function() { return '/'; },
        peg$c13 = function(v1, op, v2) { return {'op':op, args:[v1, v2] }; },
        peg$c14 = function(d) { return d; },
        peg$c15 = function(paren) { return paren; },
        peg$c16 = function(v1, op, v2) { return {'op':op, args:[v1, v2]}; },
        peg$c17 = function(op) { return op; },
        peg$c18 = "+",
        peg$c19 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c20 = function() { return "+"; },
        peg$c21 = "-",
        peg$c22 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c23 = function() { return "-"; },
        peg$c24 = function(x, mode, mm) { return {'op':mode, 'args':[x, mm]} },
        peg$c25 = function(mode, mm) { return {'op':mode, 'args':[{'op':'static', 'value':1}, mm]}; },
        peg$c26 = function(mm) { return { 'op':'d', 'args':[ {'op':'static', 'value':1}, mm]}; },
        peg$c27 = function(x) { return x; },
        peg$c28 = "d",
        peg$c29 = { type: "literal", value: "d", description: "\"d\"" },
        peg$c30 = "w",
        peg$c31 = { type: "literal", value: "w", description: "\"w\"" },
        peg$c32 = function(mm) { return mm; },
        peg$c33 = function(max) { return {'op':'random', 'args':[{'op':'static', 'args':[], 'value':1}, max]}; },
        peg$c34 = "..",
        peg$c35 = { type: "literal", value: "..", description: "\"..\"" },
        peg$c36 = function(min, max) { return {'op':'random', 'args':[min, max]}; },
        peg$c37 = /^[ ]/,
        peg$c38 = { type: "class", value: "[ ]", description: "[ ]" },
        peg$c39 = function(i) {
        		return {'op': 'static', value: i};
        	},
        peg$c40 = function(l) {
        		return l;
        	},
        peg$c41 = function(f, v) {
        		return {'op':f, args:[v]};
        	},
        peg$c42 = function(f, ex) {
            return {'op':f, args:ex.args};
        	},
        peg$c43 = "f",
        peg$c44 = { type: "literal", value: "f", description: "\"f\"" },
        peg$c45 = function() { return 'floor'; },
        peg$c46 = "r",
        peg$c47 = { type: "literal", value: "r", description: "\"r\"" },
        peg$c48 = function() { return 'round'; },
        peg$c49 = "c",
        peg$c50 = { type: "literal", value: "c", description: "\"c\"" },
        peg$c51 = function() { return 'ceil'; },
        peg$c52 = function(v) { return {'op':'lookup', 'value':v}; },
        peg$c53 = "[",
        peg$c54 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c55 = /^[^[\]]/,
        peg$c56 = { type: "class", value: "[^[\\]]", description: "[^[\\]]" },
        peg$c57 = "]",
        peg$c58 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c59 = function(varname) { return varname.join(""); },
        peg$c60 = { type: "other", description: "integer" },
        peg$c61 = /^[0-9]/,
        peg$c62 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c63 = function(digits) { return parseInt(digits.join(""), 10); },
        peg$c64 = function(digits) { return parseInt(digits.join(""), 10) * -1; },

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
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

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

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
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
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

    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parsestart() {
      var s0;

      s0 = peg$parsedicerolls();

      return s0;
    }

    function peg$parsedicerolls() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsemultiplicationSeq();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseadditionOp();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseadditionSeq();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c0(s1, s2, s3);
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
      s1 = peg$parsediceroll();
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
        s1 = peg$parseparenExpress();
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
        if (input.charCodeAt(peg$currPos) === 119) {
          s0 = peg$c30;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c31); }
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
        s1 = peg$c32(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseintval();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c33(s1);
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
        if (input.substr(peg$currPos, 2) === peg$c34) {
          s2 = peg$c34;
          peg$currPos += 2;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c35); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseintval();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c36(s1, s3);
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
      if (peg$c37.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c38); }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$c37.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c38); }
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
        s1 = peg$c39(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parselookup();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c40(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsemathit();
          if (s1 !== peg$FAILED) {
            s2 = peg$parselookup();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c41(s1, s2);
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
                s1 = peg$c42(s1, s2);
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
        s1 = peg$c43;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c44); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c45();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 114) {
          s1 = peg$c46;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c47); }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c48();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 99) {
            s1 = peg$c49;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c50); }
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c51();
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
        s1 = peg$c52(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsevariable() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c53;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c54); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c55.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c56); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c55.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c56); }
            }
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 93) {
            s3 = peg$c57;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c58); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c59(s2);
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
      if (peg$c61.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c62); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c61.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c62); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c63(s1);
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
          if (peg$c61.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c62); }
          }
          if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              if (peg$c61.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c62); }
              }
            }
          } else {
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c64(s2);
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
        if (peg$silentFails === 0) { peg$fail(peg$c60); }
      }

      return s0;
    }

    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

},{}]},{},[2])(2)
});