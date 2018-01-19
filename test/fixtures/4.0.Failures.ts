import { ScriptingClient } from '../../lib/client';
import { test, shouldFail } from './support/ClientHelpers';
import { Methods } from './support/ClientCommons';

test(() => shouldFail(async () => {
  // this line throws an error in the RPC host
  // the error should be forwarded to the client
  // and it should create and throw a valid instance of Error (js)

  await Methods.fail();
}, 'RPC Call to API.Methods.fail'));
