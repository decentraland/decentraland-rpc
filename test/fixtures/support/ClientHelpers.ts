import { API } from '../../../lib/client';

export function test(fn: () => Promise<any>) {
  fn()
    .then((x) => API.Test.pass(x))
    .catch(x => {
      console.log(x);
      return API.Test.fail(x.data);
    });
}

export async function shouldFail(fn: () => Promise<any>, msg: string = 'shouldFail') {
  try {
    const result = await fn();
    throw new Error(`${msg} - It did not fail.`);
  } catch (e) {
    if (!(e instanceof Error)) {
      throw new Error(`${msg} - Error thrown is not instance of Error`);
    }
    return 'DID_FAIL';
  }
}
