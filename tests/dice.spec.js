// Testing min.js because if the min works, the unminned should also work
describe("Dice", function(){

    it("inits properly", function(){
        expect(dice).toBeDefined();
        expect(dice.eval).toBeDefined();
        expect(dice.parse).toBeDefined();
        expect(dice.eval.eval).toBeDefined();
        expect(dice.parse.parse).toBeDefined();
        expect(dice.roll).toBeDefined();
    });

		describe("can parse a variety of intputs", function(){
        var strings = ["1", "1d6", "d20", "3d8", "3d2..8", "1d20 + 5",
            "3d6 + 1d12", "d20 + [Con Mod]", "3d[W]",
            "3d[W] + 2 + [Strength Mod] + [Enhance]d12", "3d6 + 1w6",
						"3d6 + -2", "3d6 * 2", "15 / 3", "f[scope var]",
						"3dr[roundable]", "c[tough]w7", "3..5"];

        strings.map(function(toParse){
						it("parses " + toParse, function(){
								var parseIt = function(){
										dice.parse.parse(toParse);
								}
								expect(parseIt).not.toThrow();
						});
        });
    });

    describe("Roll results", function(){

				it("returns static numbers", function(){
					var res = dice.roll("3");
					expect(res).toEqual(3);
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
    });
});

