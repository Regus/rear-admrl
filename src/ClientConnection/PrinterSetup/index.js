const shell = require('shelljs');
const fs = require('fs');

class PrinterSetup {

  constructor(connection, remoteConsole) {
    this.connection = connection;
    this.remoteConsole = remoteConsole;
  }

  handleMessage(message) {
    if (message === 'printer-setup.list-ports') {
      this.listPrinterPorts(message);
      return true;
    }
    return false;
  }

  async executeCmd(command) {
    return new Promise(resolve => {
      this.remoteConsole.sendLine(command);
      const proc = shell.exec(command, {async: true, silent: true}, (code) => {
        resolve(code);
      });
      proc.stdout.on('data', (data) => {
        this.remoteConsole.send(data);
      });
      proc.stderr.on('data', (data) => {
        this.remoteConsole.send(data);
      });
    });
  }

  async listPrinterPorts(command) {
    try {
      code = await this.executeCmd('ls /dev/serial/by-id/*');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }
      this.remoteConsole.sendCommandComplete(command);
    } catch (ex) {
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(command);
    }
  }


}

module.exports = PrinterSetup;
