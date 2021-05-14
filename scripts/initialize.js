var shell = require('shelljs');
var fs = require('fs');

process.chdir('/home/pi/');

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

shell.exec('cp /home/pi/rear-admrl/default-conf.json /home/pi/rear-admrl.json');

shell.exec('sudo mv /home/pi/rear-admrl.service /etc/systemd/system/rear-admrl.service');
shell.exec('sudo systemctl enable rear-admrl.service');
shell.exec('sudo systemctl start rear-admrl.service');




console.log(service);


// const test = async () => {
//   const proc = shell.exec('./klipper/scripts/install-rear-admrl.sh', {async: true, silent: true});
//   proc.stdout.on('data', (data) => {
//     process.stdout.write(data);
//   });
// }

// test();


// console.log('js initialize');

// process.chdir('/home/pi/');
// if (!fs.existsSync('./klipper')) {
//   shell.exec('git clone https://github.com/KevinOConnor/klipper')
// }
// process.chdir('/home/pi/klipper');
// shell.exec('git pull');
// process.chdir('/home/pi/');

// const klipperScript = fs.readFileSync('./klipper/scripts/install-octopi.sh').toString();


// const runIndex = klipperScript.indexOf('# Run installation steps defined above');

// let klipperAdmrlScript = klipperScript.substr(0, runIndex);
// klipperAdmrlScript += '# Run installation steps defined above\n';
// klipperAdmrlScript += 'verify_ready\n';
// klipperAdmrlScript += 'install_packages\n';
// klipperAdmrlScript += 'create_virtualenv\n';

// fs.writeFileSync('./klipper/scripts/install-rear-admrl.sh', klipperAdmrlScript);

// shell.exec('chmod +x ./klipper/scripts/install-rear-admrl.sh');
// shell.exec('./klipper/scripts/install-rear-admrl.sh');

// fs.unlinkSync('./klipper/scripts/install-rear-admrl.sh');

