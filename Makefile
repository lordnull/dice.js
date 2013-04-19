all: compile min

compile:
	mkdir -p build
	cat src/dice.js src/dice.parse.js src/dice.eval.js > build/dice.js

min: compile
	java -jar compiler.jar --language_in ECMASCRIPT5 --js build/dice.js --js_output_file build/dice.min.js

test: compile
	karma start karma.conf.js --single-run
