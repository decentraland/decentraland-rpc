import { ScriptingClient, API } from '../../lib/client';
import { test } from './support/ClientHelpers';

test(async () => {
  await Promise.all([
    API.xRuntime.enable(),
    API.xDebugger.enable(),
    API.xProfiler.enable(),
    API.xRuntime.run(),
  ]);

  await API.xProfiler.start();
  await new Promise((resolve) => API.xRuntime.onExecutionContextDestroyed(resolve));
  await API.xProfiler.stop();
});
