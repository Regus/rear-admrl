var shell = require('shelljs');
var fs = require('fs');

class Installer {

  constructor(ws) {
    this.ws = ws;

    this.ws.on('message', (message) => {
      if (message === 'install-fleet-admiral') {
        this.installFleetAdmiral(message);
      }
    });


    shell.exec('echo "$USER"');
  }

  sendCommandComplete(command) {
    this.ws.send(JSON.stringify({
      type: 'command-complete',
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

  async installFleetAdmiral(command) {
    try {
      this.sendConsoleLine('Installing Fleet Admiral...');
      process.chdir('/home/pi/fleet-admrl/');
      let code = 0;
      code = await this.executeCmd('npm install -g @angular/cli --loglevel verbose');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        return;
      }
      code = await this.executeCmd('npm install --loglevel verbose');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        return;
      }
      code = await this.executeCmd('npm run dist');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        return;
      }
      process.chdir('/home/pi/');
      code = await this.executeCmd('rm /home/pi/rear-admrl/fleet-admrl-dist/*');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        return;
      }
      code = await this.executeCmd('cp -r /home/pi/fleet-admrl/dist/fleet-admrl/* /home/pi/rear-admrl/fleet-admrl-dist/');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
        return;
      }

      code = await this.executeCmd('cp -r /home/pi/fleet-admrl/dist/fleet-admrl/* /home/pi/rear-admrl/fleet-admrl-dist/');
      if (code !== 0) {
        this.sendConsoleLine('Installation Failed!');
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
