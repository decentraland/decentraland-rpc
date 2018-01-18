import { ScriptingClient, API } from '../../dist/client';
import { test } from './support/ClientHelpers';

test(async () => {
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
});
