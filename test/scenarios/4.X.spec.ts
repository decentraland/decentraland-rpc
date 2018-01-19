import { testInWorker } from "./support/Helpers";
import assert = require('assert');

testInWorker('test/out/4.0.Failures.js', {
  validateResult: (result) => {
    assert.deepEqual(result, { code: -32603, data: 'A message' });
  },
  log: true
});

testInWorker('test/out/4.1.Methods.js', {
  log: true
});
