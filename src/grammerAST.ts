// a common place for both evaludate.js and dice.peg to agree on a
// representation of the concepts used in dice.js.
// as well as some implementation details.
// 90% of this work is an attempt to avoid exploding the call stack like the
// old implementation could.

type PropEntry<T> = T[keyof T] extends AST ? keyof T : never;

export interface AST {
	children(): Array<PropEntry<this>>
}

type OrUndef<T> = undefined | T;


export class Static implements AST{
	#value : number;
	constructor(val : number){
		this.#value = val;
	}
	get value(){
		return this.#value;
	}
	children(){
		return [];
	}
	static is(a: AST) : a is Static {
		return (a instanceof Static);
	}
}

export class Lookup implements AST {
	#lookupName : string;
	get lookupName(){
		return this.#lookupName;
	}
	constructor(name : string){
		this.#lookupName = name;
	}
	children(){
		return [];
	}
	static is(a : any) : a is Lookup {
		return (a instanceof Lookup);
	}
}

export class RollSetModifiers implements AST {
	#mods : RollSetModifier[] = [];
	#kidKeys : number[] = [];
	[kid: number]: RollSetModifier;
	constructor(mods : RollSetModifier[]){
		let kidKeys = [];
		for(let i = 0; i < mods.length; i++){
			kidKeys.push(i);
		}
		this.#kidKeys = kidKeys;
		this.#mods = mods;
		let self = this;
		let kidPropsInit : PropertyDescriptorMap = {};
		let kidProps = kidKeys.reduce((acc : PropertyDescriptorMap, index : number) => {
			let property =
				{ get: function(){ return self.mods[index]; }
				, set: function(v : RollSetModifier){ self.mods[index] = v; }
				};
			acc[index] = property;
			return acc;
		}, kidPropsInit);
		Object.defineProperties(this, kidProps);
		let modIndexKvRefs = this.#kidKeys.map((i) => { return {key: i, val: this.#mods[i]} });
	}
	get mods(){
		return this.#mods;
	}
	children(){
		let mapper = (i : number) => {
			return (i as PropEntry<this>);
		}
		let out = this.#kidKeys.map(mapper);
		return out;
	}
	static is(a : any) : a is RollSetModifiers {
		return (a instanceof RollSetModifiers);
	}
}

type RollSetModifier = KeepDrop | ReRoll | Explode;

type KeepDropAction = "keep" | "drop";
type KeepDropDirection = "highest" | "lowest";
export class KeepDrop implements AST {
	#action :  OrUndef<KeepDropAction> = "keep";
	#direction : OrUndef<KeepDropDirection> = "highest";
	#howMany : OrUndef<MathSeq | Parens>;
	constructor(action : OrUndef<KeepDropAction>, direction : OrUndef<KeepDropDirection>, howMany : OrUndef<MathSeq | Parens> ){
		this.#action = action;
		this.#direction = direction;
		this.#howMany = howMany
	}
	get action(){
		return this.#action;
	}
	get direction(){
		return this.#direction;
	}
	get howMany(){
		return this.#howMany;
	}
	children(){
		return [('howMany' as PropEntry<this>)];
	}
	static is( a : any) : a is KeepDrop {
		return (a instanceof KeepDrop);
	}
}

type ComparisonStr
	= "="
	| "!="
	| ">"
	| ">="
	| "<"
	| "<=";

export class ReRoll implements AST {
	#comparisonStr : OrUndef<ComparisonStr>;
	#compareToVal : OrUndef<MathSeq | Parens>;
	#limit : OrUndef<MathSeq | Parens>;
	constructor(comparisonStr : OrUndef<ComparisonStr>, compareToVal : OrUndef<MathSeq | Parens>, limit : OrUndef<MathSeq | Parens>){
		this.#compareToVal = compareToVal;
		this.#comparisonStr;
		this.#limit = limit;
	}
	get comparisonStr(){
		return this.#comparisonStr;
	}
	get compareToVal(){
		return this.#compareToVal;
	}
	get limit(){
		return this.#limit;
	}
	children(){
		return [('limit' as PropEntry<this>), ('compareToVal' as PropEntry<this>)];
	}
	static is(a : any) : a is ReRoll {
		return ( a instanceof ReRoll);
	}
}

