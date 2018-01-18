#!/usr/bin/env node

import runner = require('mocha-headless-chrome');
import { resolve } from 'path';
import ws = require('ws');
import http = require('http');
import url = require('url');
import express = require('express');
import fs = require('fs');


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
        let json = JSON.stringify(result);
        console.dir(result);
        keepOpen || process.exit(0);
      })
      .catch(err => {
        console.error(err.message || JSON.stringify(err));
        console.dir(err);
        keepOpen || process.exit(1);
      });
  }
});

const users: { ws: ws, req: http.IncomingMessage }[] = [];

wss.on('connection', function connection(ws, req) {
  const thisUser = { ws, req };

  users.push(thisUser);

  const location = url.parse(req.url, true);
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {
    console.log('[WSS] received: %s', message);

    users.forEach($ => {
      // forward the message to the connections that shares the same URL
      if ($.req.url == req.url && $.ws != ws) {
        $.ws.send(message);
      }
    });
  });

  ws.on('close', () => {
    users.splice(users.indexOf(thisUser), 1);
  });

});
