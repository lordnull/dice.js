(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dice = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports={
  "name": "dice.js",
  "version": "2.0.0",
  "description": "A parser and evaluator for a useful rpg dice syntax.",
  "main": "build/dice.js",
  "directories": {
    "test": "tests"
  },
  "devDependencies": {
    "@types/node": "^16.11.7",
    "browserify": "^17.0.0",
    "jasmine": "^3.10.0",
    "jasmine-browser-runner": "^0.9.0",
    "jasmine-core": "^3.10.1",
    "jasmine-node": "^3.0.0",
    "peggy": "^1.2.0",
    "typescript": "^4.4.4"
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


},{"../package":1,"./evaluate":3,"./grammerAST":4,"./parser":5,"./statistics":6,"./stringify":7}],3:[function(require,module,exports){
"use strict";
/*
This is the default evaluator for the dice roll abstract syntax tree as defined
in 'grammerAST'. This is what the readme references when it specs of specific
behaviors, such as what the round syntax actually does, and the default limit
of explode or reroll.

The classes here mainly mirror those in the grammer. The mirror is the classes
here are used to accumulate the total value of the roll.
*/
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LookupR_lookupName, _DiceRollR_min, _DiceRollR_max, _DiceRollR_x, _DiceRollR_modifiers, _DiceRollR_rolls, _RollSetModifiersR_mods, _KeepDropModifier_action, _KeepDropModifier_direction, _KeepDropModifier_howMany, _RerollModifier_comparisonMode, _RerollModifier_comparisonValue, _RerollModifier_limit, _ExplodeModifier_comparisonMode, _ExplodeModifier_comparisonValue, _ExplodeModifier_limit, _RounderR_mode, _RounderR_thingRounded, _MathOpR_op, _MathOpR_opFunc, _MathOpR_operand, _MathOpListR_ops, _MathSeqR_ops, _MathSeqR_head, _ParensR_expression;
Object.defineProperty(exports, "__esModule", { value: true });
exports.eval_default = exports.ParensR = exports.MathSeqR = exports.MathOpListR = exports.MathOpR = exports.RounderR = exports.ExplodeModifier = exports.RerollModifier = exports.KeepDropModifier = exports.RollSetModifiersR = exports.DiceRollR = exports.LookupR = exports.StaticR = exports.Resolver = void 0;
let grammer = require("./grammerAST");
/* A helper class that defines the number / rolls we're gathering as we go,
as well as the rollset we've seen to facilitate data introspection.
*/
class Resolver extends Number {
    constructor(n, ast) {
        super(n);
        this.ast = ast;
    }
    get rolls() {
        return [];
    }
}
exports.Resolver = Resolver;
class StaticR extends Resolver {
    constructor(n) {
        super(n, new grammer.Static(n));
    }
}
exports.StaticR = StaticR;
class LookupR extends Resolver {
    constructor(name, scope) {
        super(LookupR.deepSeek(name, scope), new grammer.Lookup(name));
        _LookupR_lookupName.set(this, void 0);
        __classPrivateFieldSet(this, _LookupR_lookupName, name, "f");
    }
    static deepSeek(path, object) {
        if (object.hasOwnProperty(path)) {
            return object[path];
        }
        let split = path.split('.');
        if (split[0] === path) {
            return;
        }
        let reduceRes = split.reverse().reduceRight((acc, elem, index) => {
            if (acc === undefined) {
                return;
            }
            let nextAcc = acc[elem];
            let isObject = (typeof nextAcc === "object");
            let isNumber = (typeof nextAcc === "number");
            let hasPathLeft = index !== 0;
            if (hasPathLeft && !isObject) {
                return undefined;
            }
            return nextAcc;
        }, object);
        if (reduceRes !== undefined) {
            if (typeof reduceRes === "number") {
                return reduceRes;
            }
        }
        return undefined;
    }
    ;
}
exports.LookupR = LookupR;
_LookupR_lookupName = new WeakMap();
// Typescript has a strange limitation where you cannot have any statements
// before a class calls 'super' in it's constructor. I need to calculate stuff
// that cannot easily be done within those confines, thus this ugly hack.
// Typescript is too strict here.
let resultSetInstance = [];
class DiceRollR extends Resolver {
    constructor(x, min, max, modifiers, ast) {
        super(DiceRollR.initVal(x, min, max, modifiers), ast);
        _DiceRollR_min.set(this, void 0);
        _DiceRollR_max.set(this, void 0);
        _DiceRollR_x.set(this, void 0);
        _DiceRollR_modifiers.set(this, void 0);
        _DiceRollR_rolls.set(this, void 0);
        __classPrivateFieldSet(this, _DiceRollR_x, x, "f");
        __classPrivateFieldSet(this, _DiceRollR_min, min, "f");
        __classPrivateFieldSet(this, _DiceRollR_max, max, "f");
        __classPrivateFieldSet(this, _DiceRollR_modifiers, modifiers, "f");
        __classPrivateFieldSet(this, _DiceRollR_rolls, resultSetInstance, "f");
    }
    get min() {
        return __classPrivateFieldGet(this, _DiceRollR_min, "f");
    }
    get max() {
        return __classPrivateFieldGet(this, _DiceRollR_max, "f");
    }
    get rolls() {
        let minRolls = this.min.rolls;
        let maxRolls = this.max.rolls;
        let xRolls = this.x.rolls;
        let modRolls = this.modifiers.rolls;
        let myRolls = __classPrivateFieldGet(this, _DiceRollR_rolls, "f");
        let deep = new Array(xRolls, minRolls, maxRolls, modRolls, myRolls);
        return deep.flatMap((e) => e);
    }
    get modifiers() {
        return __classPrivateFieldGet(this, _DiceRollR_modifiers, "f");
    }
    get x() {
        return __classPrivateFieldGet(this, _DiceRollR_x, "f");
    }
    static rand(min, max) {
        let rawRandom = Math.random();
        let diff = max.valueOf() - min.valueOf();
        rawRandom = diff * rawRandom;
        return Math.round(rawRandom + min.valueOf());
    }
    ;
    static resultSet(x, min, max) {
        let out = [];
        for (let i = 0; i < x.valueOf(); i++) {
            out.push(new Number(DiceRollR.rand(min, max)));
        }
        return out;
    }
    static applyModifiers(resultSet, modifiers, baseRoll) {
        return modifiers.modify(resultSet, baseRoll);
    }
    static sum(resultSet) {
        return resultSet.reduce((a, e) => a + e.valueOf(), 0);
    }
    static initVal(x, min, max, modifiers) {
        let resultSet = DiceRollR.resultSet(x !== null && x !== void 0 ? x : new StaticR(1), min !== null && min !== void 0 ? min : new StaticR(1), max);
        resultSet = DiceRollR.applyModifiers(resultSet, modifiers, { x, min, max });
        resultSetInstance = resultSet;
        let sum = DiceRollR.sum(resultSet);
        return sum;
    }
}
exports.DiceRollR = DiceRollR;
_DiceRollR_min = new WeakMap(), _DiceRollR_max = new WeakMap(), _DiceRollR_x = new WeakMap(), _DiceRollR_modifiers = new WeakMap(), _DiceRollR_rolls = new WeakMap();
class RollSetModifiersR extends Resolver {
    constructor(mods, ast) {
        super(NaN, ast);
        _RollSetModifiersR_mods.set(this, []);
        __classPrivateFieldSet(this, _RollSetModifiersR_mods, mods, "f");
    }
    get rolls() {
        let deep = __classPrivateFieldGet(this, _RollSetModifiersR_mods, "f").map((m) => m.rolls);
        return deep.flatMap((e) => e);
    }
    get mods() {
        return __classPrivateFieldGet(this, _RollSetModifiersR_mods, "f");
    }
    modify(resultSet, baseDice) {
        let reducer = (a, m) => {
            return m.modify(a, baseDice);
        };
        return __classPrivateFieldGet(this, _RollSetModifiersR_mods, "f").reduce(reducer, resultSet);
    }
}
exports.RollSetModifiersR = RollSetModifiersR;
_RollSetModifiersR_mods = new WeakMap();
class KeepDropModifier extends Resolver {
    constructor(action, direction, howMany, ast) {
        super(NaN, ast);
        _KeepDropModifier_action.set(this, void 0);
        _KeepDropModifier_direction.set(this, void 0);
        _KeepDropModifier_howMany.set(this, void 0);
        __classPrivateFieldSet(this, _KeepDropModifier_action, action !== null && action !== void 0 ? action : "keep", "f");
        __classPrivateFieldSet(this, _KeepDropModifier_direction, direction !== null && direction !== void 0 ? direction : "highest", "f");
        __classPrivateFieldSet(this, _KeepDropModifier_howMany, howMany !== null && howMany !== void 0 ? howMany : new StaticR(1), "f");
    }
    get rolls() {
        return __classPrivateFieldGet(this, _KeepDropModifier_howMany, "f").rolls;
    }
    modify(resultSet) {
        let sorted = resultSet.sort();
        if (__classPrivateFieldGet(this, _KeepDropModifier_action, "f") === "keep" && __classPrivateFieldGet(this, _KeepDropModifier_direction, "f") === "highest") {
            return sorted.slice(__classPrivateFieldGet(this, _KeepDropModifier_howMany, "f").valueOf() * -1);
        }
        if (__classPrivateFieldGet(this, _KeepDropModifier_action, "f") === "drop" && __classPrivateFieldGet(this, _KeepDropModifier_direction, "f") === "highest") {
            return sorted.reverse().slice(__classPrivateFieldGet(this, _KeepDropModifier_howMany, "f").valueOf());
        }
        if (__classPrivateFieldGet(this, _KeepDropModifier_action, "f") === "keep" && __classPrivateFieldGet(this, _KeepDropModifier_direction, "f") === "lowest") {
            return sorted.reverse().slice(__classPrivateFieldGet(this, _KeepDropModifier_howMany, "f").valueOf() * -1);
        }
        if (__classPrivateFieldGet(this, _KeepDropModifier_action, "f") === "drop" && __classPrivateFieldGet(this, _KeepDropModifier_direction, "f") === "lowest") {
            return sorted.slice(__classPrivateFieldGet(this, _KeepDropModifier_howMany, "f").valueOf());
        }
        throw ('impossible, but no action or direction matches');
    }
}
exports.KeepDropModifier = KeepDropModifier;
_KeepDropModifier_action = new WeakMap(), _KeepDropModifier_direction = new WeakMap(), _KeepDropModifier_howMany = new WeakMap();
let compareFuncs = {
    '=': (base, result) => base === result,
    '!=': (base, result) => base !== result,
    '<': (base, result) => result < base,
    '<=': (base, result) => result <= base,
    '>': (base, result) => result > base,
    '>=': (base, result) => result >= base,
};
function compareFunc(mode, arg1) {
    let base = compareFuncs[mode];
    return (arg2) => base(arg1, arg2);
}
class RerollModifier extends Resolver {
    constructor(comparisonMode, comparisonValue, limit, ast) {
        super(NaN, ast);
        _RerollModifier_comparisonMode.set(this, void 0);
        _RerollModifier_comparisonValue.set(this, void 0);
        _RerollModifier_limit.set(this, void 0);
        __classPrivateFieldSet(this, _RerollModifier_comparisonMode, comparisonMode !== null && comparisonMode !== void 0 ? comparisonMode : "=", "f");
        __classPrivateFieldSet(this, _RerollModifier_comparisonValue, comparisonValue, "f");
        __classPrivateFieldSet(this, _RerollModifier_limit, limit !== null && limit !== void 0 ? limit : new StaticR(1), "f");
    }
    get rolls() {
        let concatVal = [];
        if (__classPrivateFieldGet(this, _RerollModifier_comparisonValue, "f") !== undefined) {
            concatVal = __classPrivateFieldGet(this, _RerollModifier_comparisonValue, "f").rolls;
        }
        return __classPrivateFieldGet(this, _RerollModifier_limit, "f").rolls.concat(concatVal);
    }
    modify(resultSet, baseRoll) {
        var _a;
        __classPrivateFieldSet(this, _RerollModifier_comparisonValue, (_a = __classPrivateFieldGet(this, _RerollModifier_comparisonValue, "f")) !== null && _a !== void 0 ? _a : baseRoll.min, "f");
        let compare = compareFunc(__classPrivateFieldGet(this, _RerollModifier_comparisonMode, "f"), __classPrivateFieldGet(this, _RerollModifier_comparisonValue, "f"));
        for (let i = __classPrivateFieldGet(this, _RerollModifier_limit, "f").valueOf(); i > 0; i--) {
            let totalRolls = resultSet.length;
            let keptRolls = resultSet.filter((e) => !compare(e));
            let needRollsNumber = totalRolls - keptRolls.length;
            if (needRollsNumber === 0) {
                continue;
            }
            let needRolls = new StaticR(needRollsNumber);
            let emptyMods = new RollSetModifiersR([], new grammer.RollSetModifiers());
            let diceAst = new grammer.DiceRoll(1, 1, 1, []);
            let addToSet = new DiceRollR(needRolls, baseRoll.min, baseRoll.max, emptyMods, diceAst);
            let concatSet = addToSet.rolls;
            resultSet = keptRolls.concat(concatSet);
        }
        return resultSet;
    }
}
exports.RerollModifier = RerollModifier;
_RerollModifier_comparisonMode = new WeakMap(), _RerollModifier_comparisonValue = new WeakMap(), _RerollModifier_limit = new WeakMap();
class ExplodeModifier extends Resolver {
    constructor(comparisonMode, comparisonValue, limit, ast) {
        super(NaN, ast);
        _ExplodeModifier_comparisonMode.set(this, void 0);
        _ExplodeModifier_comparisonValue.set(this, void 0);
        _ExplodeModifier_limit.set(this, void 0);
        __classPrivateFieldSet(this, _ExplodeModifier_comparisonMode, comparisonMode !== null && comparisonMode !== void 0 ? comparisonMode : "=", "f");
        __classPrivateFieldSet(this, _ExplodeModifier_comparisonValue, comparisonValue, "f");
        __classPrivateFieldSet(this, _ExplodeModifier_limit, limit !== null && limit !== void 0 ? limit : new StaticR(10000), "f");
    }
    get rolls() {
        let concatVal = [];
        if (__classPrivateFieldGet(this, _ExplodeModifier_comparisonValue, "f") !== undefined) {
            concatVal = __classPrivateFieldGet(this, _ExplodeModifier_comparisonValue, "f").rolls;
        }
        return __classPrivateFieldGet(this, _ExplodeModifier_limit, "f").rolls.concat(concatVal);
    }
    modify(rolls, baseRoll) {
        var _a;
        let count = 0;
        let compareValue = (_a = __classPrivateFieldGet(this, _ExplodeModifier_comparisonValue, "f")) !== null && _a !== void 0 ? _a : baseRoll.max;
        let compare = compareFunc(__classPrivateFieldGet(this, _ExplodeModifier_comparisonMode, "f"), compareValue);
        let exploding = rolls.filter((e) => compare(e));
        let done = exploding.length === 0;
        while (!done) {
            let explodingCount = exploding.length;
            let dice = new DiceRollR(new StaticR(explodingCount), new StaticR(baseRoll.min.valueOf()), new StaticR(baseRoll.max.valueOf()), new RollSetModifiersR([], new grammer.RollSetModifiers([])), new grammer.DiceRoll(1, 1, 1, []));
            let exploded = dice.rolls;
            rolls = rolls.concat(exploded);
            exploding = exploded.filter((e) => compare(e));
            if (__classPrivateFieldGet(this, _ExplodeModifier_limit, "f") !== null) {
                count++;
                if (__classPrivateFieldGet(this, _ExplodeModifier_limit, "f").valueOf() === count) {
                    done = true;
                }
            }
            done = (done || (exploding.length === 0));
        }
        return rolls;
    }
}
exports.ExplodeModifier = ExplodeModifier;
_ExplodeModifier_comparisonMode = new WeakMap(), _ExplodeModifier_comparisonValue = new WeakMap(), _ExplodeModifier_limit = new WeakMap();
class RounderR extends Resolver {
    constructor(mode, thingToRound, ast) {
        super((RounderR.modeToFunc(mode))(thingToRound.valueOf()), ast);
        _RounderR_mode.set(this, void 0);
        _RounderR_thingRounded.set(this, void 0);
        __classPrivateFieldSet(this, _RounderR_mode, mode, "f");
        __classPrivateFieldSet(this, _RounderR_thingRounded, thingToRound, "f");
    }
    get mode() {
        return __classPrivateFieldGet(this, _RounderR_mode, "f");
    }
    get thingRounded() {
        return __classPrivateFieldGet(this, _RounderR_thingRounded, "f");
    }
    get rolls() {
        return __classPrivateFieldGet(this, _RounderR_thingRounded, "f").rolls;
    }
    static modeToFunc(mode) {
        if (mode === "f") {
            return Math.floor;
        }
        if (mode === "c") {
            return Math.ceil;
        }
        if (mode === "r") {
            return Math.round;
        }
        throw ("invalid round mode");
    }
}
exports.RounderR = RounderR;
_RounderR_mode = new WeakMap(), _RounderR_thingRounded = new WeakMap();
class MathOpR extends Resolver {
    constructor(op, operand, ast) {
        super(NaN, ast);
        _MathOpR_op.set(this, void 0);
        _MathOpR_opFunc.set(this, void 0);
        _MathOpR_operand.set(this, void 0);
        __classPrivateFieldSet(this, _MathOpR_op, op, "f");
        __classPrivateFieldSet(this, _MathOpR_operand, operand, "f");
        if (op === "+") {
            __classPrivateFieldSet(this, _MathOpR_opFunc, (a) => a + __classPrivateFieldGet(this, _MathOpR_operand, "f").valueOf(), "f");
        }
        else if (op === "-") {
            __classPrivateFieldSet(this, _MathOpR_opFunc, (a) => a - __classPrivateFieldGet(this, _MathOpR_operand, "f").valueOf(), "f");
        }
        else if (op === "*") {
            __classPrivateFieldSet(this, _MathOpR_opFunc, (a) => a * __classPrivateFieldGet(this, _MathOpR_operand, "f").valueOf(), "f");
        }
        else if (op === "/") {
            __classPrivateFieldSet(this, _MathOpR_opFunc, (a) => a / __classPrivateFieldGet(this, _MathOpR_operand, "f").valueOf(), "f");
        }
        else {
            throw "invalid math operation";
        }
    }
    get op() {
        return __classPrivateFieldGet(this, _MathOpR_op, "f");
    }
    get operand() {
        return __classPrivateFieldGet(this, _MathOpR_operand, "f");
    }
    /* we use the commuted version so we don't have to worry to hard about
    order of multiply vs divider or subtract vs add. It means we can split up
    operations based on pure multiply vs add lines, and just sum / multiple them
    up. This makes the MathOpListR implementation simpler. */
    get commute() {
        if (this.op === "-") {
            return new MathOpR("+", new StaticR(__classPrivateFieldGet(this, _MathOpR_operand, "f").valueOf() * -1), this.ast);
        }
        else if (this.op === "/") {
            return new MathOpR("*", new StaticR(1 / __classPrivateFieldGet(this, _MathOpR_operand, "f").valueOf()), this.ast);
        }
        else {
            return new MathOpR(this.op, __classPrivateFieldGet(this, _MathOpR_operand, "f"), this.ast);
        }
    }
    get rolls() {
        return __classPrivateFieldGet(this, _MathOpR_operand, "f").rolls;
    }
    eval(acc) {
        return __classPrivateFieldGet(this, _MathOpR_opFunc, "f").call(this, acc.valueOf());
    }
}
exports.MathOpR = MathOpR;
_MathOpR_op = new WeakMap(), _MathOpR_opFunc = new WeakMap(), _MathOpR_operand = new WeakMap();
class MathOpListR extends Resolver {
    constructor(ops, ast) {
        super(NaN, ast);
        _MathOpListR_ops.set(this, []);
        __classPrivateFieldSet(this, _MathOpListR_ops, ops, "f");
    }
    get ops() {
        return __classPrivateFieldGet(this, _MathOpListR_ops, "f");
    }
    get rolls() {
        let deep = __classPrivateFieldGet(this, _MathOpListR_ops, "f").map((o) => o.rolls);
        return deep.flatMap((e) => e);
    }
    eval(initial) {
        let commutables = __classPrivateFieldGet(this, _MathOpListR_ops, "f").map((o) => o.commute);
        let multReduce = (acc, op) => {
            if (op.op === "*") {
                acc.number = op.eval(acc.number);
                return acc;
            }
            else {
                acc.opList.push(new MathOpR(op.op, new StaticR(acc.number), this.ast));
                acc.number = op.operand.valueOf();
                return acc;
            }
        };
        let initialMultiReduce = { number: initial.valueOf(), opList: [] };
        let multReduced = commutables.reduce(multReduce, initialMultiReduce);
        let addReduce = (acc, op) => {
            return op.eval(acc);
        };
        let addReduced = multReduced.opList.reduce(addReduce, multReduced.number);
        return addReduced;
    }
}
exports.MathOpListR = MathOpListR;
_MathOpListR_ops = new WeakMap();
class MathSeqR extends Resolver {
    constructor(head, ops, ast) {
        super(ops.eval(head).valueOf(), ast);
        _MathSeqR_ops.set(this, void 0);
        _MathSeqR_head.set(this, void 0);
        __classPrivateFieldSet(this, _MathSeqR_head, head, "f");
        __classPrivateFieldSet(this, _MathSeqR_ops, ops, "f");
    }
    get head() {
        return __classPrivateFieldGet(this, _MathSeqR_head, "f");
    }
    get ops() {
        return __classPrivateFieldGet(this, _MathSeqR_ops, "f");
    }
    get rolls() {
        return __classPrivateFieldGet(this, _MathSeqR_head, "f").rolls.concat(__classPrivateFieldGet(this, _MathSeqR_ops, "f").rolls);
    }
}
exports.MathSeqR = MathSeqR;
_MathSeqR_ops = new WeakMap(), _MathSeqR_head = new WeakMap();
class ParensR extends Resolver {
    constructor(n, ast) {
        super(n.valueOf(), ast);
        _ParensR_expression.set(this, void 0);
        __classPrivateFieldSet(this, _ParensR_expression, n, "f");
    }
    get expression() {
        return __classPrivateFieldGet(this, _ParensR_expression, "f");
    }
    get rolls() {
        return __classPrivateFieldGet(this, _ParensR_expression, "f").rolls;
    }
}
exports.ParensR = ParensR;
_ParensR_expression = new WeakMap();
function eval_factory(ast, keyMap, scope) {
    if (ast instanceof grammer.Static) {
        return eval_static(ast.value);
    }
    if (ast instanceof grammer.Lookup) {
        return eval_lookup(ast.lookupName, scope);
    }
    if (ast instanceof grammer.RollSetModifiers) {
        return eval_rollsetmodifiers(ast, keyMap);
    }
    if (ast instanceof grammer.KeepDrop) {
        return eval_keepdrop(ast, keyMap);
    }
    if (ast instanceof grammer.ReRoll) {
        return eval_reroll(ast, keyMap);
    }
    if (ast instanceof grammer.Explode) {
        return eval_explode(ast, keyMap);
    }
    if (ast instanceof grammer.MathOp) {
        return eval_mathop(ast, keyMap);
    }
    if (ast instanceof grammer.MathOpList) {
        return eval_mathoplist(ast, keyMap);
    }
    if (ast instanceof grammer.MathSeq) {
        return eval_mathseq(ast, keyMap);
    }
    if (ast instanceof grammer.Rounder) {
        return eval_rounder(ast, keyMap);
    }
    if (ast instanceof grammer.Parens) {
        return eval_parens(ast, keyMap);
    }
    if (ast instanceof grammer.DiceRoll) {
        return eval_diceroll(ast, keyMap);
    }
    throw ('invalid ast');
}
function eval_static(n) {
    return new StaticR(n);
}
function eval_lookup(name, scope) {
    return new LookupR(name, scope);
}
function eval_rollsetmodifiers(ast, keyMap) {
    let kidKeys = ast.children();
    let reducer = (a, k) => {
        if (keyMap[k] === undefined) {
            return a;
        }
        else {
            a.push(keyMap[k]);
            return a;
        }
    };
    let mods = kidKeys.reduce(reducer, []);
    return new RollSetModifiersR(mods, ast);
}
function eval_keepdrop(ast, keyMap) {
    let action = ast.action;
    let direction = ast.direction;
    let howMany = keyMap.howMany;
    return new KeepDropModifier(action, direction, howMany, ast);
}
function eval_reroll(ast, keyMap) {
    let comparison = ast.comparisonStr;
    return new RerollModifier(comparison, keyMap.compareToVal, keyMap.limit, ast);
}
function eval_explode(ast, keyMap) {
    return new ExplodeModifier(ast.comparisonStr, keyMap.compareToVal, keyMap.limit, ast);
}
function eval_mathop(ast, keyMap) {
    if (keyMap.val === undefined) {
        throw ('a mathop needs something to op on');
    }
    return new MathOpR(ast.op, keyMap.val, ast);
}
function eval_mathoplist(ast, keyMap) {
    let kidKeys = ast.children();
    let reducer = (a, index) => {
        if (keyMap[index] === undefined) {
            return a;
        }
        else {
            a.push(keyMap[index]);
            return a;
        }
    };
    let ops = kidKeys.reduce(reducer, []);
    return new MathOpListR(ops, ast);
}
function eval_mathseq(ast, keyMap) {
    var _a;
    if (keyMap.head === undefined) {
        throw ("need a start up for mathseq");
    }
    let ops = (_a = keyMap.ops) !== null && _a !== void 0 ? _a : (new MathOpListR([], ast.ops));
    return new MathSeqR(keyMap.head, ops, ast);
}
function eval_rounder(ast, keyMap) {
    if (keyMap.thingToRound === undefined) {
        throw ('cannot round/ceiling/floor undefined');
    }
    return new RounderR(ast.roundType, keyMap.thingToRound, ast);
}
function eval_parens(ast, keyMap) {
    if (keyMap.expression === undefined) {
        throw ('parens somehow ended up with undefined expression');
    }
    return new ParensR(keyMap.expression, ast);
}
function eval_diceroll(ast, keyMap) {
    var _a, _b, _c;
    if (keyMap.max === undefined) {
        throw ('dice rolls _must_ have at least a max defined');
    }
    let mods = (_a = keyMap.modifiers) !== null && _a !== void 0 ? _a : new RollSetModifiersR([], new grammer.RollSetModifers([]));
    return new DiceRollR((_b = keyMap.x) !== null && _b !== void 0 ? _b : new StaticR(1), (_c = keyMap.min) !== null && _c !== void 0 ? _c : new StaticR(1), keyMap.max, mods, ast);
}
function eval_default(key, thing) {
    if (thing instanceof grammer.KeepDrop && key === "howMany") {
        return new StaticR(1);
    }
    if (thing instanceof grammer.ReRoll && key === "limit") {
        return new StaticR(1);
    }
    if (thing instanceof grammer.ReRoll && key === "compareToVal") {
        // TODO may this never be called.
        return new StaticR(1);
    }
    if (thing instanceof grammer.Explode && key === "limit") {
        return new StaticR(10000);
    }
    if (thing instanceof grammer.Explode && key === "compareToVal") {
        // TODO may this never be called.
        return new StaticR(1);
    }
    if (thing instanceof grammer.DiceRoll && key === "x") {
        return new StaticR(1);
    }
    if (thing instanceof grammer.DiceRoll && key === "min") {
        return new StaticR(1);
    }
    if (thing instanceof grammer.DiceRoll && key === "modifiers") {
        return new RollSetModifiersR([], new grammer.RollSetModifiers([]));
    }
    throw ("If you got here, somehow parsing allowed things that should not be null to be null");
}
exports.eval_default = eval_default;
function resolve_parsed(parsed, scope) {
    let reducer = (ast, keymap) => {
        return eval_factory(ast, keymap, scope);
    };
    let defaulter = (tree, node, key) => {
        let mid = eval_default(key, node);
        return mid.ast;
    };
    return grammer.walk_ast(parsed, undefined, defaulter, reducer);
}
exports.eval = function (parsed, scope) {
    scope = scope !== null && scope !== void 0 ? scope : {};
    return resolve_parsed(parsed, scope);
};

},{"./grammerAST":4}],4:[function(require,module,exports){
"use strict";
/* A representation of a dice syntax tree. This allows the various other
modules to work on a well typed tree rather than just 'knowing' about
function names and arguments. In addition to defining the nodes of the AST,
it also provides a helper class for walking the tree.
*/
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Static_value, _Lookup_lookupName, _RollSetModifiers_mods, _RollSetModifiers_kidKeys, _KeepDrop_action, _KeepDrop_direction, _KeepDrop_howMany, _ReRoll_comparisonStr, _ReRoll_compareToVal, _ReRoll_limit, _Explode_comparisonStr, _Explode_compareToVal, _Explode_limit, _DiceRoll_x, _DiceRoll_min, _DiceRoll_max, _DiceRoll_modifiers, _Rounder_roundType, _Rounder_thingToRound, _MathOp_opStr, _MathOp_val, _MathOpList_ops, _MathOpList_kidKeys, _MathSeq_ops, _MathSeq_head, _Parens_expression, _TreeWalkerStep_currentNode, _TreeWalkerStep_allKeys, _TreeWalkerStep_keyItor, _TreeWalkerStep_currentKey, _TreeWalkerStep_keyMapAcc;
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk_ast = exports.TreeWalkerStep = exports.Parens = exports.MathSeq = exports.MathOpList = exports.MathOp = exports.Rounder = exports.DiceRoll = exports.Explode = exports.ReRoll = exports.KeepDrop = exports.RollSetModifiers = exports.Lookup = exports.Static = void 0;
/* A raw number.
    5
*/
class Static {
    constructor(val) {
        _Static_value.set(this, void 0);
        __classPrivateFieldSet(this, _Static_value, val, "f");
    }
    get value() {
        return __classPrivateFieldGet(this, _Static_value, "f");
    }
    children() {
        return [];
    }
    static is(a) {
        return (a instanceof Static);
    }
}
exports.Static = Static;
_Static_value = new WeakMap();
/* The lookup syntax:
     [some name]
*/
class Lookup {
    constructor(name) {
        _Lookup_lookupName.set(this, void 0);
        __classPrivateFieldSet(this, _Lookup_lookupName, name, "f");
    }
    get lookupName() {
        return __classPrivateFieldGet(this, _Lookup_lookupName, "f");
    }
    children() {
        return [];
    }
    static is(a) {
        return (a instanceof Lookup);
    }
}
exports.Lookup = Lookup;
_Lookup_lookupName = new WeakMap();
/* A set of roll modifiers. Usually empty.
    { rollModifer; ... }
*/
class RollSetModifiers {
    constructor(mods) {
        _RollSetModifiers_mods.set(this, []);
        _RollSetModifiers_kidKeys.set(this, []);
        let kidKeys = [];
        for (let i = 0; i < mods.length; i++) {
            kidKeys.push(i);
        }
        __classPrivateFieldSet(this, _RollSetModifiers_kidKeys, kidKeys, "f");
        __classPrivateFieldSet(this, _RollSetModifiers_mods, mods, "f");
        let self = this;
        let kidPropsInit = {};
        let kidProps = kidKeys.reduce((acc, index) => {
            let property = { get: function () { return self.mods[index]; },
                set: function (v) { self.mods[index] = v; }
            };
            acc[index] = property;
            return acc;
        }, kidPropsInit);
        Object.defineProperties(this, kidProps);
        let modIndexKvRefs = __classPrivateFieldGet(this, _RollSetModifiers_kidKeys, "f").map((i) => { return { key: i, val: __classPrivateFieldGet(this, _RollSetModifiers_mods, "f")[i] }; });
    }
    get mods() {
        return __classPrivateFieldGet(this, _RollSetModifiers_mods, "f");
    }
    children() {
        let mapper = (i) => {
            return i;
        };
        let out = __classPrivateFieldGet(this, _RollSetModifiers_kidKeys, "f").map(mapper);
        return out;
    }
    static is(a) {
        return (a instanceof RollSetModifiers);
    }
}
exports.RollSetModifiers = RollSetModifiers;
_RollSetModifiers_mods = new WeakMap(), _RollSetModifiers_kidKeys = new WeakMap();
class KeepDrop {
    constructor(action, direction, howMany) {
        _KeepDrop_action.set(this, "keep");
        _KeepDrop_direction.set(this, "highest");
        _KeepDrop_howMany.set(this, void 0);
        __classPrivateFieldSet(this, _KeepDrop_action, action, "f");
        __classPrivateFieldSet(this, _KeepDrop_direction, direction, "f");
        __classPrivateFieldSet(this, _KeepDrop_howMany, howMany, "f");
    }
    get action() {
        return __classPrivateFieldGet(this, _KeepDrop_action, "f");
    }
    get direction() {
        return __classPrivateFieldGet(this, _KeepDrop_direction, "f");
    }
    get howMany() {
        return __classPrivateFieldGet(this, _KeepDrop_howMany, "f");
    }
    children() {
        return ['howMany'];
    }
    static is(a) {
        return (a instanceof KeepDrop);
    }
}
exports.KeepDrop = KeepDrop;
_KeepDrop_action = new WeakMap(), _KeepDrop_direction = new WeakMap(), _KeepDrop_howMany = new WeakMap();
/* when to reroll a die.
    :rr
    reroll // reroll on die min an undefined number of times.
    :rr1
    reroll 1x // reroll on die min once.
    reroll <3 5x
    */
class ReRoll {
    constructor(comparisonStr, compareToVal, limit) {
        _ReRoll_comparisonStr.set(this, void 0);
        _ReRoll_compareToVal.set(this, void 0);
        _ReRoll_limit.set(this, void 0);
        __classPrivateFieldSet(this, _ReRoll_compareToVal, compareToVal, "f");
        __classPrivateFieldGet(this, _ReRoll_comparisonStr, "f");
        __classPrivateFieldSet(this, _ReRoll_limit, limit, "f");
    }
    get comparisonStr() {
        return __classPrivateFieldGet(this, _ReRoll_comparisonStr, "f");
    }
    get compareToVal() {
        return __classPrivateFieldGet(this, _ReRoll_compareToVal, "f");
    }
    get limit() {
        return __classPrivateFieldGet(this, _ReRoll_limit, "f");
    }
    children() {
        return ['limit', 'compareToVal'];
    }
    static is(a) {
        return (a instanceof ReRoll);
    }
}
exports.ReRoll = ReRoll;
_ReRoll_comparisonStr = new WeakMap(), _ReRoll_compareToVal = new WeakMap(), _ReRoll_limit = new WeakMap();
/* the 'explode' or wild die representation.
    1w6
    1W6
    explode 1x
    explode >5 3x
    */
class Explode {
    constructor(comparisonStr, compareToVal, limit) {
        _Explode_comparisonStr.set(this, void 0);
        _Explode_compareToVal.set(this, void 0);
        _Explode_limit.set(this, void 0);
        __classPrivateFieldSet(this, _Explode_comparisonStr, comparisonStr, "f");
        __classPrivateFieldSet(this, _Explode_limit, limit, "f");
        __classPrivateFieldSet(this, _Explode_compareToVal, compareToVal, "f");
    }
    get comparisonStr() {
        return __classPrivateFieldGet(this, _Explode_comparisonStr, "f");
    }
    get compareToVal() {
        return __classPrivateFieldGet(this, _Explode_compareToVal, "f");
    }
    get limit() {
        return __classPrivateFieldGet(this, _Explode_limit, "f");
    }
    children() {
        return ['limit', 'compareToVal'];
    }
    static is(a) {
        return (a instanceof Explode);
    }
}
exports.Explode = Explode;
_Explode_comparisonStr = new WeakMap(), _Explode_compareToVal = new WeakMap(), _Explode_limit = new WeakMap();
/* The reason you're here, a dice roll. Most parts end up being optional, but
we need at least a maximum defined.
*/
class DiceRoll {
    constructor(x, min, max, modifiers) {
        _DiceRoll_x.set(this, void 0);
        _DiceRoll_min.set(this, void 0);
        _DiceRoll_max.set(this, void 0);
        _DiceRoll_modifiers.set(this, void 0);
        __classPrivateFieldSet(this, _DiceRoll_x, x, "f");
        __classPrivateFieldSet(this, _DiceRoll_min, min, "f");
        __classPrivateFieldSet(this, _DiceRoll_max, max, "f");
        __classPrivateFieldSet(this, _DiceRoll_modifiers, modifiers, "f");
    }
    get x() {
        return __classPrivateFieldGet(this, _DiceRoll_x, "f");
    }
    get min() {
        return __classPrivateFieldGet(this, _DiceRoll_min, "f");
    }
    get max() {
        return __classPrivateFieldGet(this, _DiceRoll_max, "f");
    }
    get modifiers() {
        return __classPrivateFieldGet(this, _DiceRoll_modifiers, "f");
    }
    children() {
        let keys = ['x',
            'min',
            'max',
            'modifiers'
        ];
        return keys;
    }
    static is(a) {
        return (a instanceof DiceRoll);
    }
}
exports.DiceRoll = DiceRoll;
_DiceRoll_x = new WeakMap(), _DiceRoll_min = new WeakMap(), _DiceRoll_max = new WeakMap(), _DiceRoll_modifiers = new WeakMap();
/* floor, ceiling, and basic rounding.
    f( )
    c( )
    r( )
    f[ ]
    c[ ]
    r[ ]
    */
class Rounder {
    constructor(type, thingToRound) {
        _Rounder_roundType.set(this, "r");
        _Rounder_thingToRound.set(this, void 0);
        __classPrivateFieldSet(this, _Rounder_roundType, type, "f");
        __classPrivateFieldSet(this, _Rounder_thingToRound, thingToRound, "f");
    }
    get roundType() {
        return __classPrivateFieldGet(this, _Rounder_roundType, "f");
    }
    get thingToRound() {
        return __classPrivateFieldGet(this, _Rounder_thingToRound, "f");
    }
    children() {
        return ['thingToRound'];
    }
    static is(a) {
        return (a instanceof Rounder);
    }
}
exports.Rounder = Rounder;
_Rounder_roundType = new WeakMap(), _Rounder_thingToRound = new WeakMap();
/* A math operator and the next "number" in the sequence. Used as part of
a MathOpList.
*/
class MathOp {
    constructor(op, val) {
        _MathOp_opStr.set(this, "+");
        _MathOp_val.set(this, void 0);
        __classPrivateFieldSet(this, _MathOp_opStr, op, "f");
        __classPrivateFieldSet(this, _MathOp_val, val, "f");
    }
    get op() {
        return __classPrivateFieldGet(this, _MathOp_opStr, "f");
    }
    get val() {
        return __classPrivateFieldGet(this, _MathOp_val, "f");
    }
    children() {
        return ['val'];
    }
    static is(a) {
        return (a instanceof MathOp);
    }
}
exports.MathOp = MathOp;
_MathOp_opStr = new WeakMap(), _MathOp_val = new WeakMap();
/* A walkable version of an array of mathops.
*/
class MathOpList {
    constructor(ops) {
        _MathOpList_ops.set(this, []);
        _MathOpList_kidKeys.set(this, []);
        let kidKeys = [];
        for (let i = 0; i < ops.length; i++) {
            kidKeys.push(i);
        }
        __classPrivateFieldSet(this, _MathOpList_ops, ops, "f");
        __classPrivateFieldSet(this, _MathOpList_kidKeys, kidKeys, "f");
        let self = this;
        let kidProps = kidKeys.reduce((acc, index) => {
            let newProp = {
                get: function () { return __classPrivateFieldGet(self, _MathOpList_ops, "f")[index]; },
                set: function (v) { __classPrivateFieldGet(self, _MathOpList_ops, "f")[index] = v; }
            };
            acc[index] = newProp;
            return acc;
        }, {});
        Object.defineProperties(this, kidProps);
    }
    get ops() {
        return __classPrivateFieldGet(this, _MathOpList_ops, "f");
    }
    children() {
        let mapper = (i) => {
            return i;
        };
        let out = __classPrivateFieldGet(this, _MathOpList_kidKeys, "f").map(mapper);
        return out;
    }
    static is(a) {
        return (a instanceof MathOpList);
    }
}
exports.MathOpList = MathOpList;
_MathOpList_ops = new WeakMap(), _MathOpList_kidKeys = new WeakMap();
/* Defines the 'acc' for the fold of a MathOpList.
*/
class MathSeq {
    constructor(head, ops) {
        _MathSeq_ops.set(this, new MathOpList([]));
        _MathSeq_head.set(this, void 0);
        __classPrivateFieldSet(this, _MathSeq_head, head, "f");
        __classPrivateFieldSet(this, _MathSeq_ops, ops, "f");
    }
    get head() {
        return __classPrivateFieldGet(this, _MathSeq_head, "f");
    }
    get ops() {
        return __classPrivateFieldGet(this, _MathSeq_ops, "f");
    }
    children() {
        return ['head', 'ops'];
    }
    static is(a) {
        return (a instanceof MathSeq);
    }
}
exports.MathSeq = MathSeq;
_MathSeq_ops = new WeakMap(), _MathSeq_head = new WeakMap();
/* Because sometimes the order of operations is not what we need.
*/
class Parens {
    constructor(express) {
        _Parens_expression.set(this, void 0);
        __classPrivateFieldSet(this, _Parens_expression, express, "f");
    }
    get expression() {
        return __classPrivateFieldGet(this, _Parens_expression, "f");
    }
    children() {
        return ['expression'];
    }
    static is(a) {
        return (a instanceof Parens);
    }
}
exports.Parens = Parens;
_Parens_expression = new WeakMap();
/* A state holder when walking an AST. It holds a node, an iterator of that
node's children, and a keymap to feed to an accumulator once it has been fully
walked. The intent is a node would be the tree, a new step created, then for
each child of the node. this step is pushed onto a stack, and we repeat at the
'node in the tree' point until there are no children to walk to. A deeper
explanation is at the 'walk_ast' function.
*/
class TreeWalkerStep {
    constructor(thing) {
        _TreeWalkerStep_currentNode.set(this, void 0);
        _TreeWalkerStep_allKeys.set(this, []);
        _TreeWalkerStep_keyItor.set(this, void 0);
        _TreeWalkerStep_currentKey.set(this, void 0);
        _TreeWalkerStep_keyMapAcc.set(this, {});
        __classPrivateFieldSet(this, _TreeWalkerStep_currentNode, thing, "f");
        __classPrivateFieldSet(this, _TreeWalkerStep_allKeys, thing.children(), "f");
        __classPrivateFieldSet(this, _TreeWalkerStep_keyItor, __classPrivateFieldGet(this, _TreeWalkerStep_allKeys, "f").values(), "f");
    }
    get currentKey() {
        if (__classPrivateFieldGet(this, _TreeWalkerStep_currentKey, "f") === undefined) {
            throw ("No current key; may need to reset the iteration and call 'next'");
        }
        else {
            return __classPrivateFieldGet(this, _TreeWalkerStep_currentKey, "f");
        }
    }
    get currentValue() {
        if (__classPrivateFieldGet(this, _TreeWalkerStep_currentKey, "f") === undefined) {
            return undefined;
        }
        return __classPrivateFieldGet(this, _TreeWalkerStep_currentNode, "f")[__classPrivateFieldGet(this, _TreeWalkerStep_currentKey, "f")];
    }
    get currentNode() {
        return __classPrivateFieldGet(this, _TreeWalkerStep_currentNode, "f");
    }
    get keymapSoFar() {
        return __classPrivateFieldGet(this, _TreeWalkerStep_keyMapAcc, "f");
    }
    get keymap() {
        let validator = (key) => {
            if (__classPrivateFieldGet(this, _TreeWalkerStep_keyMapAcc, "f")[key] === undefined) {
                throw (key + ' is not yet set');
            }
            return true;
        };
        __classPrivateFieldGet(this, _TreeWalkerStep_allKeys, "f").forEach(validator);
        let out = __classPrivateFieldGet(this, _TreeWalkerStep_keyMapAcc, "f");
        return out;
    }
    get allKeys() {
        return __classPrivateFieldGet(this, _TreeWalkerStep_allKeys, "f");
    }
    resetItor() {
        __classPrivateFieldSet(this, _TreeWalkerStep_keyItor, __classPrivateFieldGet(this, _TreeWalkerStep_allKeys, "f").values(), "f");
        __classPrivateFieldSet(this, _TreeWalkerStep_currentKey, undefined, "f");
    }
    next() {
        let rawNext = __classPrivateFieldGet(this, _TreeWalkerStep_keyItor, "f").next();
        __classPrivateFieldSet(this, _TreeWalkerStep_currentKey, rawNext.value, "f");
        let outValue = {
            key: __classPrivateFieldGet(this, _TreeWalkerStep_currentKey, "f"),
            value: this.currentValue,
            done: rawNext.done
        };
        return outValue;
    }
    setKey(key, value) {
        __classPrivateFieldGet(this, _TreeWalkerStep_keyMapAcc, "f")[key] = value;
    }
    setCurrent(value) {
        if (this.currentKey === undefined) {
            throw ("No current key. You either never called next, called next too often, or called next but didn't check the 'done' property.");
        }
        else {
            __classPrivateFieldGet(this, _TreeWalkerStep_keyMapAcc, "f")[this.currentKey] = value;
        }
    }
}
exports.TreeWalkerStep = TreeWalkerStep;
_TreeWalkerStep_currentNode = new WeakMap(), _TreeWalkerStep_allKeys = new WeakMap(), _TreeWalkerStep_keyItor = new WeakMap(), _TreeWalkerStep_currentKey = new WeakMap(), _TreeWalkerStep_keyMapAcc = new WeakMap();
/* Given a way to deal with missing children, and what to do once a leaf
node is found, walk the ast building up an accumulator. It's a big loop to
avoid blowing out the call stack. State is a stack of TreeWalkerStep's. It
worketh thusly:

Given a node, create a new TreeWalkerStep.
While there are unwalked to children of the node:
    Get the 'first' unwalked child.
    If the child is undefined, define it using the DefineDefault.
    Push the current TreeWalkerStep onto the stack.
    Set the child as the given node,
    loop around.
    pop a TreeWalkerStep off the stack.
    Assign the child to the current working key
    If there are no children left to walk
        call the accumulator
        pop
        loop around
    else
        walk next child / loop around
*/
function walk_ast(ast, defaultAcc, defaulter, reducer) {
    let stepStack = [];
    let currentStep = new TreeWalkerStep(ast);
    let done = false;
    let acc = defaultAcc;
    while (!done) {
        let currentKeyVal = currentStep.next();
        if (currentKeyVal.done) {
            acc = reducer(currentStep.currentNode, currentStep.keymap);
            let popped = stepStack.pop();
            if (popped === undefined) {
                done = true;
            }
            else {
                popped.setCurrent(acc);
                currentStep = popped;
            }
        }
        else if (currentKeyVal.value === undefined) {
            let defaulted = defaulter(stepStack.map((w) => w.currentNode), currentStep.currentNode, currentStep.currentKey);
            stepStack.push(currentStep);
            currentStep = new TreeWalkerStep(defaulted);
        }
        else {
            stepStack.push(currentStep);
            currentStep = new TreeWalkerStep(currentKeyVal.value);
        }
    }
    return acc;
}
exports.walk_ast = walk_ast;

},{}],5:[function(require,module,exports){
// Generated by Peggy 1.2.0.
//
// https://peggyjs.org/

"use strict";


let ast = require("./grammerAST");


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

  var peg$f0 = function(exp, tail) {
  		if(tail.length == 0){
  			return exp;
  		} else {
  			let tailMapper = (arr) => {
  				let op = arr[0];
  				let tailExp = arr[1];
  				return new ast.MathOp(op, tailExp);
  			}
  			let mappedTail = tail.map(tailMapper);
  			let mathOpList = new ast.MathOpList(mappedTail);
  			let mathSeq = new ast.MathSeq(exp, mathOpList);
  			return mathSeq;
  		}
  	};
  var peg$f1 = function(x, min, max, mods) {

  		return new ast.DiceRoll(x ?? undefined, min, max, mods ?? undefined);
  	};
  var peg$f2 = function(x, max, mods) {
  		return new ast.DiceRoll(x ?? undefined, undefined, max, mods ?? undefined);
  	};
  var peg$f3 = function(x, min, max, mods) {
  		let modsObject = mods ?? new ast.RollSetModifiers([]);
  		mods = modsObject.mods;
  		let wildMod = new ast.Explode("=", max, undefined, min, max);
  		mods.unshift(wildMod);
  		let properMods = new ast.RollSetModifiers(mods);
  		return new ast.DiceRoll(x ?? undefined, min, max, properMods);
  	};
  var peg$f4 = function(x, max, maybeMods) {
  		let originalMods = maybeMods ?? new ast.RollSetModifiers([]);
  		let mods = originalMods.mods;
  		let wildMod = new ast.Explode("=", max, undefined, 1, max);
  		mods.unshift(wildMod);
  		let properMods = new ast.RollSetModifiers(mods);
  		return new ast.DiceRoll(x ?? undefined, undefined, max, properMods);
  	};
  var peg$f5 = function(min, max, maybeMods) {
  		return new ast.DiceRoll(undefined, min, max, maybeMods ?? undefined);
  	};
  var peg$f6 = function(s) {
  		return new ast.RollSetModifiers([s]);
  	};
  var peg$f7 = function(kd, maybe_hl, maybe_howMany) {
  		let defaultDiceType = "highest";
  		let action = "keep";
  		if(kd.toLowerCase() === "d"){
  			action = "drop"
  			defaultDiceType = "lowest"
  		}
  		let diceType = defaultDiceType;
  		if(maybe_hl){
  			if(maybe_hl.toLowerCase() === "l"){
  				diceType = "lowest";
  			} else {
  				diceType = "highest";
  			}
  		}
  		let howMany = maybe_howMany ?? undefined;
  		return new ast.KeepDrop(action, diceType, howMany);
  	};
  var peg$f8 = function(dt, maybe_howMany) {
  		let action = "keep";
  		let diceType = "highest";
  		if(dt.toLowerCase() === "h"){
  			action = "keep";
  			diceType = "highest";
  		} else {
  			action = "drop";
  			diceType = "lowest"
  		}
  		let howMany = maybe_howMany ?? undefined;
  		return new ast.KeepDrop(action, diceType, howMany);
  	};
  var peg$f9 = function(maybe_limit) {
  		let limit = maybe_limit ?? undefined;
  		return new ast.ReRoll("=", undefined, undefined);
  	};
  var peg$f10 = function(seq) {
  		return seq;
  	};
  var peg$f11 = function(head, tail) {
  		tail.unshift(head);
  		return new ast.RollSetModifiers(tail);
  	};
  var peg$f12 = function(action, dt, maybe_howMany) {
  		let howMany = (maybe_howMany ?? [undefined, undefined])[1] ?? undefined;
  		dt = dt[1];
  		return new ast.KeepDrop(action, dt, howMany);
  	};
  var peg$f13 = function(compareStr, compareVal, limit) {
  		return new ast.Explode(compareStr, compareVal, limit);
  	};
  var peg$f14 = function(compareStr, compareVal) {
  		return new ast.Explode(compareStr, compareVal, undefined);
  	};
  var peg$f15 = function(compareStr, limit) {
  		return new ast.Explode(compareStr, undefined, limit);
  	};
  var peg$f16 = function(compareVal, limit) {
  		return new ast.Explode(undefined, compareVal, limit);
  	};
  var peg$f17 = function(limit) {
  		return new ast.Explode(undefined, undefined, limit);
  	};
  var peg$f18 = function() {
  		return new ast.Explode(undefined, undefined, undefined);
  	};
  var peg$f19 = function(compareStr, compareVal, limit) {
  		return new ast.ReRoll(compareStr, compareVal, limit);
  	};
  var peg$f20 = function(compareVal, limit) {
  		return new ast.ReRoll(undefined, compareVal, limit);
  	};
  var peg$f21 = function(compareStr, compareVal) {
  		return new ast.ReRoll(compareStr, compareVal);
  	};
  var peg$f22 = function(limit) {
  		return new ast.ReRoll(undefined, undefined, limit);
  	};
  var peg$f23 = function(compareVal) {
  		return new ast.ReRoll(undefined, compareVal);
  	};
  var peg$f24 = function() {
  		return new ast.ReRoll();
  	};
  var peg$f25 = function(maybe_rounder, p) {
  		if(maybe_rounder){
  			return new ast.Rounder(maybe_rounder, p);
  		} else {
  			return p;
  		}
  	};
  var peg$f26 = function(e) {
  		return new ast.Parens(e);
  	};
  var peg$f27 = function(maybe_r, lookup) {
  		let baseAst = new ast.Lookup(lookup);
  		if(maybe_r){
  			return new ast.Rounder(maybe_r, baseAst);
  		} else {
  			return baseAst;
  		}
  	};
  var peg$f28 = function(r, p) {
  		return new ast.Rounder(r, p);
  	};
  var peg$f29 = function(i) {
  		return new ast.Static(i);
  	};
  var peg$f30 = function(name) {
  		return name.join('');
  	};
  var peg$f31 = function() {
  		return parseInt(text());
  	};

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
      peg$savedPos = s0;
      s0 = peg$f0(s2, s3);
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
            peg$savedPos = s0;
            s0 = peg$f1(s1, s3, s5, s6);
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
          peg$savedPos = s0;
          s0 = peg$f2(s1, s3, s4);
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
                peg$savedPos = s0;
                s0 = peg$f3(s1, s3, s5, s6);
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
              peg$savedPos = s0;
              s0 = peg$f4(s1, s3, s4);
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
                  peg$savedPos = s0;
                  s0 = peg$f5(s1, s3, s4);
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
    var s0, s1;

    s0 = peg$currPos;
    s1 = peg$parsesimpleModifiers();
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f6(s1);
    }
    s0 = s1;
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
        peg$savedPos = s0;
        s0 = peg$f7(s2, s3, s4);
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
          peg$savedPos = s0;
          s0 = peg$f8(s2, s3);
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
          peg$savedPos = s0;
          s0 = peg$f9(s2);
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
          peg$savedPos = s0;
          s0 = peg$f10(s4);
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
      peg$savedPos = s0;
      s0 = peg$f11(s1, s2);
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
        peg$savedPos = s0;
        s0 = peg$f12(s1, s2, s3);
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
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 7) === peg$c14) {
      s1 = peg$c14;
      peg$currPos += 7;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e18); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseneed_ws();
      if (s2 !== peg$FAILED) {
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
                  peg$savedPos = s0;
                  s0 = peg$f13(s3, s5, s7);
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
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c14) {
        s1 = peg$c14;
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e18); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseneed_ws();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecomparison();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseopt_ws();
            s5 = peg$parseintVal();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f14(s3, s5);
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
        if (input.substr(peg$currPos, 7) === peg$c14) {
          s1 = peg$c14;
          peg$currPos += 7;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e18); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseneed_ws();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsecomparison();
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
                    peg$savedPos = s0;
                    s0 = peg$f15(s3, s5);
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
          if (input.substr(peg$currPos, 7) === peg$c14) {
            s1 = peg$c14;
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e18); }
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
                      peg$savedPos = s0;
                      s0 = peg$f16(s3, s5);
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
            if (input.substr(peg$currPos, 7) === peg$c14) {
              s1 = peg$c14;
              peg$currPos += 7;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e18); }
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
                    peg$savedPos = s0;
                    s0 = peg$f17(s3);
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
              if (input.substr(peg$currPos, 7) === peg$c14) {
                s1 = peg$c14;
                peg$currPos += 7;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e18); }
              }
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f18();
              }
              s0 = s1;
            }
          }
        }
      }
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
                peg$savedPos = s0;
                s0 = peg$f19(s3, s5, s7);
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
                  peg$savedPos = s0;
                  s0 = peg$f20(s3, s5);
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
              peg$savedPos = s0;
              s0 = peg$f21(s3, s5);
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
                  peg$savedPos = s0;
                  s0 = peg$f22(s3);
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
                  peg$savedPos = s0;
                  s0 = peg$f23(s3);
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
                peg$savedPos = s0;
                s1 = peg$f24();
              }
              s0 = s1;
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
      peg$savedPos = s0;
      s0 = peg$f25(s1, s2);
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
          peg$savedPos = s0;
          s0 = peg$f26(s3);
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
      peg$savedPos = s0;
      s0 = peg$f27(s1, s2);
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
          peg$savedPos = s0;
          s0 = peg$f28(s1, s2);
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
        s1 = peg$parseintLiteral();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$f29(s1);
        }
        s0 = s1;
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
          peg$savedPos = s0;
          s0 = peg$f30(s2);
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
      peg$savedPos = s0;
      s0 = peg$f31();
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

},{"./grammerAST":4}],6:[function(require,module,exports){
"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AccMathOpList_ops, _AccMathSeq_head, _AccMathSeq_ops, _AccKeepDrop_howMany, _AccKeepDrop_ast, _AccExplode_compareValue, _AccExplode_limit, _AccExplode_ast, _AccReRoll_compareValue, _AccReRoll_limit, _AccReRoll_ast, _AccRollSetModifiers_mods;
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyse = void 0;
/* Run some very basic statistics against a roll string with a given scope.
*/
let grammer = require("./grammerAST");
let parser = require('./parser');
let evaluate = require("./evaluate");
function roll(str, scope) {
    let parsed = parser.parse(str);
    let evaled = evaluate.eval(parsed, scope);
    return evaled;
}
/* The primary function to analyse a roll string.
*/
function analyse(str, scope, samples) {
    if (typeof (scope) === "number") {
        samples = scope;
        scope = {};
    }
    scope = scope || {};
    samples = samples || 1000;
    var resultSet = [];
    var i;
    for (i = 0; i < samples; i++) {
        resultSet.push(roll(str, scope));
    }
    var mean = resultSet.reduce(function (n, acc) { return n + acc; }, 0) / samples;
    var min = resultSet.reduce(function (n, acc) { return n < acc ? n : acc; }, resultSet[0]);
    var max = resultSet.reduce(function (n, acc) { return n > acc ? n : acc; }, resultSet[0]);
    var parsed = parser.parse(str);
    var minMaxPossible = determine_min_max_possible(parsed, scope);
    return {
        'results': resultSet,
        'mean': mean,
        'min': parseInt(min.toFixed()),
        'max': parseInt(max.toFixed()),
        'min_possible': minMaxPossible.min,
        'max_possible': minMaxPossible.max
    };
}
exports.analyse = analyse;
;
/* What to use when an ast node is undefined.
*/
function ast_defaulter(tree, node, key) {
    let resolveType = evaluate.eval_default(key, node);
    return resolveType.ast;
}
/* After this, most classes mimic the grammerAST classes. The AccRange here
is simple a definition of an interface to make accumulation easier.
*/
class AccRange {
    constructor(a, z) {
        this.min = a;
        this.max = z;
    }
}
class AccStatic extends AccRange {
    constructor(aNumber) {
        super(aNumber, aNumber);
    }
}
class AccMathOp extends AccRange {
    constructor(anOp, operand) {
        super(operand.min, operand.max);
        if (anOp === "-") {
            this.op = "+";
            this.min = operand.max * -1;
            this.max = operand.min * -1;
        }
        else if (anOp === "/") {
            this.op = "*";
            this.min = (1 / operand.max);
            this.max = (1 / operand.min);
        }
        else {
            this.op = anOp;
        }
    }
    eval(r) {
        let outMin = 0;
        let outMax = 0;
        if (this.op === "+") {
            outMin = r.min + this.min;
            outMax = r.max + this.max;
        }
        else if (this.op === "*") {
            outMin = r.min * this.min;
            outMax = r.max * this.max;
        }
        return new AccRange(outMin, outMax);
    }
}
class AccMathOpList extends AccRange {
    constructor(someOps) {
        super(NaN, NaN);
        _AccMathOpList_ops.set(this, void 0);
        __classPrivateFieldSet(this, _AccMathOpList_ops, someOps, "f");
    }
    get ops() {
        return __classPrivateFieldGet(this, _AccMathOpList_ops, "f");
    }
    eval(init) {
        let multReduce = (acc, op) => {
            if (op.op === "*") {
                acc.range = op.eval(acc.range);
                return acc;
            }
            else {
                acc.opList.push(new AccMathOp(op.op, acc.range));
                acc.range = new AccRange(op.min, op.max);
                return acc;
            }
        };
        let initialMultiReduce = { range: init, opList: [] };
        let multReduced = __classPrivateFieldGet(this, _AccMathOpList_ops, "f").reduce(multReduce, initialMultiReduce);
        let addReduce = (acc, op) => {
            return op.eval(acc);
        };
        let addReduced = multReduced.opList.reduce(addReduce, multReduced.range);
        return addReduced;
    }
}
_AccMathOpList_ops = new WeakMap();
class AccMathSeq extends AccRange {
    constructor(head, ops) {
        super(head.min, head.max);
        _AccMathSeq_head.set(this, void 0);
        _AccMathSeq_ops.set(this, void 0);
        let reduced = ops.eval(head);
        this.min = reduced.min;
        this.max = reduced.max;
        __classPrivateFieldSet(this, _AccMathSeq_head, head, "f");
        __classPrivateFieldSet(this, _AccMathSeq_ops, ops, "f");
    }
    get ops() {
        return __classPrivateFieldGet(this, _AccMathSeq_ops, "f");
    }
    get head() {
        return __classPrivateFieldGet(this, _AccMathSeq_head, "f");
    }
}
_AccMathSeq_head = new WeakMap(), _AccMathSeq_ops = new WeakMap();
class AccKeepDrop extends AccRange {
    constructor(ast, howM) {
        super(howM.min, howM.max);
        _AccKeepDrop_howMany.set(this, void 0);
        _AccKeepDrop_ast.set(this, void 0);
        __classPrivateFieldSet(this, _AccKeepDrop_howMany, howM, "f");
        __classPrivateFieldSet(this, _AccKeepDrop_ast, ast, "f");
    }
    evalMin(rollSet) {
        let howMany = __classPrivateFieldGet(this, _AccKeepDrop_howMany, "f").min;
        let evaler = new evaluate.KeepDropModifier(__classPrivateFieldGet(this, _AccKeepDrop_ast, "f").action, __classPrivateFieldGet(this, _AccKeepDrop_ast, "f").direction, howMany, __classPrivateFieldGet(this, _AccKeepDrop_ast, "f"));
        return evaler.modify(rollSet);
    }
    evalMax(rollSet) {
        let howMany = __classPrivateFieldGet(this, _AccKeepDrop_howMany, "f").max;
        let evaler = new evaluate.KeepDropModifier(__classPrivateFieldGet(this, _AccKeepDrop_ast, "f").action, __classPrivateFieldGet(this, _AccKeepDrop_ast, "f").direction, howMany, __classPrivateFieldGet(this, _AccKeepDrop_ast, "f"));
        return evaler.modify(rollSet);
    }
}
_AccKeepDrop_howMany = new WeakMap(), _AccKeepDrop_ast = new WeakMap();
// TODO make this actually be truthful in that it will actually evaluate the
// explosions.
class AccExplode extends AccRange {
    constructor(ast, limit, compareValue) {
        super(limit.min, limit.max);
        _AccExplode_compareValue.set(this, void 0);
        _AccExplode_limit.set(this, void 0);
        _AccExplode_ast.set(this, void 0);
        __classPrivateFieldSet(this, _AccExplode_limit, limit, "f");
        __classPrivateFieldSet(this, _AccExplode_compareValue, compareValue, "f");
        __classPrivateFieldSet(this, _AccExplode_ast, ast, "f");
    }
    evalMin(rollSet, minRange, maxRange) {
        // we're going to skip being truthful and just say we never exploded.
        return rollSet;
    }
    evalMax(rollSet, minRange, maxRange) {
        // we're going to skip being truthful and just say we never exploded.
        return rollSet;
    }
}
_AccExplode_compareValue = new WeakMap(), _AccExplode_limit = new WeakMap(), _AccExplode_ast = new WeakMap();
//TODO make this actually be truthful in that it will actually evaluate the
// re-rolls.
class AccReRoll extends AccRange {
    constructor(ast, limit, compareValue) {
        super(limit.min, limit.max);
        _AccReRoll_compareValue.set(this, void 0);
        _AccReRoll_limit.set(this, void 0);
        _AccReRoll_ast.set(this, void 0);
        __classPrivateFieldSet(this, _AccReRoll_limit, limit, "f");
        __classPrivateFieldSet(this, _AccReRoll_compareValue, compareValue, "f");
        __classPrivateFieldSet(this, _AccReRoll_ast, ast, "f");
    }
    evalMin(rollSet, minRange, maxRange) {
        return rollSet;
    }
    evalMax(rollSet, minRange, maxRnage) {
        return rollSet;
    }
}
_AccReRoll_compareValue = new WeakMap(), _AccReRoll_limit = new WeakMap(), _AccReRoll_ast = new WeakMap();
class AccRollSetModifiers extends AccRange {
    constructor(modifiers) {
        super(NaN, NaN);
        _AccRollSetModifiers_mods.set(this, void 0);
        __classPrivateFieldSet(this, _AccRollSetModifiers_mods, modifiers, "f");
    }
    evalMin(rollSet) {
        let reducer = (acc, mod) => {
            return mod.evalMin(acc);
        };
        return __classPrivateFieldGet(this, _AccRollSetModifiers_mods, "f").reduce(reducer, rollSet);
    }
    evalMax(rollSet) {
        let reducer = (acc, mod) => {
            return mod.evalMax(acc);
        };
        return __classPrivateFieldGet(this, _AccRollSetModifiers_mods, "f").reduce(reducer, rollSet);
    }
}
_AccRollSetModifiers_mods = new WeakMap();
function reducer(node, keymap, scope) {
    if (grammer.Static.is(node)) {
        let x = node.value;
        return new AccStatic(x);
    }
    if (grammer.Lookup.is(node)) {
        let name = node.lookupName;
        let x = evaluate.LookupR.deepSeek(name, scope);
        if (x === undefined) {
            throw ("scope lacked a value for " + name);
        }
        return new AccStatic(x);
    }
    if (grammer.MathOp.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let out = new AccMathOp(casted_node.op, casted_keymap.val);
        return out;
    }
    if (grammer.MathOpList.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let argReducer = (acc, e) => {
            let mappedVal = casted_keymap[e];
            if (mappedVal instanceof AccMathOp) {
                acc.push(mappedVal);
            }
            return acc;
        };
        let arg = casted_node.children().reduce(argReducer, []);
        let out = new AccMathOpList(arg);
        return out;
    }
    if (grammer.MathSeq.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let out = new AccMathSeq(casted_keymap.head, casted_keymap.ops);
        return out;
    }
    if (grammer.KeepDrop.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let out = new AccKeepDrop(casted_node, casted_keymap.howMany);
        return out;
    }
    if (grammer.Explode.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let out = new AccExplode(casted_node, casted_keymap.compareToVal, casted_keymap.limit);
        return out;
    }
    if (grammer.ReRoll.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let out = new AccReRoll(casted_node, casted_keymap.compareToVal, casted_keymap.limit);
        return out;
    }
    if (grammer.RollSetModifiers.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let kidKeys = casted_node.children();
        let gatheredKids = kidKeys.map((k) => casted_keymap[k]);
        let out = new AccRollSetModifiers(gatheredKids);
        return out;
    }
    if (grammer.DiceRoll.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let castedX = casted_keymap.x;
        let castedMin = casted_keymap.min;
        let castedMax = casted_keymap.max;
        let castedMods = casted_keymap.modifiers;
        let minRollSetInit = [];
        for (let i = 0; i < castedX.min; i++) {
            minRollSetInit.push(castedMin.min);
        }
        let minRollSet = castedMods.evalMin(minRollSetInit);
        let maxRollSetInit = [];
        for (let i = 0; i < castedX.max; i++) {
            maxRollSetInit.push(castedMax.max);
        }
        let maxRollSet = castedMods.evalMax(maxRollSetInit);
        let min = minRollSet.reduce((a, e) => a + e, 0);
        let max = maxRollSet.reduce((a, e) => a + e, 0);
        return new AccRange(min, max);
    }
    if (grammer.Parens.is(node)) {
        let casted_keymap = keymap;
        return casted_keymap.expression;
    }
    if (grammer.Rounder.is(node)) {
        let casted_node = node;
        let casted_keymap = keymap;
        let doit = Math.floor;
        if (casted_node.roundType === "c") {
            doit = Math.ceil;
        }
        else if (casted_node.roundType === "r") {
            doit = Math.round;
        }
        return new AccRange(doit(casted_keymap.thingToRound.min), doit(casted_keymap.thingToRound.max));
    }
    console.log('the node', node);
    throw ({ message: "unknown node type", 'node': node });
}
function make_reducer(scope) {
    return (a, b) => {
        return reducer(a, b, scope);
    };
}
function determine_min_max_possible(ast, scope) {
    let red = make_reducer(scope);
    return grammer.walk_ast(ast, { 'min': 0, 'max': 0 }, ast_defaulter, red);
}

},{"./evaluate":3,"./grammerAST":4,"./parser":5}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringify_loop = exports.stringify = void 0;
let ast = require("./grammerAST");
let evaluate = require("./evaluate");
function isAST(val) {
    return val.children !== undefined;
}
function stringify(resOrAst) {
    if (isAST(resOrAst)) {
        return stringify_loop(resOrAst, ast_format_steps);
    }
    else {
        return stringify_loop(resOrAst, res_format_steps);
    }
}
exports.stringify = stringify;
function ast_format_steps(astree) {
    if (astree instanceof ast.Static) {
        let a = astree;
        return [a.value.toString()];
    }
    if (astree instanceof ast.Lookup) {
        let a = astree;
        return ["[", a.lookupName, "]"];
    }
    if (astree instanceof ast.RollSetModifiers) {
        let a = astree;
        return ["oh god modifiers..."];
    }
    if (astree instanceof ast.KeepDrop) {
        let a = astree;
        return ["keep lowest 33"];
    }
    if (astree instanceof ast.ReRoll) {
        let a = astree;
        return ["reroll >10 55x"];
    }
    if (astree instanceof ast.Explode) {
        let a = astree;
        return ["explode =3 1x"];
    }
    if (astree instanceof ast.DiceRoll) {
        let a = astree;
        return [() => ast_num_dice(a), () => ast_dice_mode(a), () => ast_minmax(a), () => ast_dice_modifiers(a)];
    }
    if (astree instanceof ast.Rounder) {
        let a = astree;
        return [a.roundType, () => ast_format_steps(a.thingToRound)];
    }
    if (astree instanceof ast.MathOp) {
        let a = astree;
        return [a.op, () => ast_format_steps(a.val)];
    }
    if (astree instanceof ast.MathOpList) {
        let a = astree;
        let mapper = (o) => {
            return () => ast_format_steps(o);
        };
        return a.ops.map(mapper);
    }
    if (astree instanceof ast.MathSeq) {
        let a = astree;
        [() => ast_format_steps(a.head), () => ast_format_steps(a.ops)];
    }
    if (astree instanceof ast.Parens) {
        let a = astree;
        return ["( ", () => ast_format_steps(a.expression), " )"];
    }
    throw ('cannot format the thing');
}
function ast_num_dice(d) {
    return ["12"];
}
function ast_dice_mode(d) {
    return ["z"];
}
function ast_minmax(d) {
    return ["99..-12"];
}
function ast_dice_modifiers(d) {
    return ["no mods!"];
}
function stringify_loop(thing, formatter) {
    let gathered = [];
    let stepsLeft = formatter(thing);
    while (stepsLeft.length > 0) {
        let head = stepsLeft.shift();
        if (head === undefined) {
            continue;
        }
        if (typeof head === "string") {
            gathered.push(head);
            continue;
        }
        let prepend = head();
        stepsLeft = prepend.concat(stepsLeft);
    }
    return gathered.join('');
}
exports.stringify_loop = stringify_loop;
function res_format_steps(res) {
    if (res instanceof evaluate.StaticR) {
        return [() => ast_format_steps(res.ast)];
    }
    if (res instanceof evaluate.LookupR) {
        return [res.valueOf().toString(), ":", () => ast_format_steps(res.ast)];
    }
    if (res instanceof evaluate.ParensR) {
        let p = res;
        return ["( ", () => res_format_steps(p.expression), " )"];
    }
    if (res instanceof evaluate.RounderR) {
        let r = res;
        return [r.mode, () => res_format_steps(r.thingRounded)];
    }
    if (res instanceof evaluate.DiceRollR) {
        let d = res;
        let out = [() => num_dice(d),
            () => dice_mode(d),
            () => minmax(d),
            () => dice_modifiers(d.modifiers),
            () => dice_result_set(d)
        ];
        return out;
    }
    if (res instanceof evaluate.RollSetModifiersR) {
        let mods = res;
        return dice_modifiers(mods);
    }
    if (res instanceof evaluate.KeepDropModifier) {
        let mod = res;
        return keep_drop_modifier(mod);
    }
    if (res instanceof evaluate.RerollModifier) {
        let mod = res;
        return reroll_modifier(mod);
    }
    if (res instanceof evaluate.ExplodeModifier) {
        let mod = res;
        return explode_modifier(mod);
    }
    if (res instanceof evaluate.MathOpR) {
        let m = res;
        return [m.op, " ", () => res_format_steps(m.operand)];
    }
    if (res instanceof evaluate.MathOpListR) {
        let m = res;
        let mapper = (op) => {
            return () => res_format_steps(op);
        };
        return m.ops.map(mapper);
    }
    if (res instanceof evaluate.MathSeqR) {
        let m = res;
        let headEval = () => res_format_steps(m.head);
        let headSpce = () => {
            if (m.ops.ops.length === 0) {
                return [];
            }
            else {
                return [" "];
            }
        };
        let opsEval = () => res_format_steps(m.ops);
        return [headEval, headSpce, opsEval];
    }
    throw ('unformatabled!');
}
function num_dice(diceroll) {
    if (diceroll.ast.x) {
        return [() => {
                return res_format_steps(diceroll.x);
            }];
    }
    else {
        return [];
    }
}
function dice_mode(diceroll) {
    if (diceroll.modifiers.mods.length === 0) {
        return ["d"];
    }
    return ["q"];
}
function minmax(diceroll) {
    if (diceroll.ast.min === undefined) {
        return [() => res_format_steps(diceroll.max)];
    }
    else {
        let out = [() => res_format_steps(diceroll.min),
            "..",
            () => res_format_steps(diceroll.max)
        ];
        return out;
    }
}
function dice_modifiers(mods) {
    if (mods.ast.mods === undefined) {
        return [];
    }
    else if (mods.mods.length === 0) {
        return [];
    }
    else {
        return ["!!!mods listing not yet complete!!!"];
    }
}
function keep_drop_modifier(mod) {
    return ["keep highest 27"];
}
function reroll_modifier(mod) {
    return ["reroll <12 78x"];
}
function explode_modifier(mod) {
    return ["explode =7 8x"];
}
function dice_result_set(diceroll) {
    let out = [":[",
        () => {
            return [diceroll.rolls.join(', ')];
        },
        "]"
    ];
    return out;
}

},{"./evaluate":3,"./grammerAST":4}]},{},[2])(2)
});
