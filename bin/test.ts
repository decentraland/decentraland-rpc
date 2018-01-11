#!/usr/bin/env node

import runner = require('mocha-headless-chrome');
import { resolve } from 'path';

const Express = require('express');
const fs = require('fs');

let app = new Express();
let port = process.env.PORT || 3000;

// serve build.html
app.get('/', function (req, res) {
  res.sendFile(resolve(__dirname, '../test/index.html'));
});

console.log(resolve(__dirname, '../node_modules'))

app.use('/test', Express.static(resolve(__dirname, '../test')));
app.use('/node_modules', Express.static(resolve(__dirname, '../node_modules')));

app.listen(port, function (error) {
  if (error) {
    console.error(error);
    process.exit(1);
  } else {
    console.info('==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);

    const options = {
      file: `http://localhost:${port}`,
      visible: true
    };

    runner(options)
      .then(result => {
        let json = JSON.stringify(result);
        console.dir(result);
        process.exit(1);
      })
      .catch(err => {
        console.error(err.message || JSON.stringify(err));
        console.dir(err);
        process.exit(1);
      });

  }
});



