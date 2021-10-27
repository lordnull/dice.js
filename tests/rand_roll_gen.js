let MAX_LENGTH = 250;
let MAX_DEPTH = 100;
let MAX_SUB_EXPRESSIONS = 5;

function limit(limitCtx, func, tooMuch){
	if(limitCtx.depth >= MAX_DEPTH){
		limitCtx.length = limitCtx.length + tooMuch.length;
		return tooMuch;
	}
	if(limitCtx.length >= MAX_LENGTH){
		limitCtx.length = limitCtx.length + tooMuch.length;
		return tooMuch;
	}
	limitCtx.depth = limitCtx.depth + 1;
	let out = func(limitCtx);
	limitCtx.depth = limitCtx.depth - 1;
	return out;
}

function rand(min, max){
	let range = max - min;
	let rnd = Math.random();
	return Math.round(rnd) + min;
}

function randFromList(array){
	let mapped = array.map(function(e){ return {k: Math.random(), v:e}; });
	mapped.sort((a,b) => a.k - b.k);
	let sorted = mapped.map((e) => e.v);
	return sorted[0];
}

function rollType(){
	return randFromList("dwDW".split(''));
}

function numDice(ctx){
	let emptyStr = () => "";
	let func = randFromList([emptyStr, intVal]);
	let str = limit(ctx, func, "");
	ctx.length = ctx.length + str.length;
	return str;
}

function minMax(ctx){
	ctx.length = ctx.length + 2;
	let min = limit(ctx, intVal, "1");
	ctx.length = ctx.length + min.length;
	let max = limit(ctx, intVal, "1");
	return (min + ".." + max);
}

function roll(ctx){
	let func = randFromList([minMax, dndRoll]);
	return limit(ctx, func, "1d6");
}

function dndRoll(ctx){
	let type = rollType();
	ctx.length = ctx.length + 1;
	let numDiceStr = limit(ctx, numDice, "");
	let minMaxF = randFromList([minMax, intVal]);
	let minMaxStr = limit(ctx, minMaxF, "6");
	return numDiceStr + type + minMaxStr;
}

function intVal(ctx){
	let funcList = maybe_add_parens(ctx, [intLiteral, varExpression], [roundedParen])
	let func = randFromList(funcList);
	return limit(ctx, func, "1");
}

function intLiteral(ctx){
	let rnd1 = rand(-100, 100);
	let str = rnd1.toString();
	ctx.length = ctx.length + str.length;
	return str;
}

function varExpression(ctx){
	let emptyRoundF = () => "";
	let roundF = randFromList([emptyRoundF, roundFunc]);
	let roundFuncStr = limit(ctx, roundF, "");
	ctx.length = ctx.length + roundFuncStr.length;
	let varNameStr = limit(ctx, varName, "x");
	return roundFuncStr + "[" + varNameStr + "]";
}

function varName(ctx){
	let chars = "`1234567890-=qwertyuiop\\asdfghjkl;'zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJJKL:\"ZXCVBNM<>? ";
	let lengthRnd = rand(1, 20);
	let outStr = "";
	for(let i = 0; i < lengthRnd; i++){
		randChar = randFromList(chars.split(''));
		outStr = outStr + randChar;
	}
	ctx.length = ctx.length + outStr.length;
	return outStr;
}

function roundFunc(){
	return randFromList("cfr".split(''));
}

function maybe_add_parens(ctx, base, toAdd){
	if(ctx.subs >= MAX_SUB_EXPRESSIONS){
		return base;
	} else {
		return base.concat(toAdd);
	}
}

function roundedParen(ctx){
	ctx.length = ctx.length + 1;
	return roundFunc() + rawParens(ctx);
}

function rawParens(ctx){
	let ws1 = ws();
	let ws2 = ws();
	ctx.length = ws1.length + ws2.length + 2;
	ctx.subs = ctx.subs + 1;
	let internal = limit(ctx, form, "1 + 1");
	return "(" + ws1 + internal + ws2 + ")";
}

function ws(){
	return "".padEnd(rand(0,5));
}

function form(ctx){
	let funcList = [roll, mathSeq];
	funcList = maybe_add_parens(ctx, funcList, [roundedParen, rawParens]);
	let func = randFromList(funcList);
	return limit(ctx, func, "1");
}

function mathSeq(ctx){
	let leftSideFunc = maybe_add_parens(ctx, [roll, mathSeq], [roundedParen, rawParens]);
	let leftSide = randFromList(leftSideFunc);
	let rightSideFunc = maybe_add_parens(ctx, [roll], [roundedParen, rawParens]);
	let rightSide = randFromList(rightSideFunc);
	let op = randFromList("-+*/".split(''));
	let ws1 = ws();
	let ws2 = ws();
	ctx.length = ctx.length + ws1.length + ws2.length + op.length;
	let leftSideStr = limit(ctx, leftSide, "1");
	let rightSideStr = limit(ctx, rightSide, "1");
	return leftSideStr + ws1 + op + ws2 + rightSideStr;
}

function start(){
	let ctx = { depth: 0, length: 0, subs: 0};
	let func = randFromList([intVal, roll, mathSeq, rawParens, roundedParen]);
	return limit(ctx, func, "1");
}

exports.MAX_LENGTH = MAX_LENGTH;
exports.MAX_DEPTH = MAX_DEPTH;
exports.rollType = rollType;
exports.numDice = numDice;
exports.minMax = minMax;
exports.roll = roll;
exports.dndRoll = dndRoll;
exports.intVal = intVal;
exports.intLiteral = intLiteral;
exports.varExpression = varExpression;
exports.roundedParen = roundedParen;
exports.rawParens = rawParens;
exports.ws = ws;
exports.form = form;
exports.mathSeq = mathSeq;
exports.start = start;
