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

    it("can parse a variety of intputs", function(){
        var strings = ["1", "1d6", "d20", "3d8", "3d2..8", "1d20 + 5",
            "3d6 + 1d12", "d20 + [Con Mod]", "3d[W]",
            "3d[W] + 2 + [Strength Mod] + [Enhance]d12", "3d6 + 1w6",
						"3d6 + -2", "3d6 * 2", "15 / 3", "f[scope var]",
						"3dr[roundable]", "c[tough]w7"];
        strings.map(function(toParse){
            var parseIt = function(){
                dice.parse.parse(toParse);
            }
            expect(parseIt).not.toThrow();
        });
    });

    describe("Roll results", function(){

        it("parses and evals a basic scope", function(){
            var scope = {"Key Thing":4};
            var res = dice.roll("[Key Thing]", scope);

            expect(res.sum).toEqual(4);

            scope["Key Thing"] = 27;
            res = dice.roll("[Key Thing]", scope);

            expect(res.sum).toEqual(27);
        });

        it("parse scope in num dice", function(){
            var rollStr = "[Key Thing]d5..5";

            var scope = {"Key Thing":4};
            var res = dice.roll(rollStr, scope);

            expect(res.sum).toEqual(20);

            scope["Key Thing"] = 27;
            res = dice.roll(rollStr, scope);

            expect(res.sum).toEqual(27 * 5);
        });

        it("parse scope in min and max", function(){
            var rollStr = "2d[Key Thing]..[Key Thing]";

            var scope = {"Key Thing":4};
            var res = dice.roll(rollStr, scope);

            expect(res.sum).toEqual(8);

            scope["Key Thing"] = 27;
            res = dice.roll(rollStr, scope);

            expect(res.sum).toEqual(27 * 2);

        });

				it("returns meta about parsed info", function(){
            var rollStr = "1d[Maxy] + 2";
						var parsed = dice.parse.parse(rollStr);
						parsed = _.flatten(parsed);

						expect(parsed[0].x.static).toEqual(true);
						expect(parsed[0].x.variable).toEqual(undefined);
						expect(parsed[0].max.static).toEqual(false);
						expect(parsed[0].max.variable).toEqual('Maxy');
						expect(parsed[0].max.operation).toEqual("none");
						expect(parsed[2].max.static).toEqual(true);
						expect(parsed[2].max.variable).toEqual(undefined);
				});

				it("adds negative numbers correctly", function(){
						var rollStr = "5 + -2";
						var parsed = dice.roll(rollStr, {});
						expect(parsed.sum).toEqual(3);
				});

				it("handles multiplecation", function(){
					var rollStr = "1d3..3 * 5";
					var parsed = dice.roll(rollStr, {});
					expect(parsed.sum).toEqual(15);
				});

				it("can divide two numbers", function(){
					var rollStr = "1d15..15 / 3";
					var parsed = dice.roll(rollStr, {});
					expect(parsed.sum).toEqual(5);
				});

				it("floors variable numbers", function(){
					var rollStr = "f[thang]d5..5";
					var scope = {'thang':3.7};
					var res = dice.roll(rollStr, scope);
					expect(res.sum).toEqual(15);
				});

				if("marks floored variables with that op", function(){
					var rollStr = "f[thang]d7";
					var parsed = dice.parse.parse(rollStr);
					expect(parsed[0].x.operation).toEqual("floor");
				});

				it("rounds variable numbers", function(){
					var rollStr = "r[3 2]dr[4 5]..5 + r[6 7]";
					var scope = {'3 2': 3.2, '4 5': 4.5, '6 7':6.7};
					var res = dice.roll(rollStr, scope);
					expect(res.sum).toEqual(22);
				});

				it("marks rounded variables", function(){
					var rollStr = "r[thang]";
					var parsed = dice.parse.parse(rollStr);
					expect(parsed.max.operation).toEqual("round");
				});

				it("ceilings variable numbers", function(){
					var rollStr = "1d4..c[not four]";
					var scope = {'not four': 3.2};
					var res = dice.roll(rollStr, scope);
					expect(res.sum).toEqual(4)
				});

				it("marks ceilinged variable numbers", function(){
					var rollStr = "1d4..c[top] + 2";
					var parsed = dice.parse.parse(rollStr);
					expect(parsed[0].max.operation).toEqual("ceiling");
				});
    });
});

