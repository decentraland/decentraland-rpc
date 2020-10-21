COMPILER = bin/compile.js

clean:
	rm -rfv bin/*.js
	rm -rfv lib
	rm -rfv test/out

$(COMPILER): bin/compile.ts bin/test.ts bin/tsconfig.json
	node_modules/.bin/tsc -p bin/tsconfig.json
	chmod +x $(COMPILER)
	chmod +x bin/test.js

watch: $(COMPILER)
	$(COMPILER) compiler.cfg.json --watch

build: $(COMPILER)
	$(COMPILER) compiler.cfg.json

test: build
	node ./bin/test.js
	node_modules/.bin/nyc report --temp-directory ./test/out --reporter=html --reporter=lcov --reporter=text
	node_modules/.bin/mocha test/out/fixtures/**/*.test.js

test-local:
	$(MAKE) watch & node ./bin/test.js --keep-open

lint-fix:
	node_modules/.bin/tslint --project tsconfig.json --fix

lint:
	node_modules/.bin/tslint --project tsconfig.json

.PHONY: watch clean
