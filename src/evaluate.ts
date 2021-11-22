
let grammer = require("./grammerAST");

import type { AST } from "./grammerAST";
import type * as grammerTypes from "./grammerAST";

type ANumber = number | Number;

export class Resolver extends Number {
	ast : AST;
	constructor(n : ANumber | undefined, ast : AST){
		super(n);
		this.ast = ast;
	}
	get rolls() : Number[] {
		return [];
	}
}

export class StaticR extends Resolver {
	constructor(n : ANumber){
		super(n, new grammer.Static(n));
	}
}

//type ObjectActual = Record<string, number | string | ObjectActual >;

export class LookupR extends Resolver {
	#lookupName;
	constructor(name : string, scope : Object){
		super(LookupR.deepSeek(name, scope), new grammer.Lookup(name));
		this.#lookupName = name;
	}
	static deepSeek(path : string, object : Record<string,any>) : undefined | ANumber {
		if(object.hasOwnProperty(path)){
			return object[path];
		}
		let split = path.split('.');
		if(split[0] === path){
			return;
		}
		let reduceRes = split.reduce((acc, elem) =>{
			if(acc === undefined){
				return;
			}
			let nextAcc = acc[elem];
			if(typeof nextAcc !== "object"){
				return;
			}
			return nextAcc;
		}, object);
		if(reduceRes !== undefined){
			if(typeof reduceRes === "number"){
				return reduceRes;
			}
		}
		return undefined;
	};
}

type MiniDice = { min : Resolver, max : Resolver, x : Resolver};

// Ugh, just to work around a stupid ts limitation.
// "nothing before super" they say, but I need to calculate stuff!
let resultSetInstance : Number[] = [];

export class DiceRollR extends Resolver{
	#min;
	#max;
	#x;
	#modifiers;
	#rolls;
	get min(){
		return this.#min;
	}
	get max(){
		return this.#max;
	}
	get rolls(){
		let minRolls = this.min.rolls;
		let maxRolls = this.max.rolls;
		let xRolls = this.x.rolls;
		let modRolls = this.modifiers.rolls;
		let myRolls = this.#rolls;
		let deep = new Array(xRolls, minRolls, maxRolls, modRolls, myRolls);
		return deep.flatMap((e) => e);
	}
	get modifiers(){
		return this.#modifiers;
	}
	get x(){
		return this.#x;
	}
	constructor(x: Resolver, min : Resolver, max : Resolver, modifiers : RollSetModifiersR, ast : grammerTypes.DiceRoll){
		super(DiceRollR.initVal(x, min, max, modifiers), ast);
		this.#x = x;
		this.#min = min;
		this.#max = max;
		this.#modifiers = modifiers;
		this.#rolls = resultSetInstance;
	}
	static rand(min : Number, max : Number){
		let rawRandom = Math.random();
		let diff = max.valueOf() - min.valueOf();
		rawRandom = diff * rawRandom;
		return Math.round(rawRandom + min.valueOf());
		//let rndNumber = Math.round(rawRandom + min.valueOf());
		/*rndNumber = new Number(rndNumber);
		rndNumber.min = min;
		rndNumber.max = max;
		return rndNumber;*/
	};
	static resultSet(x : Resolver, min : Resolver, max : Resolver){
		let out = [];
		for(let i = 0; i < x.valueOf(); i++){
			out.push(new Number(DiceRollR.rand(min, max)));
		}
		return out;
	}
	static applyModifiers(resultSet : Number[], modifiers : RollSetModifiersR, baseRoll : MiniDice){
		return modifiers.modify(resultSet, baseRoll);
	}
	static sum(resultSet : Number[]){
		return resultSet.reduce((a : number, e) => a + e.valueOf(), 0);
	}
	static initVal(x: Resolver, min : Resolver, max : Resolver, modifiers : RollSetModifiersR){
		let resultSet = DiceRollR.resultSet(x ?? new StaticR(1), min ?? new StaticR(1), max);
		resultSet = DiceRollR.applyModifiers(resultSet, modifiers, {x, min, max});
		resultSetInstance = resultSet;
		let sum = DiceRollR.sum(resultSet);
		return sum;
	}
}

