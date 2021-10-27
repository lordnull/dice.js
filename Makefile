TEST_BROWSER?=chrome

all: build/dice.js

build/.deps-done: Makefile
	mkdir -p build
	npm install -y && touch build/.deps-done

src/parser.js: build/.deps-done src/dice.peg
	npx pegjs -o src/parser.js src/dice.peg

build/dice.js: build/.deps-done src/parser.js src/evaluate.js
	mkdir -p build
	npx browserify -e src/dice.js > build/dice.js -s dice

test: node_test browser_test

browser_test: build/.deps-done build/dice.js tests/dice.browser.spec.js
	npx jasmine-browser-runner runSpecs --config=jasmine-browser.json --color --no-random --browser="$(TEST_BROWSER)"

dbgtest: build/.deps-done build/dice.js tests/dice.browser.spec.js
	npx jasmine-browser-runner serve --config=jasmine-browser.json

node_test: build/.deps-done build/dice.js
	npx jasmine --config=jasmine.json

tests/dice.browser.spec.js: tests/dice.spec.js tests/rand_roll_gen.js
	npx browserify -e tests/dice.spec.js > tests/dice.browser.spec.js -s dice.spec

clean:
	rm -rf build/*
	rm -f src/parser.js

clean-deps:
	rm -rf node_modules
	rm -f build/.deps-done

clean-all: clean clean-deps
