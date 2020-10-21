COMPILER = bin/compile.js
NODE_BIN := $(shell npm bin)

clean:
	rm -rfv bin/*.js
	rm -rfv lib
	rm -rfv test/out

$(COMPILER): bin/compile.ts bin/test.ts bin/tsconfig.json
	$(NODE_BIN)/tsc -p bin/tsconfig.json
	chmod +x $(COMPILER)
	chmod +x bin/test.js

watch: $(COMPILER)
	$(COMPILER) compiler.cfg.json --watch

build: $(COMPILER)
	$(COMPILER) compiler.cfg.json

test: build
	node ./bin/test.js
	$(NODE_BIN)/nyc report --temp-directory ./test/out --reporter=html --reporter=lcov --reporter=text

test-local:
	$(MAKE) watch & node ./bin/test.js --keep-open

lint-fix:
	$(NODE_BIN)/tslint --project tsconfig.json --fix

lint:
	$(NODE_BIN)/tslint --project tsconfig.json

.PHONY: watch clean
