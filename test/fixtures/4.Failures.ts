import { ScriptingClient, API } from '../../dist/client';

// ScriptingClient.setLogging({ logConsole: true, logEmit: true });

(async () => {
  try {
    await API.Methods.fail();

    // this line should be unreachable
    await API.Test.fail();
  } catch (e) {
    await API.Test.pass(e.data);
  }
})()
  .catch(x => ScriptingClient.notify('Error', [x.toString(), x]));
