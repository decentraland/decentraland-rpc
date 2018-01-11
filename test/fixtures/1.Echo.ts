import { ScriptingClient } from '../..';

ScriptingClient.setLogging({ logConsole: true, logEmit: true });

ScriptingClient.on('Start', () => {
  const x = async () => {
    console.log('Start notification received');
    const data = await ScriptingClient.call('MethodX', 'a worker generated string');
    await ScriptingClient.call('JumpBack', data);
  };
  x()
    .then(() => console.log('Done.'))
    .catch(x => console.error(x));
});

export const a = 1;
