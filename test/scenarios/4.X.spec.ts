import { testInWorker } from "./support/Helpers";
import assert = require('assert');

testInWorker('test/out/4.0.Failures.js', {
  validateResult: (result) => {
    assert.equal(result, 'A message', 'It should have failed bouncing failing the message');
  },
  log: true
});

testInWorker('test/out/4.1.Methods.js', {
  log: true
});
