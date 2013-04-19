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
            "3d[W] + 2 + [Strength Mod] + [Enhance]d12", "3d6 + 1w6"];
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

    });
});

