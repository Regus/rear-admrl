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
    if (message === 'printer-setup.get-kconfig') {
      this.getKConfig(message);
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
      shell.exec('ls /dev/serial/by-id/*', {async: true, silent: true}, (code, stdout, stderr) => {
        this.remoteConsole.sendLine('update ports');
        this.remoteConsole.sendLine(code);
        this.remoteConsole.sendLine(stdout);
        this.remoteConsole.sendLine(stderr);
        if (code !== 0)   {
          this.connection.send(JSON.stringify({
            type: 'printer-ports',
            data: []
          }))
        }
        else {
          this.connection.send(JSON.stringify({
            type: 'printer-ports',
            data: stdout.trim().split(/\s+/)
          }))
        }
      });
    } catch (ex) {
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(command);
    }
  }

  async getKConfig(command) {
    try {
      const kconfigs = [];
      const config = fs.readFileSync('/home/pi/klipper/src/Kconfig').toString();
      kconfigs.push({
        path: '',
        content: config
      })
      const regex = /source "src\/(\S+)"/g;
      let match;
      while (match = regex.exec(config)) {
        const path = match[1];
        kconfigs.push({
          path,
          content: fs.readFileSync(`/home/pi/klipper/${path}`).toString();
        })
      }
      this.connection.send(JSON.stringify({
        type: 'kconfig',
        data: kconfigs
      }))
    } catch (ex) {
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(command);
    }

  }


}

module.exports = PrinterSetup;
