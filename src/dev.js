const shell = require('shelljs');

const ConfigFile = require("./config-file");


const conf = new ConfigFile('E:/klipper/ender3.moonraker.conf');

const test = async () => {
  await conf.load();
  const value = conf.getValue('server', 'database_path');
  console.log('"' + value + '"');
  conf.setValue('server2', 'database_path2', ['test', 'te']);
  await conf.save();

}


test();