all: compile min

compile:
	mkdir -p build
	cat src/dice.js src/dice.parse.js src/dice.eval.js > build/dice.js

min: compile
	java -jar compiler.jar --language_in ECMASCRIPT5 --js build/dice.js --js_output_file build/dice.min.js

peg:
	pegjs -e dice.parse --track-line-and-column src/dice.peg src/dice.parse.js

test: compile
	karma start karma.conf.js --single-run

dbgtest: peg compile
	karma start karma.conf.js