export class RollSetModifiersR extends Resolver {
	#mods : RollSetModifierR[] = [];
	constructor(mods : RollSetModifierR[] , ast : AST){
		super(NaN, ast);
		this.#mods = mods;
	}
	get rolls(){
		let deep = this.#mods.map((m) => m.rolls);
		return deep.flatMap((e) => e);
	}
	get mods(){
		return this.#mods;
	}
	modify(resultSet : Number[], baseDice : {min : Resolver, max: Resolver}) : Number[]{
		let reducer = (a : Number[], m : RollSetModifierR) : Number[] => {
			return m.modify(a, baseDice);
		}
		return this.#mods.reduce(reducer, resultSet);
	}
}

type RollSetModifierR = KeepDropModifier | RerollModifier | ExplodeModifier;

export class KeepDropModifier extends Resolver {
	#action;
	#direction;
	#howMany;
	constructor(action : "keep" | "drop" | undefined, direction : "highest" | "lowest" | undefined, howMany : Resolver | undefined, ast : AST){
		super(NaN, ast);
		this.#action = action ?? "keep";
		this.#direction = direction ?? "highest";
		this.#howMany = howMany ?? new StaticR(1);
	}
	get rolls(){
		return this.#howMany.rolls;
	}
	modify(resultSet : Number[]) : Number[]{
		let sorted = resultSet.sort();
		if(this.#action === "keep" && this.#direction === "highest"){
			return sorted.slice(this.#howMany.valueOf() * -1);
		}
		if(this.#action === "drop" && this.#direction === "highest"){
			return sorted.reverse().slice(this.#howMany.valueOf());
		}
		if(this.#action === "keep" && this.#direction === "lowest"){
			return sorted.reverse().slice(this.#howMany.valueOf());
		}
		if(this.#action === "drop" && this.#direction === "lowest"){
			return sorted.slice(this.#howMany.valueOf());
		}
		throw('impossible, but no action or direction matches');
	}
}

let compareFuncs = {
	'=': (base : Number, result : Number) => base === result,
	'!=': (base : Number, result : Number) => base !== result,
	'<': (base : Number, result : Number) => result < base,
	'<=': (base : Number, result : Number) => result <= base,
	'>': (base : Number, result : Number) => result > base,
	'>=': (base : Number, result : Number) => result >= base,
}

function compareFunc(mode : comparisonStr, arg1 : Number){
	let base = compareFuncs[mode];
	return (arg2 : Number) => base(arg1, arg2);
}

type comparisonStr = "=" | "!=" | "<" | "<=" | ">" | ">=";

export class RerollModifier extends Resolver {
	#comparisonMode;
	#comparisonValue;
	#limit;
	constructor(comparisonMode : comparisonStr | undefined, comparisonValue : Resolver | undefined, limit : Resolver | undefined, ast : AST){
		super(NaN, ast);
		this.#comparisonMode = comparisonMode ?? "=";
		this.#comparisonValue = comparisonValue;
		this.#limit = limit ?? new StaticR(1);
	}
	get rolls(){
		let concatVal : Number[] = [];
		if(this.#comparisonValue !== undefined){
			concatVal = this.#comparisonValue.rolls;
		}
		return this.#limit.rolls.concat(concatVal);
	}
	modify(resultSet : Number[], baseRoll : {min: Resolver, max : Resolver}){
		this.#comparisonValue = this.#comparisonValue ?? baseRoll.min;
		let compare = compareFunc(this.#comparisonMode, this.#comparisonValue);
		for(let i = this.#limit.valueOf(); i > 0; i--){
			let totalRolls = resultSet.length;
			let keptRolls = resultSet.filter((e) => ! compare(e));
			let needRollsNumber = totalRolls - keptRolls.length;
			if(needRollsNumber === 0){
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

export class ExplodeModifier extends Resolver {
	#comparisonMode;
	#comparisonValue;
	#limit;
	constructor(comparisonMode : comparisonStr | undefined, comparisonValue : Resolver | undefined, limit : Resolver | undefined, ast : AST){
		super(NaN, ast);
		this.#comparisonMode = comparisonMode ?? "=";
		this.#comparisonValue = comparisonValue;
		this.#limit = limit ?? new StaticR(10000)
	}
	get rolls(){
		let concatVal : Number[] = [];
		if(this.#comparisonValue !== undefined){
			concatVal = this.#comparisonValue.rolls;
		}
		return this.#limit.rolls.concat(concatVal);
	}
	modify(rolls : Number[], baseRoll : {min: Resolver, max: Resolver}){
		let count = 0;
		let compareValue = this.#comparisonValue ?? baseRoll.max;
		let compare = compareFunc(this.#comparisonMode, compareValue);
		let exploding = rolls.filter((e) => compare(e));
		let done = exploding.length === 0;
		while(!done){
			let explodingCount = exploding.length;
			let dice = new DiceRollR(new StaticR(explodingCount), new StaticR(baseRoll.min.valueOf()), new StaticR(baseRoll.max.valueOf()), new RollSetModifiersR([], new grammer.RollSetModifiers([])), new grammer.DiceRoll(1, 1, 1, []));
			let exploded = dice.rolls;
			rolls = rolls.concat(exploded);
			exploding = exploded.filter((e) => compare(e));
			if(this.#limit !== null){
				count++;
				if(this.#limit.valueOf() === count){
					done = true;
				}
			}
			done = ( done || (exploding.length === 0));
		}
		return rolls;
	}
}

export class RounderR extends Resolver {
	#mode;
	#thingRounded;
	constructor(mode : "c" | "f" | "r", thingToRound : Resolver, ast : AST){
		super((RounderR.modeToFunc(mode))(thingToRound.valueOf()), ast);
		this.#mode = mode;
		this.#thingRounded = thingToRound;
	}
	get mode(){
		return this.#mode;
	}
	get thingRounded(){
		return this.#thingRounded;
	}
	get rolls(){
		return this.#thingRounded.rolls;
	}
	static modeToFunc(mode : string){
		if(mode === "f"){
			return Math.floor;
		}
		if(mode === "c"){
			return Math.ceil;
		}
		if(mode === "r"){
			return Math.round;
		}
		throw("invalid round mode");
	}
}

type mathOp = "+" | "-" | "*" | "/";

export class MathOpR extends Resolver {
	#op;
	#opFunc;
	#operand;
	constructor(op : mathOp, operand : Resolver, ast : AST){
		super(NaN, ast);
		this.#op = op;
		this.#operand = operand;
		if(op === "+"){
			this.#opFunc = (a : number) => a + this.#operand.valueOf();
		} else if(op === "-"){
			this.#opFunc = (a : number) => a - this.#operand.valueOf();
		} else if(op === "*"){
			this.#opFunc = (a : number) => a * this.#operand.valueOf();
		} else if(op === "/"){
			this.#opFunc = (a : number) => a / this.#operand.valueOf();
		} else {
			throw "invalid math operation";
		}
	}
	get op(){
		return this.#op;
	}
	get operand(){
		return this.#operand;
	}
	get commute(){
		if(this.op === "-"){
			return new MathOpR("+", new StaticR(this.#operand.valueOf() * -1), this.ast);
		} else if(this.op === "/"){
			return new MathOpR("*", new StaticR(1 / this.#operand.valueOf()), this.ast);
		} else {
			return new MathOpR(this.op, this.#operand, this.ast);
		}
	}
	get rolls(){
		return this.#operand.rolls;
	}
	eval(acc : Number){
		return this.#opFunc(acc.valueOf());
	}
}

export class MathOpListR extends Resolver {
	#ops : MathOpR[] = [];
	constructor(ops : MathOpR[], ast : AST){
		super(NaN, ast);
		this.#ops = ops;
	}
	get ops(){
		return this.#ops;
	}
	get rolls(){
		let deep = this.#ops.map((o) => o.rolls);
		return deep.flatMap((e) => e);
	}
	eval(initial : Resolver){
		let commutables = this.#ops.map((o) => o.commute);
		// current phase: multiply/divide.
		type SeqAcc = { number : number, opList : MathOpR[] };
		let multReduce = (acc : SeqAcc , op : MathOpR) => {
			if(op.op === "*"){
				acc.number = op.eval(acc.number);
				return acc;
			} else {
				acc.opList.push(new MathOpR(op.op, new StaticR(acc.number), this.ast));
				acc.number = op.operand.valueOf();
				return acc;
			}
		}
		let initialMultiReduce = {number: initial.valueOf(), opList: []};
		let multReduced = commutables.reduce(multReduce, initialMultiReduce);
		let addReduce = (acc : number | Number | Resolver, op : MathOpR) => {
			return op.eval(acc);
		}
		let addReduced = multReduced.opList.reduce(addReduce, multReduced.number);
		return addReduced;
	}
}

export class MathSeqR extends Resolver {
	#ops;
	#head;
	constructor(head : Resolver, ops : MathOpListR, ast : AST){
		super(ops.eval(head).valueOf(), ast);
		this.#head = head;
		this.#ops = ops;
	}
	get head(){
		return this.#head;
	}
	get ops(){
		return this.#ops;
	}
	get rolls(){
		return this.#head.rolls.concat(this.#ops.rolls);
	}
}

export class ParensR extends Resolver {
	#expression;
	constructor(n : Resolver, ast : AST){
		super(n.valueOf(), ast);
		this.#expression = n;
	}
	get expression(){
		return this.#expression;
	}
	get rolls(){
		return this.#expression.rolls;
	}
}

class ResolveEngine<T extends AST> {
	#resolving : T;
	#allKeys : Array<keyof T> = [];
	#keyItor;
	#currentKey : keyof T | undefined;
	#keyMap : Partial<Record<keyof T, Resolver>> = {};
	//#done = false;
	#scope = {};
	#resolved : Resolver;
	constructor(thing : T, scope : object){
		this.#resolving = thing;
		this.#scope = scope;
		this.#allKeys = thing.children();
		this.#keyItor = this.#allKeys.values();
		//this.#keysLeft = new Set(this.resolving.children).keys();
		//this.#next();
		this.#resolved = new StaticR(NaN);
	}
	/*get done(){
		return this.#done;
	}*/
	get currentKey(){
		return this.#currentKey;
	}
	get currentValue(){
		if(this.#currentKey === undefined){
			return undefined;
		}
		return this.#resolving[this.#currentKey];
	}
	get resolving(){
		return this.#resolving;
	}
	/*get keysLeft(){
		return this.#keysLeft;
	}*/
	get keyMap(){
		return this.#keyMap;
	}
	get resolved(){
		return this.#resolved;
	}
	get allKeys(){
		return this.#allKeys
	}
	resetItor(){
		this.#keyItor = this.#allKeys.values();
		this.#currentKey = undefined;
	}
	next(){
		let rawNext = this.#keyItor.next();
		this.#currentKey = rawNext.value;
		let outValue = {
			key: this.currentKey,
			value: this.currentValue,
			done: rawNext.done
		}
		return outValue;
	}
	setKey(key : keyof T, value : Resolver){
		this.#keyMap[key] = value;
	}
	setCurrent(value : Resolver){
		if(this.currentKey === undefined){
			throw("No current key. You either never called next, called next too often, or called next but didn't check the 'done' property.");
		} else {
			this.#keyMap[this.currentKey] = value;
		}
	}
	resolve(){
		this.#resolved = eval_factory(this.#resolving, this.#keyMap, this.#scope);
		return this.#resolved;
	}
	/*next(value){
		if(this.done){
			return;
		}
		if(this.#currentKey === undefined){
			return;
		}
		this.#keyMap[this.#currentKey] = value;
		this.#next();
	}
	#next(){
		let out = this.#keysLeft.next();
		this.#done = out.done ?? false;
		this.#currentKey = out.value;
		if(this.#done){
			this.#resolved = eval_factory(this.#resolving, this.#keyMap, this.#scope);
		} else {
			this.#currentKey = out.value;
		}
	}*/
}

/*function eval_factory(ast : grammerTypes.Static, keyMap : Partial<Record<keyof grammerTypes.Static, Resolver>>, scope : object) : StaticR;
function eval_factory(ast : grammerTypes.Lookup, keyMap : Partial<Record<keyof grammerTypes.Lookup, Resolver>>, scope : object) : LookupR;
function eval_factory(ast : grammerTypes.RollSetModifiers, keyMap : Partial<Record<keyof grammerTypes.RollSetModifiers, Resolver>>, scope : object) : RollSetModifiersR;
function eval_factory(ast : grammerTypes.KeepDrop, keyMap : Partial<Record<keyof grammerTypes.KeepDrop, Resolver>>, scope : object) : KeepDropModifier;
function eval_factory(ast : grammerTypes.ReRoll, keyMap : Partial<Record<keyof grammerTypes.ReRoll, Resolver>>, scope : object) : RerollModifier;
function eval_factory(ast : grammerTypes.Explode, keyMap : Partial<Record<keyof grammerTypes.Explode, Resolver>>, scope : object) : ExplodeModifier;
function eval_factory(ast : grammerTypes.MathOp, keyMap : Partial<Record<keyof grammerTypes.MathOp, Resolver>>, scope : object) : MathOpR;
function eval_factory(ast : grammerTypes.MathOpList, keyMap : Partial<Record<keyof grammerTypes.MathOpList, Resolver>>, scope : object) : MathOpListR;
function eval_factory(ast : grammerTypes.MathSeq, keyMap : Partial<Record<keyof grammerTypes.MathSeq, Resolver>>, scope : object) : MathSeqR;
function eval_factory(ast : grammerTypes.Rounder, keyMap : Partial<Record<keyof grammerTypes.Rounder, Resolver>>, scope : object) : RounderR;
function eval_factory(ast : grammerTypes.Parens, keyMap : Partial<Record<keyof grammerTypes.Parens, Resolver>>, scope : object) : ParensR;
function eval_factory(ast : grammerTypes.DiceRoll, keyMap : Partial<Record<keyof grammerTypes.DiceRoll, Resolver>>, scope : object) : DiceRollR;*/
function eval_factory<T extends AST>(ast : T, keyMap : Partial<Record<keyof T, Resolver>>, scope : object) : Resolver{
	if(ast instanceof grammer.Static){
		return eval_static((ast as unknown as grammerTypes.Static).value);
	}
	if(ast instanceof grammer.Lookup){
		return eval_lookup((ast as unknown as grammerTypes.Lookup).lookupName, scope);
	}
	if(ast instanceof grammer.RollSetModifiers){
		return eval_rollsetmodifiers((ast as unknown as grammerTypes.RollSetModifiers), keyMap);
	}
	if(ast instanceof grammer.KeepDrop){
		return eval_keepdrop((ast as unknown as grammerTypes.KeepDrop), keyMap);
	}
	if(ast instanceof grammer.ReRoll){
		return eval_reroll((ast as unknown as grammerTypes.ReRoll), keyMap);
	}
	if(ast instanceof grammer.Explode){
		return eval_explode((ast as unknown as grammerTypes.Explode), keyMap);
	}
	if(ast instanceof grammer.MathOp){
		return eval_mathop((ast as unknown as grammerTypes.MathOp), keyMap);
	}
	if(ast instanceof grammer.MathOpList){
		return eval_mathoplist((ast as unknown as grammerTypes.MathOpList), keyMap);
	}
	if(ast instanceof grammer.MathSeq){
		return eval_mathseq((ast as unknown as grammerTypes.MathSeq), keyMap);
	}
	if(ast instanceof grammer.Rounder){
		return eval_rounder((ast as unknown as grammerTypes.Rounder), keyMap);
	}
	if(ast instanceof grammer.Parens){
		return eval_parens((ast as unknown as grammerTypes.Parens), keyMap);
	}
	if(ast instanceof grammer.DiceRoll){
		return eval_diceroll((ast as unknown as grammerTypes.DiceRoll), keyMap);
	}
	throw('invalid ast');
}

function eval_static(n : number){
	return new StaticR(n);
}

function eval_lookup(name : string, scope : Object){
	return new LookupR(name, scope);
}

function eval_rollsetmodifiers(ast : grammerTypes.RollSetModifiers, keyMap : Partial<Record<keyof grammerTypes.RollSetModifiers, Resolver>>){
		let kidKeys = ast.children();
		let reducer = (a : Array<RollSetModifierR>, k : keyof grammerTypes.RollSetModifiers) => {
			if(keyMap[k] === undefined){
				return a;
			} else {
				a.push((keyMap[k] as RollSetModifierR));
				return a;
			}
		}
		let mods = kidKeys.reduce(reducer, []);
		return new RollSetModifiersR(mods, ast);
}

function eval_keepdrop(ast : grammerTypes.KeepDrop, keyMap : Partial<Record<keyof grammerTypes.KeepDrop, Resolver>>){
	let action = ast.action
	let direction = ast.direction
	let howMany = keyMap.howMany;
	return new grammer.KeepDropModifier(action, direction, howMany, ast);
}

function eval_reroll(ast : grammerTypes.ReRoll, keyMap : Partial<Record<keyof grammerTypes.ReRoll, Resolver>>){
	let comparison = ast.comparisonStr;
	return new RerollModifier(comparison, keyMap.compareToVal, keyMap.limit, ast);
}

function eval_explode(ast : grammerTypes.Explode, keyMap : Partial<Record<keyof grammerTypes.Explode, Resolver>>){
	return new ExplodeModifier(ast.comparisonStr, keyMap.compareToVal, keyMap.limit, ast);
}

function eval_mathop(ast : grammerTypes.MathOp, keyMap : Partial<Record<keyof grammerTypes.MathOp, Resolver>>){
	if(keyMap.val === undefined){
		throw('a mathop needs something to op on');
	}
	return new MathOpR(ast.op, keyMap.val, ast);
}

function eval_mathoplist(ast : grammerTypes.MathOpList, keyMap : Partial<Record<keyof grammerTypes.MathOpList, Resolver>>){
	let kidKeys = ast.children();
	let reducer = (a : Array<MathOpR>, index : keyof grammerTypes.MathOpList) => {
		if(keyMap[index] === undefined){
			return a;
		} else {
			a.push((keyMap[index] as MathOpR));
			return a;
		}
	}
	let ops = kidKeys.reduce(reducer, []);
	return new MathOpListR(ops, ast);
}

function eval_mathseq(ast : grammerTypes.MathSeq, keyMap : Partial<Record<keyof grammerTypes.MathSeq, Resolver>>){
	if(keyMap.head === undefined){
		throw("need a start up for mathseq");
	}
	let ops = (keyMap.ops as MathOpListR) ?? (new MathOpListR([], ast.ops));
	return new MathSeqR(keyMap.head, ops, ast);
}

function eval_rounder(ast : grammerTypes.Rounder, keyMap : Partial<Record<keyof grammerTypes.Rounder, Resolver>>){
	if(keyMap.thingToRound === undefined){
		throw('cannot round/ceiling/floor undefined');
	}
	return new RounderR(ast.roundType, keyMap.thingToRound, ast);
}

function eval_parens(ast : grammerTypes.Parens, keyMap : Partial<Record<keyof grammerTypes.Parens, Resolver>>){
	if(keyMap.expression === undefined){
		throw('parens somehow ended up with undefined expression');
	}
	return new ParensR(keyMap.expression, ast);
}

function eval_diceroll(ast : grammerTypes.DiceRoll, keyMap : Partial<Record<keyof grammerTypes.DiceRoll, Resolver>>){
	if(keyMap.max === undefined){
		throw('dice rolls _must_ have at least a max defined');
	}
	let mods : RollSetModifiersR = (keyMap.modifiers as RollSetModifiersR) ?? new RollSetModifiersR([], new grammer.RollSetModifers([]));
	return new DiceRollR(keyMap.x ?? new StaticR(1), keyMap.min ?? new StaticR(1), keyMap.max, mods, ast);
}

function eval_default<T extends AST>(key : keyof T | undefined, thing : T){
	if(thing instanceof grammer.KeepDrop && key === "howMany"){
		return new StaticR(1);
	}
	if(thing instanceof grammer.ReRoll && key === "limit"){
		return new StaticR(1);
	}
	if(thing instanceof grammer.ReRoll && key === "compareToVal"){
		// TODO may this never be called.
		return new StaticR(1);
	}
	if(thing instanceof grammer.Explode && key === "limit"){
		return new StaticR(10000);
	}
	if(thing instanceof grammer.Explode && key === "compareToVal"){
		// TODO may this never be called.
		return new StaticR(1);
	}
	if(thing instanceof grammer.DiceRoll && key === "x"){
		return new StaticR(1);
	}
	if(thing instanceof grammer.DiceRoll && key === "min"){
		return new StaticR(1);
	}
	if(thing instanceof grammer.DiceRoll && key === "modifiers"){
		return new RollSetModifiersR([], new grammer.RollSetModifiers([]));
	}
	throw("If you got here, somehow parsing allowed things that should not be null to be null");
}

function resolve_parsed(ast : AST, scope : object){
	let stepStack = [];
	let currentStep = new ResolveEngine(ast, scope);
	let evaled;
	let done = false;
	let finalVal;
	while(! done){
		let currentKeyVal = currentStep.next();
		if(currentKeyVal.done){
			let resolvedVal = currentStep.resolve();
			let popped = stepStack.pop();
			if(popped === undefined){
				console.log('all done');
				done = true;
				finalVal = resolvedVal;
			} else {
				popped.setCurrent(resolvedVal);
				currentStep = popped;
			}
		} else if(currentKeyVal.value === undefined){
			let resolvedVal = eval_default(currentKeyVal.key, currentStep.resolving);
			currentStep.setCurrent(resolvedVal);
		} else {
			stepStack.push(currentStep);
			currentStep = new ResolveEngine((currentKeyVal.value as unknown as AST), scope);
		}
	}
	return finalVal;
}

exports.eval = function(parsed : AST, scope : object){
	scope = scope ?? {};
	return resolve_parsed(parsed, scope);
}
