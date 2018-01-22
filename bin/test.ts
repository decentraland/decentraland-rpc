#!/usr/bin/env node
import { resolve } from 'path';
import * as ws from 'ws';
import * as http from 'http';
import * as express from 'express';

const runner: (a: any) => Promise<any> = require('mocha-headless-chrome');

const keepOpen = process.argv.some($ => $ == '--keep-open');
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const wss = new ws.Server({ server });

// serve build.html
app.get('/', function (req, res) {
  res.sendFile(resolve(__dirname, '../test/index.html'));
});

console.log(resolve(__dirname, '../node_modules'));

app.use('/test', express.static(resolve(__dirname, '../test')));
app.use('/node_modules', express.static(resolve(__dirname, '../node_modules')));

server.listen(port, function (error: any) {
  if (error) {
    console.error(error);
    process.exit(1);
  } else {
    console.info('==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);

    const options = {
      file: `http://localhost:${port}`,
      visible: keepOpen
    };

    runner(options)
      .then(result => {
        console.dir(result);
        if (!keepOpen) process.exit(result.result.stats.failures);
      })
      .catch((err: Error) => {
        console.error(err.message || JSON.stringify(err));
        console.dir(err);
        if (!keepOpen) process.exit(1);
      });
  }
});

wss.on('connection', function connection(ws, req) {
  ws.on('message', function incoming(data) {
    console.log('[WSS] received: %s', data);
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on('error', (e) => console.log(e));
});

wss.on('error', (e) => console.log(e));
server.on('error', (e) => console.log(e));