export class Explode implements AST {
	#comparisonStr : OrUndef<ComparisonStr>
	#compareToVal : OrUndef<MathSeq | Parens>;
	#limit : OrUndef<MathSeq | Parens>;
	constructor(comparisonStr : OrUndef<ComparisonStr>, compareToVal : OrUndef<MathSeq | Parens>, limit : OrUndef<MathSeq | Parens>){
		this.#comparisonStr = comparisonStr;
		this.#limit = limit;
		this.#compareToVal = compareToVal;
	}
	get comparisonStr(){
		return this.#comparisonStr;
	}
	get compareToVal(){
		return this.#compareToVal;
	}
	get limit(){
		return this.#limit;
	}
	children(){
		return [('limit' as PropEntry<this>), ('compareToVal' as PropEntry<this>)];
	}
	static is(a:any):a is Explode{
		return (a instanceof Explode);
	}
}

type AsInteger
	= Static
	| Lookup
	| Rounder;

export class DiceRoll implements AST {
	#x : OrUndef<AsInteger>
	#min : OrUndef<AsInteger>
	#max : OrUndef<AsInteger>
	#modifiers : OrUndef<RollSetModifiers>
	constructor(x : OrUndef<AsInteger>, min : OrUndef<AsInteger>, max: OrUndef<AsInteger>, modifiers : OrUndef<RollSetModifiers>){
		this.#x = x;
		this.#min = min;
		this.#max = max;
		this.#modifiers = modifiers;
	}
	get x(){
		return this.#x;
	}
	get min(){
		return this.#min;
	}
	get max(){
		return this.#max;
	}
	get modifiers(){
		return this.#modifiers;
	}
	children(){
		let keys =
			[ ('x' as PropEntry<this>)
			, ('min' as PropEntry<this>)
			, ('max' as PropEntry<this>)
			, ('modifiers' as PropEntry<this>)
			];
		return keys;
	}
	static is(a:any):a is DiceRoll{
		return (a instanceof DiceRoll);
	}
}

type RoundType = "c" | "f" | "r";

export class Rounder implements AST {
	#roundType : RoundType = "r";
	#thingToRound;
	constructor(type : RoundType, thingToRound : Parens | Lookup){
		this.#roundType = type;
		this.#thingToRound = thingToRound;
	}
	get roundType(){
		return this.#roundType;
	}
	get thingToRound(){
		return this.#thingToRound;
	}
	children(){
		return [ ('thingToRound' as PropEntry<this>) ];
	}
	static is(a:AST):a is Rounder{
		return (a instanceof Rounder);
	}
}

type MathOpStr
	= "+"
	| "-"
	| "*"
	| "/";

type Mathable
	= DiceRoll
	| Parens
	| Static
	| Lookup
	| Rounder;

export class MathOp implements AST {
	#opStr : MathOpStr = "+";
	#val : Mathable
	constructor(op : MathOpStr, val : Mathable){
		this.#opStr = op;
		this.#val = val;
	}
	get op(){
		return this.#opStr;
	}
	get val(){
		return this.#val;
	}
	children(){
		return [ ('val' as PropEntry<this>) ];
	}
	static is(a:any):a is MathOp{
		return (a instanceof MathOp);
	}
}

