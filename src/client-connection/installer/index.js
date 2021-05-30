const shell = require('shelljs');
const fs = require('fs');

class Installer {
  constructor(connection, remoteConsole) {
    this.connection = connection;
    this.remoteConsole = remoteConsole;
  }

  handleMessage(message) {
    if (message.command === 'installer.install-fleet-admrl') {
      this.installFleetAdmrl(message.command);
      return true;
    }
    else if (message.command === 'installer.install-tooling') {
      this.installTooling(message.command);
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

  async installTooling(command) {
    try {
      this.remoteConsole.sendLine('Installing Klipper...');
      let code = 0;
      process.chdir('/home/pi/');
      if (fs.existsSync('/home/pi/klipper')) {
        process.chdir('/home/pi/klipper');
        code = await this.executeCmd('git pull');
        if (code !== 0) {
          this.remoteConsole.sendLine('Installation Failed!');
          this.remoteConsole.sendCommandFailed(command);
          return;
        }
        process.chdir('/home/pi/');
      }
      else {
        code = await this.executeCmd('git clone https://github.com/KevinOConnor/klipper');
        if (code !== 0) {
          this.remoteConsole.sendLine('Installation Failed!');
          this.remoteConsole.sendCommandFailed(command);
          return;
        }
      }

      const klipperScript = fs.readFileSync('./klipper/scripts/install-octopi.sh').toString();
      const klipperRunIndex = klipperScript.indexOf('# Run installation steps defined above');
      let klipperAdmrlScript = klipperScript.substr(0, klipperRunIndex);
      klipperAdmrlScript += '# Run installation steps defined above\n';
      klipperAdmrlScript += 'verify_ready\n';
      klipperAdmrlScript += 'install_packages\n';
      klipperAdmrlScript += 'create_virtualenv\n';
      fs.writeFileSync('./klipper/scripts/install-rear-admrl.sh', klipperAdmrlScript);

      code = await this.executeCmd('chmod +x ./klipper/scripts/install-rear-admrl.sh');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }

      code = await this.executeCmd('./klipper/scripts/install-rear-admrl.sh');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }

      fs.unlinkSync('./klipper/scripts/install-rear-admrl.sh');

      this.remoteConsole.sendLine('Installing Moonraker...');

      if (fs.existsSync('/home/pi/moonraker')) {
        process.chdir('/home/pi/moonraker');
        code = await this.executeCmd('git pull');
        if (code !== 0) {
          this.remoteConsole.sendLine('Installation Failed!');
          this.remoteConsole.sendCommandFailed(command);
          return;
        }
        process.chdir('/home/pi/');
      }
      else {
        code = await this.executeCmd('git clone https://github.com/Arksine/moonraker.git');
        if (code !== 0) {
          this.remoteConsole.sendLine('Installation Failed!');
          this.remoteConsole.sendCommandFailed(command);
          return;
        }
      }
      process.chdir('/home/pi/moonraker/scripts');

      {
        const moonrakerScript = fs.readFileSync('/home/pi/moonraker/scripts/install-moonraker.sh').toString();
        const moonrakerRunIndex = moonrakerScript.indexOf('# Run installation steps defined above');
        let moonrakerAdmrlScript = moonrakerScript.substr(0, moonrakerRunIndex);
        moonrakerAdmrlScript += '# Run installation steps defined above\n';
        moonrakerAdmrlScript += 'verify_ready\n';
        moonrakerAdmrlScript += 'install_packages\n';
        moonrakerAdmrlScript += 'create_virtualenv\n';
        fs.writeFileSync('/home/pi/moonraker/scripts/install-rear-admrl.sh', moonrakerAdmrlScript);
      }

      code = await this.executeCmd('chmod +x /home/pi/moonraker/scripts/install-rear-admrl.sh');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }

      code = await this.executeCmd('./install-rear-admrl.sh');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }

      fs.unlinkSync('/home/pi/moonraker/scripts/install-rear-admrl.sh');
      process.chdir('/home/pi/');

      this.remoteConsole.sendLine('-------------------------------------------');
      this.remoteConsole.sendLine('Klipper & Moonraker Installation Complete!');
      this.remoteConsole.sendLine('-------------------------------------------');

      this.remoteConsole.sendCommandComplete(command);
    } catch (ex) {
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(command);
    }
  }

  async installFleetAdmrl(command) {
    try {
      this.remoteConsole.sendLine('Installing Fleet Admrl...');
      let code = 0;
      process.chdir('/home/pi/');
      if (fs.existsSync('/home/pi/fleet-admrl')) {
        process.chdir('/home/pi/fleet-admrl');
        code = await this.executeCmd('git pull');
        if (code !== 0) {
          this.remoteConsole.sendLine('Installation Failed!');
          this.remoteConsole.sendCommandFailed(command);
          return;
        }
      }
      else {
        code = await this.executeCmd('git clone https://github.com/Regus/fleet-admrl.git');
        if (code !== 0) {
          this.remoteConsole.sendLine('Installation Failed!');
          this.remoteConsole.sendCommandFailed(command);
          return;
        }
      }
      process.chdir('/home/pi/fleet-admrl/');
      code = await this.executeCmd('npm install -g @angular/cli --loglevel verbose');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }
      code = await this.executeCmd('npm install --loglevel verbose');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }
      code = await this.executeCmd('npm run dist');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }
      process.chdir('/home/pi/');
      await this.executeCmd('rm -r /home/pi/fleet-data/fleet-admrl/*');
      code = await this.executeCmd('cp -r /home/pi/fleet-admrl/dist/fleet-admrl/* /home/pi/fleet-data/fleet-admrl/');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }

      if (fs.existsSync('/etc/nginx/sites-enabled/default')) {
        this.remoteConsole.sendLine('moving nginx default site to port 8080');
        let nginx = fs.readFileSync('/etc/nginx/sites-enabled/default');
        nginx.replace('listen 80', 'listen 8080');
        nginx.replace('listen [::]:80', 'listen [::]:8080');
        fs.writeFileSync('/etc/nginx/sites-enabled/default', nginx);
      }

      code = await this.executeCmd('sudo iptables -A PREROUTING -t nat -p tcp --dport 80 -j REDIRECT --to-port 4280');
      if (code !== 0) {
        this.remoteConsole.sendLine('Installation Failed!');
        this.remoteConsole.sendCommandFailed(command);
        return;
      }

      this.remoteConsole.sendLine('-------------------------------------------');
      this.remoteConsole.sendLine('Fleet Admrl Installation Complete!');
      this.remoteConsole.sendLine('-------------------------------------------');

      this.remoteConsole.sendCommandComplete(command);
    } catch (ex) {
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(command);
    }
  }

}

module.exports = Installer;
