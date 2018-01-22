import { getPlugin } from '../../lib/client';
import { test } from './support/ClientHelpers';

test(async () => {


  const Runtime = getPlugin('Runtime') as {
    enable(): Promise<any>;
    run(): Promise<any>;
  };

  const Debugger = getPlugin('Debugger') as {
    enable(): Promise<any>;
  };

  const Profiler = getPlugin('Profiler') as {
    enable(): Promise<any>;
    start(): Promise<any>;
    onExecutionContextDestroyed(callback: Function): void;
    stop(): Promise<any>;
  };

  await Promise.all([
    Runtime.enable(),
    Debugger.enable(),
    Profiler.enable(),
    Runtime.run(),
  ]);

  const mutex = new Promise((resolve) => Profiler.onExecutionContextDestroyed(resolve));

  await Profiler.start();
  await mutex;
  await Profiler.stop();
});
