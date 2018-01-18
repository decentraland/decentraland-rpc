#!/usr/bin/env node

import * as runner from 'mocha-headless-chrome';
import { resolve } from 'path';
import * as ws from 'ws';
import * as http from 'http';
import * as url from 'url';
import * as express from 'express';
import * as fs from 'fs';


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

server.listen(port, function (error) {
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
      .catch(err => {
        console.error(err.message || JSON.stringify(err));
        console.dir(err);
        if (!keepOpen) process.exit(1);
      });
  }
});

wss.on('connection', function connection(ws, req) {
  const location = url.parse(req.url, true);
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

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
