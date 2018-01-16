import { ScriptingClient, API } from '../../dist/client';
import assert = require('assert');


(async () => {

  assert.equal(await API.Methods.enable(), 1);
  assert.equal(typeof (await API.Methods.getRandomNumber()), 'number');
  assert(await API.Methods.getRandomNumber() > 0);

  const sentObject = {
    x: await API.Methods.getRandomNumber()
  };

  assert.deepEqual(await API.Methods.receiveObject(sentObject), { received: sentObject });

  await API.Methods.failsWithoutParams(1);
  // await API.Methods.failsWithParams();

  // try {
  //   await API.Methods.failsWithoutParams();
  //   throw new Error('Unreachable');
  // } catch (e) {
  //   if (e.message == 'Unreachable')
  //     throw new Error('failsWithoutParams did not fail');
  // }

  // try {
  //   await API.Methods.failsWithParams(1);
  //   throw new Error('Unreachable');
  // } catch (e) {
  //   if (e.message == 'Unreachable')
  //     throw new Error('failsWithParams did not fail');
  // }



  await API.Test.pass();
})()
  .catch(x => API.Test.fail({ message: x.toString() }));
