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
		return [('limit' as PropEntry<this>), ('comparToVal' as PropEntry<this>)];
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
}

type AsInteger
	= Static
	| Lookup
	| Rounder;

export class DiceRoll implements AST {
	#rolls : OrUndef<AsInteger>
	#min : OrUndef<AsInteger>
	#max : OrUndef<AsInteger>
	#modifiers : OrUndef<RollSetModifiers>
	constructor(rolls : OrUndef<AsInteger>, min : OrUndef<AsInteger>, max: OrUndef<AsInteger>, modifiers : OrUndef<RollSetModifiers>){
		this.#rolls = rolls;
		this.#min = min;
		this.#max = max;
		this.#modifiers;
	}
	get rolls(){
		return this.#rolls;
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
			[ ('rolls' as PropEntry<this>)
			, ('min' as PropEntry<this>)
			, ('max' as PropEntry<this>)
			, ('modifiers' as PropEntry<this>)
			];
		return keys;
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
}
