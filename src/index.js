const express = require('express');
const fs = require('fs');
const expressWs = require('express-ws');
const Installer = require('./installer');

const config = JSON.parse(fs.readFileSync('/home/pi/rear-admrl.json'));

const app = express();
expressWs(app);

app.use('/setup', express.static('/home/pi/rear-admrl-data/install-app', {
  index: 'index.html'
}));

app.use('/', express.static('/home/pi/rear-admrl-data/fleet-admrl', {
  index: 'index.html'
}));

// app.get('/', function (req, res) {
//   res.send('Hello World')
// })

app.ws('/ws', function(ws, req) {
  new Installer(ws);
});

app.listen(config.port)

process.chdir('/home/pi/');