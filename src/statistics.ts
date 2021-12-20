/* Run some very basic statistics against a roll string with a given scope.
*/
let grammer = require("./grammerAST");
let parser  = require('./parser');
let evaluate = require("./evaluate");

import type { AST } from "./grammerAST";
import type * as grammerTypes from "./grammerAST";

function roll(str : string, scope : object){
	let parsed = parser.parse(str);
	let evaled = evaluate.eval(parsed, scope);
	return evaled;
}

/* The primary function to analyse a roll string.
*/
export function analyse(str : string, scope : Record<string, any> | number, samples : number | undefined){
	if(typeof(scope) === "number"){
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
};

/* What to use when an ast node is undefined.
*/
function ast_defaulter<T>(tree : any, node : T, key : keyof T) {
	let resolveType = evaluate.eval_default(key, node);
	return resolveType.ast;
}

type AstHint = "+" | "-" | "*" | "/" | "static";

/* After this, most classes mimic the grammerAST classes. The AccRange here
is simple a definition of an interface to make accumulation easier.
*/
class AccRange {
	min : number;
	max : number;
	constructor(a : number, z : number){
		this.min = a;
		this.max = z;
	}
}
class AccStatic extends AccRange {
	constructor(aNumber : number){
		super(aNumber, aNumber);
	}
}

class AccMathOp extends AccRange {
	op: "+" | "*";
	constructor(anOp : "+" | "-" | "*" | "/", operand : AccRange){
		super(operand.min, operand.max);
		if(anOp === "-"){
			this.op = "+";
			this.min = operand.max * -1;
			this.max = operand.min * -1;
		} else if(anOp === "/"){
			this.op = "*";
			this.min = (1 / operand.max );
			this.max = ( 1/ operand.min);
		} else {
			this.op = anOp;
		}
	}
	eval(r : AccRange){
		let outMin = 0;
		let outMax = 0;
		if(this.op === "+"){
			outMin = r.min + this.min;
			outMax = r.max + this.max;
		} else if(this.op === "*"){
			outMin = r.min * this.min;
			outMax = r.max * this.max;
		}
		return new AccRange(outMin, outMax);
	}
}

class AccMathOpList extends AccRange {
	#ops: AccMathOp[];
	constructor(someOps : AccMathOp[]){
		super(NaN, NaN);
		this.#ops = someOps;
	}
	get ops(){
		return this.#ops;
	}
	eval(init : AccRange){
		// current phase: multi/divide
		type SeqAcc = { range : AccRange, opList : AccMathOp[] };
		let multReduce = (acc : SeqAcc , op : AccMathOp) => {
			if(op.op === "*"){
				acc.range = op.eval(acc.range);
				return acc;
			} else {
				acc.opList.push(new AccMathOp(op.op, acc.range));
				acc.range = new AccRange(op.min, op.max);
				return acc;
			}
		}
		let initialMultiReduce = {range: init, opList: []};
		let multReduced = this.#ops.reduce(multReduce, initialMultiReduce);
		let addReduce = (acc : AccRange, op : AccMathOp) => {
			return op.eval(acc);
		}
		let addReduced = multReduced.opList.reduce(addReduce, multReduced.range);
		return addReduced;
	}
}

class AccMathSeq extends AccRange {
	#head: AccRange;
	#ops: AccMathOpList;
	constructor(head : AccRange, ops : AccMathOpList){
		super(head.min, head.max);
		let reduced = ops.eval(head);
		this.min = reduced.min;
		this.max = reduced.max;
		this.#head = head;
		this.#ops = ops;
	}
	get ops(){
		return this.#ops;
	}
	get head(){
		return this.#head;
	}
}

class AccKeepDrop extends AccRange {
	#howMany : AccRange;
	#ast : grammerTypes.KeepDrop;
	constructor(ast : grammerTypes.KeepDrop, howM : AccRange){
		super(howM.min, howM.max);
		this.#howMany = howM;
		this.#ast = ast;
	}
	evalMin(rollSet : number[]){
		let howMany = this.#howMany.min;
		let evaler = new evaluate.KeepDropModifier(this.#ast.action, this.#ast.direction, howMany, this.#ast);
		return evaler.modify(rollSet);
	}
	evalMax(rollSet : number[]){
		let howMany = this.#howMany.max;
		let evaler = new evaluate.KeepDropModifier(this.#ast.action, this.#ast.direction, howMany, this.#ast);
		return evaler.modify(rollSet);
	}
}

// TODO make this actually be truthful in that it will actually evaluate the
// explosions.
class AccExplode extends AccRange {
	#compareValue;
	#limit;
	#ast : grammerTypes.Explode;
	constructor(ast : grammerTypes.Explode, limit : AccRange, compareValue : AccRange){
		super(limit.min, limit.max);
		this.#limit = limit;
		this.#compareValue = compareValue;
		this.#ast = ast;
	}
	evalMin(rollSet : number[], minRange : AccRange, maxRange : AccRange){
		// we're going to skip being truthful and just say we never exploded.
		return rollSet;
	}
	evalMax(rollSet : number[], minRange : AccRange, maxRange : AccRange){
		// we're going to skip being truthful and just say we never exploded.
		return rollSet;
	}
}

//TODO make this actually be truthful in that it will actually evaluate the
// re-rolls.
class AccReRoll extends AccRange {
	#compareValue;
	#limit;
	#ast : grammerTypes.ReRoll;
	constructor(ast : grammerTypes.ReRoll, limit : AccRange, compareValue : AccRange){
		super(limit.min, limit.max);
		this.#limit = limit;
		this.#compareValue = compareValue;
		this.#ast = ast;
	}
	evalMin(rollSet : number[], minRange : AccRange, maxRange : AccRange){
		return rollSet;
	}
	evalMax(rollSet : number[], minRange : AccRange, maxRnage : AccRange){
		return rollSet;
	}
}

type AccRollSetModifier = AccKeepDrop;

class AccRollSetModifiers extends AccRange {
	#mods;
	constructor(modifiers : AccRollSetModifier[]){
		super(NaN, NaN);
		this.#mods = modifiers;
	}
	evalMin(rollSet : number[]){
		let reducer = (acc : number[], mod : AccRollSetModifier) => {
			return mod.evalMin(acc);
		}
		return this.#mods.reduce(reducer, rollSet);
	}
	evalMax(rollSet : number[]){
		let reducer = (acc : number[], mod : AccRollSetModifier) => {
			return mod.evalMax(acc);
		}
		return this.#mods.reduce(reducer, rollSet);
	}
}

function reducer<T extends AST>(node : T, keymap : grammerTypes.KeyMap<T, AccRange>, scope : any) : AccRange{
	if(grammer.Static.is(node)){
		let x = (node as unknown as grammerTypes.Static).value;
		return new AccStatic(x);
	}
	if(grammer.Lookup.is(node)){
		let name = (node as unknown as grammerTypes.Lookup).lookupName;
		let x = evaluate.LookupR.deepSeek(name, scope);
		if(x === undefined){
			throw("scope lacked a value for " + name);
		}
		return new AccStatic(x);
	}
	if(grammer.MathOp.is(node)){
		let casted_node = (node as unknown as grammerTypes.MathOp);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.MathOp, AccRange>);
		let out = new AccMathOp(casted_node.op, casted_keymap.val);
		return out;
	}
	if(grammer.MathOpList.is(node)){
		let casted_node = (node as unknown as grammerTypes.MathOpList);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.MathOpList, AccMathOp>);
		let argReducer = (acc : AccMathOp[], e : keyof grammerTypes.MathOpList) => {
			let mappedVal = casted_keymap[e];
			if(mappedVal instanceof AccMathOp){
				acc.push(mappedVal);
			}
			return acc;
		}
		let arg = casted_node.children().reduce(argReducer, []);
		let out = new AccMathOpList(arg);
		return out;

	}
	if(grammer.MathSeq.is(node)){
		let casted_node = (node as unknown as grammerTypes.MathSeq);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.MathSeq, AccRange>);
		let out = new AccMathSeq(casted_keymap.head, (casted_keymap.ops as unknown as AccMathOpList));
		return out;
	}
	if(grammer.KeepDrop.is(node)){
		let casted_node = (node as unknown as grammerTypes.KeepDrop);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.KeepDrop, AccRange>);
		let out = new AccKeepDrop(casted_node, casted_keymap.howMany);
		return out;
	}
	if(grammer.Explode.is(node)){
		let casted_node = (node as unknown as grammerTypes.Explode);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.Explode, AccRange>);
		let out = new AccExplode(casted_node, casted_keymap.compareToVal, casted_keymap.limit);
		return out;
	}
	if(grammer.ReRoll.is(node)){
		let casted_node = (node as unknown as grammerTypes.ReRoll);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.ReRoll, AccRange>);
		let out = new AccReRoll(casted_node, casted_keymap.compareToVal, casted_keymap.limit);
		return out;
	}
	if(grammer.RollSetModifiers.is(node)){
		let casted_node = (node as unknown as grammerTypes.RollSetModifiers);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.RollSetModifiers, AccRollSetModifier>);
		let kidKeys = casted_node.children();
		let gatheredKids = kidKeys.map((k) => casted_keymap[k]);
		let out = new AccRollSetModifiers(gatheredKids);
		return out;
	}
	if(grammer.DiceRoll.is(node)){
		let casted_node = (node as unknown as grammerTypes.DiceRoll);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.DiceRoll, AccRange | AccRollSetModifiers>);
		let castedX = (casted_keymap.x as AccRange);
		let castedMin = (casted_keymap.min as AccRange);
		let castedMax = (casted_keymap.max as AccRange);
		let castedMods = (casted_keymap.modifiers as AccRollSetModifiers);
		let minRollSetInit = [];
		for(let i = 0; i < castedX.min; i++){
			minRollSetInit.push(castedMin.min);
		}
		let minRollSet = castedMods.evalMin(minRollSetInit);
		let maxRollSetInit = [];
		for(let i = 0; i < castedX.max; i++){
			maxRollSetInit.push(castedMax.max);
		}
		let maxRollSet = castedMods.evalMax(maxRollSetInit);
		let min = minRollSet.reduce((a, e) => a + e, 0);
		let max = maxRollSet.reduce((a, e) => a + e, 0);
		return new AccRange(min, max);
	}
	if(grammer.Parens.is(node)){
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.Parens, AccRange>);
		return casted_keymap.expression;
	}
	if(grammer.Rounder.is(node)){
		let casted_node = (node as unknown as grammerTypes.Rounder);
		let casted_keymap = (keymap as unknown as grammerTypes.KeyMap<grammerTypes.Rounder, AccRange>);
		let doit = Math.floor;
		if(casted_node.roundType === "c"){
			doit = Math.ceil;
		} else if(casted_node.roundType === "r"){
			doit = Math.round;
		}
		return new AccRange(doit(casted_keymap.thingToRound.min), doit(casted_keymap.thingToRound.max));
	}
	console.log('the node', node);
	throw({message: "unknown node type", 'node': node});
}

function make_reducer<T extends AST>(scope : object){
	return (a : T, b : grammerTypes.KeyMap<T, AccRange>) => {
		return reducer(a, b, scope);
	}
}

function determine_min_max_possible<T extends AST>(ast : T, scope : object){
	let red = make_reducer(scope);
	return grammer.walk_ast(ast, {'min': 0, 'max': 0}, ast_defaulter, red);
}
