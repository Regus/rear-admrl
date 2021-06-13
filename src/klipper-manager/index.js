const fs = require('fs');
const fsp = require('fs').promises;
const Path = require('path');
var shell = require('shelljs');


class KlipperManager {

  constructor(home, remoteConsole, database) {
    this.home = home;
    this.remoteConsole = remoteConsole;
    this.database = database;
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
      let currentLine = undefined;
      proc.stderr.on('data', (data) => {
        data.split('\n')
        .map(line => line.trim())
        .forEach(line => {
          if (currentLine) {
            currentLine += line;
            this.remoteConsole.updateLine(currentLine);
            if (line.startsWith('|')) {
              currentLine = undefined;
            }
          }
          else {
            if (line === 'Reading |') {
              currentLine = 'Reading |';
            }
            if (line === 'Writing |') {
              currentLine = 'Writing |';
            }
            this.remoteConsole.sendLine(line);
          }
        });
      });
    });
  }

  isServiceInstalled(printerid) {
    fs.existsSync(`/etc/init.d/klipper_${printerid}`);
  }

  async start(printerid) {
    await this.executeCmd(`sudo /etc/init.d/klipper_${printerid} start`);
  }

  async stop(printerid) {
    await this.executeCmd(`sudo /etc/init.d/klipper_${printerid} stop`);
  }

  async restart(printerid) {
    await this.executeCmd(`sudo /etc/init.d/klipper_${printerid} restart`);
  }

  async installService(printerid) {
    const klipperPath = Path.join(this.home, 'klipper/scripts');
    const klipperStartPath = Path.join(klipperPath, 'klipper-start.sh');
    const klipperStart = (await fsp.readFile(klipperStartPath)).toString().replace(/(klipper)/ig, `$1_${printerid}`);
    this.database.writeToPrinter(printerid, 'klipper-start.sh', klipperStart);

    await this.executeCmd(`sudo cp ${this.database.getPrinterPath(printerid, 'klipper-start.sh')} /etc/init.d/klipper_${printerid}`);
    await this.executeCmd(`sudo chmod 755 /etc/init.d/klipper_${printerid}`);
    await this.executeCmd(`sudo update-rc.d klipper_${printerid} defaults`);

    const klipperDefaults = `# Configuration for /etc/init.d/klipper_${printerid}

KLIPPY_USER=$USER

KLIPPY_EXEC=/home/pi/klippy-env/bin/python

KLIPPY_ARGS="/home/pi/klipper/klippy/klippy.py ${this.database.getPrinterPath(printerid, 'klipper.cfg')} -l /tmp/klippy_${printerid}.log -a /tmp/klippy_${printerid}_uds"

`;
    this.database.writeToPrinter(printerid, 'klipper-defaults', klipperDefaults);

    await this.executeCmd(`sudo cp ${this.database.getPrinterPath(printerid, 'klipper-defaults')} ${`/etc/default/klipper_${printerid}`}`);
  }

  async buildAndWriteFirmware(printerid, port) {
    await this.executeCmd(`sudo cp ${this.database.getPrinterPath(printerid, 'k.config')} ${Path.join(this.home, 'klipper/scripts/.config')}`);
    process.chdir('/home/pi/klipper');
    await this.executeCmd('make clean');
    await this.executeCmd('make');
    const serviceInstalled = this.isServiceInstalled();
    if (serviceInstalled) {
      await this.stop(printerid);
    }
    await this.executeCmd(`make flash FLASH_DEVICE=${port}`);
    if (serviceInstalled) {
      await this.start(printerid);
    }
  }


}

module.exports = KlipperManager;
