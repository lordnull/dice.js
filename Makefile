NODE ?= "./node_modules/.bin"
KARMA ?= "$(NODE)/karma"
PEGJS ?= "$(NODE)/pegjs"
BROWSERIFY ?= "$(NODE)/browserify"

all: compile min

get-deps:
	npm install

compile: get-deps
	mkdir -p build
#	cat src/dice.js src/dice.parse.js src/dice.eval.js > build/dice.js
	$(BROWSERIFY) -e src/dice.js > build/dice.js -s dice

min: compile
	java -jar compiler.jar --language_in ECMASCRIPT5 --js build/dice.js --js_output_file build/dice.min.js

peg:
	$(PEGJS) src/dice.peg src/parser.js

test: node_test browser_test

browser_test: get-deps peg compile
	$(KARMA) start karma.conf.js --single-run

dbgtest: get-deps peg compile
	$(KARMA) start karma.conf.js

node_test: get-deps peg compile
	$(NODE)/jasmine-node tests

clean:
	rm -rf $(NODE)
