
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
