import { ScriptingClient } from '../../dist/client';

ScriptingClient.setLogging({ logConsole: true, logEmit: true });

const x = async () => {
  const data = await ScriptingClient.call('MethodX', 'a worker generated string');
  await ScriptingClient.call('JumpBack', data);
};
x()
  .then(() => console.log('Done.'))
  .catch(x => console.error(x));
