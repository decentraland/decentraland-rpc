import { ScriptingClient, API } from '../../dist/client';


ScriptingClient.setLogging({ logConsole: true, logEmit: true });

const x = async () => {
  await Promise.all([
    API.Runtime.enable(),
    API.Debugger.enable(),
    API.Profiler.enable(),
    API.Runtime.run(),
  ]);

  await API.Profiler.start();
  await new Promise((resolve) => API.Runtime.onExecutionContextDestroyed(resolve));
  await API.Profiler.stop();
};

x()
  .then(() => console.log('Done.'))
  .catch(x => ScriptingClient.notify('Error', [x.toString(), x]));
