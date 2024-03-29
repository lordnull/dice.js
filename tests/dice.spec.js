var dice = require('../src/dice.js');
var rand_roll_gen = require('./rand_roll_gen');
var evaluate = require('../src/evaluate.js');

describe("Dice", function(){

	it("inits properly", function(){
		expect(dice).toBeDefined();
		expect(dice.eval).toBeDefined();
		expect(dice.parse).toBeDefined();
		expect(dice.roll).toBeDefined();
	});

	describe("can parse a variety of intputs", function(){
		var strings =
			["1"
			,"1d6"
			,"d20"
			,"3d8"
			,"3d2..8"
			,"1d20 + 5"
			,"3d6 + 1d12"
			,"d20 + [Con Mod]"
			,"3d[W]"
			,"3d[W] + 2 + [Strength Mod] + [Enhance]d12"
			,"3d6 + 1w6"
			,"3d6 + -2"
			,"3d6 * 2"
			,"15 / 3"
			,"f[scope var]"
			,"3dr[roundable]"
			,"c[tough]w7"
			,"3..5"
			,"(1)"
			,"(1 + 2)"
			,"( 2d6 * 7)"
			,"1d6 + (3d6 *7 )"
			,"( 1 + 2) * 3"
			,"1d20 * (1d6 * ( 3 + [variable] ) )"
			,"r([variable] + 2)d6"
			,"f(5 /3)"
			,"( c([variable] / 7) + 3) * 2"
			,"3 + r(3/ [variable])"
			,"1d[variable with space]"
			,"[variable.with.dot]d20"
			,"3d6 + [varible with-mixed.odd_characters]"
			,"3d5..1"
			,"-1..10"
			,"w-2..-8"
			,"2w[var]..-7"
			// start new group of synonyms
			,"4d6{ keep highest 3 }"
			,"4d6:kh3"
			// start new group of synonyms
			,"4d6{ drop lowest 1 }"
			,"4d6:dl1"
			,"4d6{ drop lowest }"
			,"4d6:dl"
			,"4d6:d"
			,"4d6:l"
			// start new group of synonyms
			,"2d20{ keep highest 1 }"
			,"2d20{ keep highest }"
			,"2d20:kh1"
			,"2d20:k"
			,"2d20:h"
			,"2d20:l"
			// start new group of synonyms
			,"2d20{ drop highest }"
			,"2d20{ keep lowest }"
			// start new group of synonyms
			,"3d6{ reroll 1 1x}"
			,"3d6:rr"
			// end of synonmy groups.
			,"3d6{reroll <2 2x}"
			,"3d6{ explode }"
			,"3d6{ explode = 5 }"
			,"4d6{ reroll 1 1x; keep highest 3 }"
			,"-10..10{ keep lowest 3}"
			,"[fireball]d6{ keep lowest [fireball keepers] }"
			,"[fireball]d6{ reroll < [fireball threshold] [reroll times]x }"
			];

		strings.map(function(toParse){
			it("parses " + toParse, function(){
				var parseIt = function(){
					dice.parse(toParse);
				}
				expect(parseIt).not.toThrow();
			});
		});
	});

	describe("Keep/Drop Modifiers Work Correctly", function(){

		it("keeps correct number of lowest", function(){
			let kdmod = new evaluate.KeepDropModifier("keep", "lowest", 3, null);
			let result = kdmod.modify([5, 4, 3, 2, 1].map((n) => new Number(n))).sort();
			let expected = [1,2,3].map((n) => new Number(n)).sort();
			expect(result).toEqual(expected);
		});

		it("keeps correct number of highest", function(){
			let kdmod = new evaluate.KeepDropModifier("keep", "highest", 2, null);
			let result = kdmod.modify([1,2,3,4,5].map((n) => new Number(n))).sort();
			let expected = [5,4].map((n) => new Number(n)).sort();
			expect(result).toEqual(expected);
		});

		it("drops correct number of lowest", function(){
			let kdmod = new evaluate.KeepDropModifier("drop", "lowest", 4, null);
			let result = kdmod.modify([5, 4, 3, 2, 1].map((n) => new Number(n))).sort();
			let expected = [5].map((n) => new Number(n)).sort();
			expect(result).toEqual(expected);
		});

		it("drops correct number of highest", function(){
			let kdmod = new evaluate.KeepDropModifier("drop", "highest", 1, null);
			let result = kdmod.modify([4, 3, 5, 2, 1].map((n) => new Number(n))).sort();
			let expected = [4,3,2,1].map((n) => new Number(n)).sort();
			expect(result).toEqual(expected);
		});

	});

	describe("parses and evaluates keepdrop correctly", function(){
		let expectations =
			[ {str: "4d6:kl3", len: 3}
			, {str: "4d6:kh2", len:2}
			, {str: "4d6:dl1", len:3}
			, {str: "4d6:dh2", len:2}
			, {str: "4d6{ keep lowest 3 }", len:3}
			, {str: "4d6{ keep highest 1 }", len:1}
			, {str: "4d6{ drop lowest 2 }", len:2}
			, {str: "4d6{ drop highest 1 }", len: 3}
			];
		expectations.map((ex) => {
			it(ex.str, function(){
				let r = dice.roll(ex.str);
					expect(r.rolls.length).toEqual(ex.len);
			})
		})
	});


	describe("Randomly generated rolls", function(){
		console.log(rand_roll_gen);
		for(let i = 0; i < 100; i++){
			let str = rand_roll_gen.start();
			it("Can parse: \"" + str + "\"", function(){
				function parseIt(){
					dice.parse(str);
				}
				expect(parseIt).not.toThrow();
			})
		}
	})

	describe("Roll results", function(){

		it("returns static numbers", function(){
			var res = dice.roll("3");
			expect(res).toEqual(3);
		});

		it("obeys order of operations, mult", function(){
			var res = dice.roll("5 / 2 * 3");
			expect(res).toEqual( ( 5 / 2 * 3 ) );
		});

		it("obeys order of operations, add", function(){
			var res = dice.roll("5 - 2 + 3");
			expect(res).toEqual( ( 5 - 2 + 3 ) );
		});

		it("obeys order of operations, mix", function(){
			var res = dice.roll("5 * 2 + 3 * 4 + 8");
			expect(res).toEqual( (5 * 2 + 3 * 4 + 8) );
		});

		it("parses and evals simple rolls", function(){
			var res = dice.roll("d20");
			expect(res).toBeLessThan(21);
			expect(res).toBeGreaterThan(0);
		});

		it("parses and evals a basic scope", function(){
			var scope = {"Key Thing":4};
			var res = dice.roll("[Key Thing]", scope);

			expect(res).toEqual(4);

			scope["Key Thing"] = 27;
			res = dice.roll("[Key Thing]", scope);

			expect(res).toEqual(27);
		});

		it("of a simple roll from static numbers", function(){
			var res = dice.roll("3d6");
			expect(res).toBeLessThan(19);
			expect(res).toBeGreaterThan(2);
			expect((res >= 3));
			expect(res.rolls).toBeDefined();
			res.rolls.map(function(n){
				expect(n).toBeLessThan(7);
				expect(n).toBeGreaterThan(0);
			});
		});

		it("rolls a simple roll with a bonus", function(){
			var res = dice.roll("1d20 + 4");
			expect(res).toBeLessThan(25);
			expect(res).toBeGreaterThan(4);
			var stringy = dice.stringify(res);
			expect(stringy).toMatch(/1d20:\[\d+\] \+ 4/);
		});

		it("parse and roll correct number of dice", function(){
			res = dice.roll("3d6..6");
			expect(res).toEqual(18);
			expect(res.rolls).toBeDefined();
			expect(res.rolls.length).toEqual(3);
			res.rolls.map(function(n){
				expect(n).toEqual(6);
			});
		});

		it("allows min and max to be negative", function(){
			var res1 = dice.roll("-1..1");
			expect(res1).toBeLessThan(2);
			expect(res1).toBeGreaterThan(-2);
			var res2 = dice.roll("-8..-2");
			expect(res2).toBeLessThan(-1);
			expect(res2).toBeGreaterThan(-9);
		});

		it("allows min and max to be in any order", function(){
			var res = dice.roll("1..-1");
			expect(res).toBeLessThan(2);
			expect(res).toBeGreaterThan(-2);
		});

		it("parse scope in num dice", function(){
			var rollStr = "[Key Thing]d5..5";

			var scope = {"Key Thing":4};
			var res = dice.roll(rollStr, scope);

			expect(res).toEqual(20);

			scope["Key Thing"] = 27;
			res = dice.roll(rollStr, scope);

			expect(res).toEqual(27 * 5);
		});

		it("parse scope in min and max", function(){
			var rollStr = "2d[Key Thing]..[Key Thing]";

			var scope = {"Key Thing":4};
			var res = dice.roll(rollStr, scope);

			expect(res).toEqual(8);

			scope["Key Thing"] = 27;
			res = dice.roll(rollStr, scope);

			expect(res).toEqual(27 * 2);

		});

		it("adds negative numbers correctly", function(){
			var rollStr = "5 + -2";
			var parsed = dice.roll(rollStr, {});
			expect(parsed).toEqual(3);
		});

		it("handles multiplication", function(){
			var rollStr = "1d3..3 * 5";
			var parsed = dice.roll(rollStr, {});
			expect(parsed).toEqual(15);
		});

		it("can divide two numbers", function(){
			var rollStr = "1d15..15 / 3";
			var parsed = dice.roll(rollStr, {});
			expect(parsed).toEqual(5);
		});

		it("floors variable numbers", function(){
			var rollStr = "f[thang]d5..5";
			var scope = {'thang':3.7};
			var res = dice.roll(rollStr, scope);
			expect(res).toEqual(15);
		});

		it("rounds variable numbers", function(){
			var rollStr = "r[3 2]dr[4 5]..5 + r[6 7]";
			var scope = {'3 2': 3.2, '4 5': 4.5, '6 7':6.7};
			var res = dice.roll(rollStr, scope);
			expect(res).toEqual(22);
		});

		it("ceilings variable numbers", function(){
			var rollStr = "1d4..c[not four]";
			var scope = {'not four': 3.2};
			var res = dice.roll(rollStr, scope);
			expect(res).toEqual(4)
		});

		it("respects order of operations", function(){
			var rollStr = "[n] + 2 * 5";
			var scope = {'n':7};
			var res = dice.roll(rollStr, scope);
			expect(res).toEqual(17);
		});

		it("handles basic parenthesis correctly", function(){
			var rollStr = "(2 + 3) * 7";
			var res = dice.roll(rollStr, {});
			expect(res).toEqual(35);
			var stringy = dice.stringify(res);
			expect(stringy).toEqual("( 2 + 3 ) * 7");
		});

		var testThings = [
		["f(10 / 3)", 3, "f( 10 / 3 )"],
		["r(10/3)", 3, "r( 10 / 3 )"],
		["c(10 /3)", 4, "c( 10 / 3 )"]
		];
		testThings.map(function(ar){
			it("round evals " + ar[0], function(){
				var res = dice.roll(ar[0], {});
				expect(res).toEqual(ar[1]);
				var stringy = dice.stringify(res);
				expect(stringy).toEqual(ar[2]);
			});
		});

		it("evaluates simple statistics with no extra params", function(){
			var results = dice.statistics("1d1");
			expect(results.min).toEqual(1);
			expect(results.max).toEqual(1);
			expect(results.mean).toEqual(1);
		});

		it("evaluates simple statistics with only samples", function(){
			var results = dice.statistics("1d1", 10);
			expect(results.min).toEqual(1);
			expect(results.results.length).toEqual(10);
			expect(results.max).toEqual(1);
			expect(results.mean).toEqual(1);
		});

		it("evaluates simple statistics with only scope", function(){
			var results = dice.statistics("1d[one]", {'one': 1});
			expect(results.min).toEqual(1);
			expect(results.max).toEqual(1);
			expect(results.mean).toEqual(1);
		});

		it("evaluates simple statistics with both scope and samples", function(){
			var results = dice.statistics("[one]d1", {'one': 1}, 50);
			expect(results.min).toEqual(1);
			expect(results.results.length).toEqual(50);
			expect(results.max).toEqual(1);
			expect(results.mean).toEqual(1);
		});

		it("can lookup weirdly named properties", function(){
			var propName = "ಠ_ಠ and-more_unusual.characters#$!^*&";
			var scope = {};
			scope[propName] = 53;
			var results = dice.roll("[" + propName + "]", scope);
			expect(results).toEqual(53);
		});

		it("can lookup nested scope variables", function(){
			var scope = {
				upper: {
					nested: 7
				}
			};
			var results = dice.roll("[upper.nested]", scope);
			expect(results).toEqual(7);
		});

		it("prefers full property name over nested scope", function(){
			var scope = {
				"upper.nested": 5,
				upper: {
					nested: 93
				}
			};
			var results = dice.roll("[upper.nested]", scope);
			expect(results).toEqual(5);
		});

		it("treats 'D' and 'd' the same", function(){
			var r1 = dice.roll("1d1");
			var r2 = dice.roll("1D1");
			expect(r1).toEqual(r2);
		});

		it("treats 'W' and 'w' the same", function(){
			var r1 = dice.statistics('1w6');
			var r2 = dice.statistics('1W6');
			expect(r1.min_possible).toEqual(r2.min_possible);
			expect(r1.max_possible).toEqual(r2.max_possible);
		})

	});

	describe("simple statisitcs tests", function(){

		var name_base = "provides min_possible and max_possible for ";
		var scope = {
			"v1": 1,
			"v10": 10,
			"v2": 2
		};
		let sigDigs = (n) => Math.round(n * 100) / 100;
		var inputs = [
			{str: "7 / 2", min: 3.5, max: 3.5},
			{str: "d20", min: 1, max: 20},
			{str: "[v1]d20", min: 1, max: 20},
			{str: "3d6", min: 3, max: 18},
			{str: "2d6 + 1d20", min: 3, max: 32},
			{str: "1d4..10", min: 4, max: 10},
			{str: "2d6 + 7", min: 9, max: 19},
			{str: "2d[v2]..6 + [v1]", min: 5, max: 13},
			{str: "2d6 * 3", min: 6, max: 36},
			// max is dirived by taking highest possible numerator / lowest possiblbe denominator
			// while min is smallest possible numberator / highest possible denominator
			{str: "3d6 / 2d[v10]", min: 0.15, max: 9},
			// 2d6 * 3 + 1 / 2d6 + 1
			{str: "[v2]d6 * 3 + [v1] / f(5 / 2)d6 + 1", min: sigDigs(7 + (1/12)), max: 37.5},
			{str: "f(2d10)w10", min: 2, max: 200},
			{str: "3 + r(7 / 2)d10", min: 7, max: 43},
			{str: "3dc(3 / 2)..7", min: 6, max: 21},
			{str: "1w6", min:1, max:6},
			{str: "4d6:kh3", min: 3, max: 18},
			{str: "4d6:kl1", min:1, max: 6},
			{str: "3d6:rr", min: 3, max: 18},
			{str: "5d6{ keep highest 4; drop lowest 1; reroll <2 2x; explode =6 2x }", min: 3, max: 18}
		];
		inputs.map(function(opts){
			it(name_base + opts.str, function(){
				var stats = dice.statistics(opts.str, scope, 1);
				expect(sigDigs(stats.min_possible)).toEqual(opts.min);
				expect(sigDigs(stats.max_possible)).toEqual(opts.max);
			});
		});


	});

});

exports.dice = dice;
exports.rrg = rand_roll_gen;