export class MathOpList implements AST {
	#ops : MathOp[] = [];
	#kidKeys : number[] = [];
	constructor(ops : MathOp[]){
		let kidKeys = [];
		for(let i = 0; i < ops.length; i++){
			kidKeys.push(i);
		}
		this.#ops = ops;
		this.#kidKeys = kidKeys;
		let self = this;
		let kidProps = kidKeys.reduce((acc : PropertyDescriptorMap, index : number) => {
			let newProp = {
				get: function(){ return self.#ops[index]; },
				set: function(v : MathOp){ self.#ops[index] = v; }
			};
			acc[index] = newProp;
			return acc;
		}, {});
		Object.defineProperties(this, kidProps);
	}
	get ops(){
		return this.#ops;
	}
	children(){
		let mapper = (i : number) => {
			return (i as PropEntry<this>);
		}
		let out = this.#kidKeys.map(mapper);
		return out;
	}
	static is (a:any):a is MathOpList{
		return (a instanceof MathOpList);
	}
}

export class MathSeq implements AST {
	#ops : MathOpList = new MathOpList([]);
	#head : Mathable;
	constructor(head : Mathable, ops : MathOpList){
		this.#head = head;
		this.#ops = ops;
	}
	get head(){
		return this.#head;
	}
	get ops(){
		return this.#ops;
	}
	children(){
		return [ ('head' as PropEntry<this>), ('ops' as PropEntry<this>) ];
	}
	static is(a:any):a is MathSeq{
		return (a instanceof MathSeq);
	}
}

export class Parens implements AST {
	#expression : AST;
	constructor(express : AST){
		this.#expression = express;
	}
	get expression(){
		return this.#expression;
	}
	children(){
		return [('expression' as PropEntry<this>)];
	}
	static is(a:any):a is Parens{
		return (a instanceof Parens);
	}
}

export type KeyMap<T extends AST, Acc> = Record<keyof T, Acc>;

interface DefineDefault {
	<T extends AST, A extends AST>(ast : T[], node : T, key: keyof T) : A;
}
interface TreeReducer<Acc> {
	<T extends AST>(ast : T, keymap : KeyMap<T, Acc>) : Acc;
}

export class TreeWalkerStep<T extends AST, Acc> {
	#currentNode: T;
	#allKeys: Array<keyof T> = [];
	#keyItor;
	#currentKey : keyof T | undefined;
	#keyMapAcc : Partial<KeyMap<T, Acc>> = {};
	constructor(thing : T){
		this.#currentNode = thing;
		this.#allKeys = thing.children();
		this.#keyItor = this.#allKeys.values();
	}
	get currentKey(){
		if(this.#currentKey === undefined){
			throw("No current key; may need to reset the iteration and call 'next'");
		} else {
			return this.#currentKey;
		}
	}
	get currentValue(){
		if(this.#currentKey === undefined){
			return undefined;
		}
		return this.#currentNode[this.#currentKey];
	}
	get currentNode(){
		return this.#currentNode;
	}
	get keymapSoFar(){
		return this.#keyMapAcc;
	}
	get keymap() : KeyMap<T, Acc> {
		let validator = (key : keyof T) => {
			if(this.#keyMapAcc[key] === undefined){
				throw(key + ' is not yet set');
			}
			return true;
		}
		this.#allKeys.forEach(validator);
		let out = (this.#keyMapAcc as unknown as KeyMap<T, Acc>);
		return out;
	}
	get allKeys(){
		return this.#allKeys;
	}
	resetItor(){
		this.#keyItor = this.#allKeys.values();
		this.#currentKey = undefined;
	}
	next(){
		let rawNext = this.#keyItor.next();
		this.#currentKey = rawNext.value;
		let outValue = {
			key: this.#currentKey,
			value: this.currentValue,
			done: rawNext.done
		}
		return outValue;
	}
	setKey(key : keyof T, value : Acc){
		this.#keyMapAcc[key] = value;
	}
	setCurrent(value : Acc){
		if(this.currentKey === undefined){
			throw("No current key. You either never called next, called next too often, or called next but didn't check the 'done' property.");
		} else {
			this.#keyMapAcc[this.currentKey] = value;
		}
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

export function walk_ast<Acc>(ast : AST, defaultAcc : Acc, defaulter : DefineDefault, reducer : TreeReducer<Acc>) : Acc | undefined{
	let stepStack : TreeWalkerStep<AST, Acc>[] = [];
	let currentStep : TreeWalkerStep<AST, Acc> = new TreeWalkerStep(ast);
	let done = false;
	let acc : Acc = defaultAcc;
	while(! done){
		let currentKeyVal = currentStep.next();
		if(currentKeyVal.done){
			acc = reducer(currentStep.currentNode, currentStep.keymap);
			let popped = stepStack.pop();
			if(popped === undefined){
				done = true;
			} else {
				popped.setCurrent(acc);
				currentStep = popped;
			}
		} else if(currentKeyVal.value === undefined){
			let defaulted = defaulter(stepStack.map((w) => w.currentNode), currentStep.currentNode, currentStep.currentKey);
			stepStack.push(currentStep);
			currentStep = new TreeWalkerStep(defaulted);
		} else {
			stepStack.push(currentStep);
			currentStep = new TreeWalkerStep((currentKeyVal.value as unknown as AST));
		}
	}
	return acc;
}
