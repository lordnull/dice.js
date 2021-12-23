TEST_BROWSER?=chrome

.PHONY: clean clean-deps clean-all browser_test node_test dbgtest

all: build/dice.js

build/.deps-done: package.json package-lock.json
	mkdir -p build
	npm install -y && touch build/.deps-done

build/.tsc-done: src/*.ts
	npx tsc -p tsconfig.json && touch build/.tsc-done

src/parser.js: build/.deps-done src/dice.peg build/.tsc-done
	npx peggy -o src/parser.js src/dice.peg

build/dice.js: build/.deps-done src/parser.js build/.tsc-done
	mkdir -p build
	npx browserify -e src/dice.js > build/dice.js -s dice

test: node_test browser_test

browser_test: build/.deps-done build/dice.js tests/dice.browser.spec.js
	npx jasmine-browser-runner runSpecs --config=jasmine-browser.json --color --no-random --browser="$(TEST_BROWSER)"

dbgtest: build/.deps-done build/dice.js tests/dice.browser.spec.js
	npx jasmine-browser-runner serve --config=jasmine-browser.json

node_test: build/.deps-done build/dice.js
	npx jasmine --reporter="../../../tests/reporter.js" --config=jasmine.json

tests/dice.browser.spec.js: tests/dice.spec.js tests/rand_roll_gen.js build/dice.js
	npx browserify -e tests/dice.spec.js > tests/dice.browser.spec.js -s dice.spec

clean:
	rm -rf build/*
	rm -f build/.tsc-done
	rm -f src/parser.js
	rm -f src/evaluate.js
	rm -f src/grammerAST.js
	rm -f src/statistics.js
	rm -f src/stringify.js

clean-deps:
	rm -rf node_modules
	rm -f build/.deps-done

clean-all: clean clean-deps
