const shell = require('shelljs');
const fs = require('fs');
const KlipperManager = require('../../klipper-manager');
const MoonrakerManager = require('../../moonraker-manager');
const ConfigFile = require('../../config-file');

class PrinterSetup {

  constructor(connection, remoteConsole, database) {
    this.connection = connection;
    this.remoteConsole = remoteConsole;
    this.database = database;
    this.klipper = new KlipperManager('/home/pi', remoteConsole, database);
    this.moonraker = new MoonrakerManager('/home/pi', remoteConsole, database);
  }

  handleMessage(message) {
    if (message.command === 'printer-setup.list-ports') {
      this.listPrinterPorts(message);
      return true;
    }
    if (message.command === 'printer-setup.get-kconfig') {
      this.getKConfig(message);
      return true;
    }
    if (message.command === 'printer-setup.get-basic-config') {
      this.getBasicConfig(message);
      return true;
    }
    if (message.command === 'printer-setup.install-printer') {
      this.installPrinter(message);
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

  async listPrinterPorts(message) {
    try {
      shell.exec('ls /dev/serial/by-id/*', {async: true, silent: true}, (code, stdout, stderr) => {
        this.remoteConsole.sendLine('update ports');
        this.remoteConsole.sendLine(code);
        this.remoteConsole.sendLine(stdout);
        this.remoteConsole.sendLine(stderr);
        if (code !== 0)   {
          this.connection.send(JSON.stringify({
            type: 'printer-ports',
            ref: message.ref,
            data: []
          }));
        }
        else {
          this.connection.send(JSON.stringify({
            type: 'printer-ports',
            ref: message.ref,
            data: stdout.trim().split(/\s+/)
          }));
        }
      });
    } catch (ex) {
      this.connection.send(JSON.stringify({
        type: 'error',
        ref: message.ref
      }));
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(message.command);
    }
  }

  async getBasicConfig(message) {
    try {
      let klipper = fs.readFileSync('/home/pi/fleet-data/basic-klipper.cfg').toString();
      let moonraker = fs.readFileSync('/home/pi/fleet-data/basic-moonraker.conf').toString();
      this.connection.send(JSON.stringify({
        type: 'basic-config',
        ref: message.ref,
        data: {
          klipper,
          moonraker
        }
      }));
    } catch (ex) {
      this.connection.send(JSON.stringify({
        type: 'error',
        ref: message.ref
      }));
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(message.command);
    }
  }

  async getKConfig(message) {
    try {
      const kconfigs = [];
      let kconfig = fs.readFileSync('/home/pi/klipper/src/Kconfig').toString();
      const config = fs.readFileSync('/home/pi/klipper/.config').toString();
      const regex = /source "(src\/\S+)"/g;
      let match;
      while (match = regex.exec(kconfig)) {
        const path = match[1];
        kconfigs.push({
          search: match[0],
          replace: fs.readFileSync(`/home/pi/klipper/${path}`).toString()
        })
      }
      kconfigs.forEach(item => {
        kconfig = kconfig.replace(item.search, item.replace);
      });

      this.connection.send(JSON.stringify({
        type: 'kconfig',
        ref: message.ref,
        data: {
          kconfig,
          config
        }
      }));
    } catch (ex) {
      this.connection.send(JSON.stringify({
        type: 'error',
        ref: message.ref
      }));
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(message.command);
    }
  }

  async installPrinter(message) {
    try {
      const name = message.data.name;
      const port = message.data.port;
      const kconfig = message.data.kconfig;
      const klipperConfig = message.data.klipper;
      const monnrakerConfig = message.data.moonraker;
      if (this.database.getPrinterByPort(port)) {
        this.remoteConsole.sendLine(`Cannot install printer - port ${port} already in use!`);
        this.remoteConsole.sendCommandFailed(message.command);
        return;
      }
      const printer = this.database.createPrinter();
      printer.name = name;
      printer.port = port;
      this.database.updatePrinter(printer.id, printer);
      this.database.writeToPrinter(printer.id, 'klipper.cfg', klipperConfig);
      this.database.writeToPrinter(printer.id, 'moonraker.conf', monnrakerConfig);
      this.database.writeToPrinter(printer.id, 'k.config', kconfig);

      const klipperConf = new ConfigFile(this.database.getPrinterPath(printer.id, 'klipper.cfg'));
      await klipperConf.load();
      const gcodeDir = this.database.getPrinterPath(printer.id, 'gcode');
      fs.mkdirSync(gcodeDir);
      klipperConf.setValue('virtual_sdcard', 'path', gcodeDir);
      await klipperConf.save();

      const hostname = shell.exec('hostname -I').stdout.trim();

      const moonrakerConf = new ConfigFile(this.database.getPrinterPath(printer.id, 'moonraker.conf'));
      await moonrakerConf.load();
      moonrakerConf.setValue('server', 'config_path', this.database.getPrinterPath(printer.id));
      moonrakerConf.setValue('server', 'klippy_uds_address', `/tmp/klippy_${printer.id}_uds`);
      moonrakerConf.setValue('server', 'database_path', this.database.getPrinterPath(printer.id, '.moonraker_database'));
      const trustedClients = moonrakerConf.getValue('authorization', 'trusted_clients');
      if (trustedClients) {
        if (Array.isArray(trustedClients)) {
          if (!trustedClients.find(hostname)) {
            moonrakerConf.setValue('authorization', 'trusted_clients', [...trustedClients, hostname]);
          }
        }
        else {
          if (trustedClients !== hostname) {
            moonrakerConf.setValue('authorization', 'trusted_clients', [trustedClients, hostname]);
          }
        }
      }
      else {
        moonrakerConf.setValue('authorization', 'trusted_clients', hostname);
      }
      await moonrakerConf.save();

      await this.klipper.installService(printer.id);
      await this.klipper.buildAndWriteFirmware(printer.id, port);
      await this.moonraker.installService(printer.id);

      this.remoteConsole.sendLine('Installation Complete!');
      this.remoteConsole.sendCommandComplete(message.command);
    } catch (ex) {
      console.log(ex);
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(message.command);
    }

  }

}

module.exports = PrinterSetup;
