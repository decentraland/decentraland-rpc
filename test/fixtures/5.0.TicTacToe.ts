import { ScriptingClient, API } from '../../dist/client';
import assert = require('assert');
import { test, shouldFail } from './support/ClientHelpers';
import { MessageBusClient } from './support/MessageBusClient';

test(async () => {
  const messageBus = MessageBusClient.aquireChannel('mock://tictactoe');

});
