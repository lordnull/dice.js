NODE ?= "./node_modules/"
KARMA ?= "$(NODE)/karma/bin/karma"
PEGJS ?= "$(NODE)/pegjs/bin/pegjs"

all: compile min

get-deps:
	npm install

compile: get-deps
	mkdir -p build
	cat src/dice.js src/dice.parse.js src/dice.eval.js > build/dice.js

min: compile
	java -jar compiler.jar --language_in ECMASCRIPT5 --js build/dice.js --js_output_file build/dice.min.js

peg:
	$(PEGJS) -e dice.parse src/dice.peg src/dice.parse.js

test: get-deps peg compile
	$(KARMA) start karma.conf.js --single-run

dbgtest: get-deps peg compile
	$(KARMA) start karma.conf.js

clean:
	rm -rf $(NODE)
