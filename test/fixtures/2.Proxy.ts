import { getPlugin } from '../../lib/client';
import { test } from './support/ClientHelpers';

test(async () => {

  const xRuntime = getPlugin('xRuntime') as {
    enable(): Promise<any>;
    onExecutionContextDestroyed(callback: Function): void;
    run(): Promise<any>;
  };

  const xDebugger = getPlugin('xDebugger') as {
    enable(): Promise<any>;
  };

  const xProfiler = getPlugin('xProfiler') as {
    enable(): Promise<any>;
    start(): Promise<any>;
    stop(): Promise<any>;
  };

  await Promise.all([
    xRuntime.enable(),
    xDebugger.enable(),
    xProfiler.enable(),
    xRuntime.run(),
  ]);

  await xProfiler.start();
  await new Promise((resolve) => xRuntime.onExecutionContextDestroyed(resolve));
  await xProfiler.stop();
});
