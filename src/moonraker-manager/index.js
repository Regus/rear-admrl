var shell = require('shelljs');
const fs = require('fs');

class MoonrakerManager {

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
      proc.stderr.on('data', (data) => {
        this.remoteConsole.send(data);
      });
    });
  }

  isServiceInstalled(printerid) {
    return fs.existsSync(`/etc/systemd/system/moonraker_${printerid}.service`);
  }

  async start(printerid) {
    await this.executeCmd(`sudo systemctl start moonraker_${printerid}.service`);
  }

  async stop(printerid) {
    await this.executeCmd(`sudo systemctl stop moonraker_${printerid}.service`);
  }

  async restart(printerid) {
    await this.executeCmd(`sudo systemctl restart moonraker_${printerid}.service`);
  }

  async installService(printerid) {
    const service = `#Systemd service file for moonraker
    [Unit]
    Description=Starts Moonraker on startup
    After=network.target

    [Install]
    WantedBy=multi-user.target

    [Service]
    Type=simple
    User=pi
    RemainAfterExit=yes
    ExecStart=/home/pi/moonraker-env/bin/python /home/pi/moonraker/moonraker/moonraker.py -c ${this.database.getPrinterPath(printerid, 'moonraker.conf')}
    Restart=always
    RestartSec=10
`;
    this.database.writeToPrinter(printerid, 'moonraker.service', service);
    await this.executeCmd(`sudo cp ${this.database.getPrinterPath(printerid, 'moonraker.service')} /etc/systemd/system/moonraker_${printerid}.service`);
    await this.executeCmd(`sudo systemctl enable moonraker_${printerid}.service`);
  }



}

module.exports = MoonrakerManager;
