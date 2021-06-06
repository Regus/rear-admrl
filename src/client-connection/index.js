const Installer = require('./installer');
const PrinterSetup = require('./printer-setup');
const RemoteConsole = require('./remote-console');

class ClientConnection {

  constructor(ws, power, database) {
    this.ws = ws;
    this.remoteConsole = new RemoteConsole(this);
    this.installer = new Installer(this, this.remoteConsole);
    this.power = power;
    this.database = database;
    this.printerSetup = new PrinterSetup(this, this.remoteConsole, this.database);
    this.ws.on('message', (packet) => {
      const message = JSON.parse(packet);
      if (this.installer.handleMessage(message)) {
        return;
      }
      if (this.power.handleMessage(message, this.remoteConsole)) {
        return;
      }
      if (this.printerSetup.handleMessage(message)) {
        return;
      }
      this.remoteConsole.sendLine(`Unknown command '${JSON.stringify(message)}'`);
    });
  }

  send(message) {
    this.ws.send(message);
  }

}

module.exports = ClientConnection;
