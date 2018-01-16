import { ScriptingClient, API } from '../../dist/client';

const x = async () => {
  await Promise.all([
    API.Runtime.enable(),
    API.Debugger.enable(),
    API.Profiler.enable(),
    API.Runtime.run(),
  ]);

  const mutex = new Promise((resolve) => API.Profiler.onExecutionContextDestroyed(resolve));

  await API.Profiler.start();
  await mutex;
  await API.Profiler.stop();
};

x()
  .catch(x => ScriptingClient.notify('Error', [x.toString(), x]));
