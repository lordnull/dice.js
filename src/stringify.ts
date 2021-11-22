let ast = require("./grammerAST");
import type { AST } from "./grammerAST";
import type * as grammerTypes from "./grammerAST";

let evaluate = require("./evaluate");
import type { Resolver } from "./evaluate";
import type * as evalTypes from "./evaluate";

function isAST(val : AST | Resolver) : val is AST {
	return (val as AST).children !== undefined;
}

export function stringify(resOrAst : AST | Resolver){
	if(isAST(resOrAst)){
		return stringify_loop(resOrAst, ast_format_steps);
	} else {
		return stringify_loop(resOrAst, res_format_steps);
	}
}

function ast_format_steps(astree : AST) : FormatSteps {
	if(astree instanceof ast.Static){
		let a = (astree as grammerTypes.Static);
		return [a.value.toString()];
	}
	if(astree instanceof ast.Lookup){
		let a = (astree as grammerTypes.Lookup);
		return ["[", a.lookupName, "]"]
	}
	if(astree instanceof ast.RollSetModifiers){
		let a = (astree as grammerTypes.RollSetModifiers);
		return [ "oh god modifiers..."];
	}
	if(astree instanceof ast.KeepDrop){
		let a = (astree as grammerTypes.KeepDrop);
		return ["keep lowest 33"];
	}
	if(astree instanceof ast.ReRoll){
		let a = (astree as grammerTypes.ReRoll);
		return ["reroll >10 55x"];
	}
	if(astree instanceof ast.Explode){
		let a = (astree as grammerTypes.Explode);
		return ["explode =3 1x"];
	}
	if(astree instanceof ast.DiceRoll){
		let a = (astree as grammerTypes.DiceRoll);
		return [ () => ast_num_dice(a), () => ast_dice_mode(a), () => ast_minmax(a), () => ast_dice_modifiers(a) ];
	}
	if(astree instanceof ast.Rounder){
		let a = (astree as grammerTypes.Rounder);
		return [a.roundType, () => ast_format_steps(a.thingToRound)];
	}
	if(astree instanceof ast.MathOp){
		let a = (astree as grammerTypes.MathOp);
		return [ a.op, () => ast_format_steps(a.val)];
	}
	if(astree instanceof ast.MathOpList){
		let a = (astree as grammerTypes.MathOpList);
		let mapper = (o : grammerTypes.MathOp) => {
			return () => ast_format_steps(o);
		};
		return a.ops.map(mapper);
	}
	if(astree instanceof ast.MathSeq){
		let a = (astree as grammerTypes.MathSeq);
		[() => ast_format_steps(a.head), () => ast_format_steps(a.ops)]
	}
	if(astree instanceof ast.Parens){
		let a = (astree as grammerTypes.Parens);
		return ["( ", () => ast_format_steps(a.expression), " )"];
	}
	throw('cannot format the thing');
}

function ast_num_dice(d : grammerTypes.DiceRoll){
	return ["12"];
}

function ast_dice_mode(d : grammerTypes.DiceRoll){
	return ["z"];
}

function ast_minmax(d : grammerTypes.DiceRoll){
	return ["99..-12"];
}

function ast_dice_modifiers(d : grammerTypes.DiceRoll){
	return ["no mods!"];
}

type FormatStep = string | ( () => FormatSteps );
type FormatSteps = Array<FormatStep>;

export function stringify_loop<T>(thing : T, formatter : (thing : T) => FormatSteps){
	let gathered : string[] = [];
	let stepsLeft : FormatSteps = formatter(thing);
	while( stepsLeft.length > 0 ){
		let head = stepsLeft.shift();
		if(head === undefined){
			continue;
		}
		if(typeof head === "string"){
			gathered.push(head);
			continue;
		}
		let prepend = head();
		stepsLeft = prepend.concat(stepsLeft);
	}
	return gathered.join('');
}

