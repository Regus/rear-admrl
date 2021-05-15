const express = require('express');
const fs = require('fs');
const expressWs = require('express-ws');
const ClientConnection = require('./ClientConnection');
const Power = require('./Power');

const config = JSON.parse(fs.readFileSync('/home/pi/fleet-data/rear-admrl.json'));
const power = new Power();

const app = express();
expressWs(app);

app.use('/setup', express.static('/home/pi/fleet-data/install-app', {
  index: 'index.html'
}));

app.use('/', express.static('/home/pi/fleet-data/fleet-admrl', {
  index: 'index.html'
}));

// app.get('/', function (req, res) {
//   res.send('Hello World')
// })

app.ws('/ws', function(ws, req) {
  new ClientConnection(ws, power);
});

app.listen(config.port)

process.chdir('/home/pi/');