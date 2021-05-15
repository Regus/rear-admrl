const Installer = require('./installer');
const PrinterSetup = require('./PrinterSetup');
const RemoteConsole = require('./RemoteConsole');

class ClientConnection {

  constructor(ws, power) {
    this.ws = ws;
    this.remoteConsole = new RemoteConsole(this);
    this.installer = new Installer(this, this.remoteConsole);
    this.power = power;
    this.printerSetup = new PrinterSetup(this, this.remoteConsole);
    this.ws.on('message', (message) => {
      if (this.installer.handleMessage(message)) {
        return;
      }
      if (this.power.handleMessage(message, this.remoteConsole)) {
        return;
      }
      if (this.printerSetup.handleMessage(message)) {
        return;
      }
      this.remoteConsole.sendLine(`Unknown command '${message}'`);
    });
  }

  send(message) {
    this.ws.send(message);
  }

}

module.exports = ClientConnection;