function res_format_steps(res : Resolver) : FormatSteps {
	if(res instanceof evaluate.StaticR){
		return [ () => ast_format_steps(res.ast) ];
	}
	if(res instanceof evaluate.LookupR){
		return [ res.valueOf().toString(), ":", () => ast_format_steps(res.ast) ];
	}
	if(res instanceof evaluate.ParensR){
		let p = (res as evalTypes.ParensR);
		return [ "( ", () => res_format_steps(p.expression), " )"];
	}
	if(res instanceof evaluate.RounderR){
		let r = (res as evalTypes.RounderR);
		return [ r.mode, () => res_format_steps(r.thingRounded) ];
	}
	if(res instanceof evaluate.DiceRollR){
		let d = (res as evalTypes.DiceRollR);
		let out =
			[ () => num_dice(d)
			, () => dice_mode(d)
			, () => minmax(d)
			, () => dice_modifiers(d.modifiers)
			, () => dice_result_set(d)
			];
		return out;
	}
	if(res instanceof evaluate.RollSetModifiersR){
		let mods = (res as evalTypes.RollSetModifiersR);
		return dice_modifiers(mods);
	}
	if(res instanceof evaluate.KeepDropModifier){
		let mod = (res as evalTypes.KeepDropModifier);
		return keep_drop_modifier(mod);
	}
	if(res instanceof evaluate.RerollModifier){
		let mod = (res as evalTypes.RerollModifier);
		return reroll_modifier(mod);
	}
	if(res instanceof evaluate.ExplodeModifier){
		let mod = (res as evalTypes.ExplodeModifier);
		return explode_modifier(mod);
	}
	if(res instanceof evaluate.MathOpR){
		let m = (res as evalTypes.MathOpR);
		return [m.op, " ", () => res_format_steps(m.operand) ];
	}
	if(res instanceof evaluate.MathOpListR){
		let m = (res as evalTypes.MathOpListR);
		let mapper = (op : evalTypes.MathOpR) => {
			return () => res_format_steps(op);
		}
		return m.ops.map(mapper);
	}
	if(res instanceof evaluate.MathSeqR){
		let m = (res as evalTypes.MathSeqR);
		let headEval = () => res_format_steps(m.head);
		let headSpce = () => {
			if(m.ops.ops.length === 0){
				return [];
			} else {
				return [ " " ];
			}
		}
		let opsEval = () => res_format_steps(m.ops);
		return [headEval, headSpce, opsEval];
	}
	throw('unformatabled!');
}

function num_dice(diceroll : evalTypes.DiceRollR) : FormatSteps {
	if((diceroll.ast as grammerTypes.DiceRoll).x){
		return [ () => {
			return res_format_steps(diceroll.x);
		} ]
	} else {
		return [];
	}
}

function dice_mode(diceroll : evalTypes.DiceRollR){
	if(diceroll.modifiers.mods.length === 0){
		return ["d"];
	}
	return ["q"];
}

function minmax(diceroll : evalTypes.DiceRollR){
	if((diceroll.ast as grammerTypes.DiceRoll).min === undefined){
		return [ () => res_format_steps(diceroll.max) ];
	} else {
		let out =
			[ () => res_format_steps(diceroll.min)
			, ".."
			, () => res_format_steps(diceroll.max)
			];
		return out;
	}
}

function dice_modifiers(mods : evalTypes.RollSetModifiersR){
	if((mods.ast as grammerTypes.RollSetModifiers).mods === undefined){
		return [];
	} else if(mods.mods.length === 0){
		return [];
	} else {
		return ["!!!mods listing not yet complete!!!"];
	}
}

function keep_drop_modifier(mod : evalTypes.KeepDropModifier){
	return ["keep highest 27"];
}

function reroll_modifier(mod : evalTypes.RerollModifier){
	return ["reroll <12 78x"];
}

function explode_modifier(mod : evalTypes.ExplodeModifier){
	return ["explode =7 8x"];
}

function dice_result_set(diceroll : evalTypes.DiceRollR){
	let out =
		[ ":["
		, () => {
			return [ diceroll.rolls.join(', ') ]
		}
		, "]"
		];
	return out;
}
