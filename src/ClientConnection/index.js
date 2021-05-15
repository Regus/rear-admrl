const Installer = require('./installer');
const Power = require('./Power');
const PrinterSetup = require('./PrinterSetup');
const RemoteConsole = require('./RemoteConsole');

class ClientConnection {

  constructor(ws) {
    this.ws = ws;
    this.remoteConsole = new RemoteConsole(this);
    this.installer = new Installer(this, this.remoteConsole);
    this.power = new Power(this, this.remoteConsole);
    this.printerSetup = new PrinterSetup(this, this.remoteConsole);
    this.ws.on('message', (message) => {
      if (this.installer.handleMessage(message)) {
        return;
      }
      if (this.power.handleMessage(message)) {
        return;
      }
      if (this.printerSetup.handleMessage(message)) {
        return;
      }
      this.sendConsoleLine(`Unknown command '${message}'`);
    });
  }

  send(message) {
    this.ws.send(message);
  }

}

module.exports = ClientConnection;
