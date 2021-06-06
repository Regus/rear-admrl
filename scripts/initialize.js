var shell = require('shelljs');
var fs = require('fs');

process.chdir('/home/pi/');


shell.exec('sudo systemctl stop rear-admrl.service');

var nodeVersion = shell.exec('node --version', {silent:true}).stdout.trim();

const service = `[Unit]
Description=Rear Admrl Service

[Service]
ExecStart=/home/pi/.nvm/versions/node/${nodeVersion}/bin/node /home/pi/rear-admrl/src/index.js
Environment="PATH=/home/pi/.nvm/versions/node/${nodeVersion}/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Type=simple
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
WorkingDirectory=/home/pi/rear-admrl
SyslogIdentifier=rear-admrl-service
User=pi

[Install]
WantedBy=multi-user.target
`

fs.writeFileSync('/home/pi/rear-admrl.service', service);

if (!fs.existsSync('/home/pi/fleet-data')) {
  shell.exec('mkdir fleet-data');
}
if (!fs.existsSync('/home/pi/fleet-data/install-app')) {
  shell.exec('mkdir fleet-data/install-app');
}
shell.exec('cp -r /home/pi/rear-admrl/install-app/* /home/pi/fleet-data/install-app');
shell.exec('cp /home/pi/rear-admrl/default-conf.json /home/pi/fleet-data/rear-admrl.json');
shell.exec('cp /home/pi/rear-admrl/assets/basic-klipper.cfg /home/pi/fleet-data/basic-klipper.cfg');
shell.exec('cp /home/pi/rear-admrl/assets/basic-moonraker.conf /home/pi/fleet-data/basic-moonraker.conf');

shell.exec('sudo mv /home/pi/rear-admrl.service /etc/systemd/system/rear-admrl.service');
shell.exec('sudo systemctl enable rear-admrl.service');
shell.exec('sudo systemctl start rear-admrl.service');


