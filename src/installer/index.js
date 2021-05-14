var shell = require('shelljs');
var fs = require('fs');

class Installer {

  constructor(ws) {
    this.ws = ws;
    this.ws.on('message', (message) => {
      if (message === 'install-fleet-admrl') {
        this.installFleetAdmrl(message);
      }
      else {
        this.sendConsoleLine(`Unknown command '${message}'`);
      }
    });
    this.sendConsoleLine('Welcome to Rear Admrl Console 1.0.0');
  }

  sendCommandComplete(command) {
    this.ws.send(JSON.stringify({
      type: 'command-complete',
      data: command
    }));
  }

  sendCommandFailed(command) {
    this.ws.send(JSON.stringify({
      type: 'command-failed',
      data: command
    }));
  }

  sendConsoleLine(text) {
    this.ws.send(JSON.stringify({
      type: 'console',
      data: text + '\n'
    }));
  }

  sendConsole(text) {
    this.ws.send(JSON.stringify({
      type: 'console',
      data: text
    }));
  }

  async executeCmd(command) {
    return new Promise(resolve => {
      this.sendConsoleLine(command);
      const proc = shell.exec(command, {async: true, silent: true}, (code) => {
        resolve(code);
      });
      proc.stdout.on('data', (data) => {
        this.sendConsole(data);
      });
      proc.stderr.on('data', (data) => {
        this.sendConsole(data);
      });
    });
  }

  async installFleetAdmrl(command) {
    try {
      this.sendConsoleLine('Installing Fleet Admrl...');
      let code = 0;
      process.chdir('/home/pi/');
      if (fs.existsSync('/home/pi/fleet-admrl')) {
        process.chdir('/home/pi/fleet-admrl');
        code = await this.executeCmd('git pull');
        if (code !== 0) {
          this.sendConsoleLine('Installation Failed!');
          this.sendCommandFailed(command);
          return;
        }
      }
      else {
        code = await this.executeCmd('git clone https://github.com/Regus/fleet-admrl.git');
        if (code !== 0) {
          this.sendConsoleLine('Installation Failed!');
          this.sendCommandFailed(command);
          return;
        }
      }
      process.chdir('/home/pi/fleet-admrl/');
      code = await this.executeCmd('npm install -g @angular/cli --loglevel verbose');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        this.sendCommandFailed(command);
        return;
      }
      code = await this.executeCmd('npm install --loglevel verbose');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        this.sendCommandFailed(command);
        return;
      }
      code = await this.executeCmd('npm run dist');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        this.sendCommandFailed(command);
        return;
      }
      process.chdir('/home/pi/');
      await this.executeCmd('rm -r /home/pi/fleet-data/fleet-admrl/*');
      code = await this.executeCmd('cp -r /home/pi/fleet-admrl/dist/fleet-admrl/* /home/pi/fleet-data/fleet-admrl/');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        this.sendCommandFailed(command);
        return;
      }

      if (fs.existsSync('/etc/nginx/sites-enabled/default')) {
        this.sendConsoleLine('moving nginx default site to port 8080');
        let nginx = fs.readFileSync('/etc/nginx/sites-enabled/default');
        nginx.replace('listen 80', 'listen 8080');
        nginx.replace('listen [::]:80', 'listen [::]:8080');
        fs.writeFileSync('/etc/nginx/sites-enabled/default', nginx);
      }

      code = await this.executeCmd('sudo iptables -A PREROUTING -t nat -p tcp --dport 80 -j REDIRECT --to-port 4280');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        this.sendCommandFailed(command);
        return;
      }

      this.sendConsoleLine('-------------------------------------------');
      this.sendConsoleLine('Installtion Complete!');
      this.sendConsoleLine('-------------------------------------------');

      this.sendCommandComplete(command);

    } catch (ex) {
      console.log(ex);
    }
  }

}

module.exports = Installer;
