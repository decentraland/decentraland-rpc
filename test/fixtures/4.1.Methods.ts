import { ScriptingClient, API } from '../../lib/client';
import assert = require('assert');
import { test, shouldFail } from './support/ClientHelpers';

test(async () => {

  assert.equal(await API.Methods.enable(), 1);
  assert.equal(typeof (await API.Methods.getRandomNumber()), 'number');
  assert(await API.Methods.getRandomNumber() > 0);

  const sentObject = {
    x: await API.Methods.getRandomNumber()
  };

  assert.deepEqual(await API.Methods.receiveObject(sentObject), { received: sentObject });

  await API.Methods.failsWithoutParams(1);
  await API.Methods.failsWithParams();

  await shouldFail(() => API.Methods.failsWithoutParams(), 'failsWithoutParams');
  await shouldFail(() => API.Methods.failsWithParams(1), 'failsWithParams');

  // try {
  //   await API.Methods.failsWithParams(1);
  //   throw new Error('Unreachable');
  // } catch (e) {
  //   if (e.message == 'Unreachable')
  //     throw new Error('failsWithParams did not fail');
  // }
});
