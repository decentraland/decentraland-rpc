import { ScriptingClient } from '../../lib/client';

const x = async () => {
  const data = await ScriptingClient.call('MethodX', ['a worker generated string']);
  await ScriptingClient.call('JumpBack', data);
};
x()
  .catch(x => console.error(x));
