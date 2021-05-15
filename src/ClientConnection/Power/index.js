const Gpio = require('onoff').Gpio;

class Power {
  printer1 = new Gpio(26, 'out');
  printer2 = new Gpio(16, 'out');
  printer3 = new Gpio(20, 'out');
  printer4 = new Gpio(21, 'out');

  constructor(connection, remoteConsole) {
    this.connection = connection;
    this.remoteConsole = remoteConsole;
  }

  handleMessage(message) {
    if (message === 'power.turn-on-all') {
      this.turnOnAllPrinters(message);
      return true;
    }
    else if (message === 'power.turn-off-all') {
      this.turnOffAllPrinters(message);
      return true;
    }
    return false;
  }

  turnOnAllPrinters(command) {
    try {
      this.printer1.writeSync(1);
      this.printer2.writeSync(1);
      this.printer3.writeSync(1);
      this.printer4.writeSync(1);
      this.remoteConsole.sendCommandComplete(command);
    } catch (ex) {
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(command);
    }
  }

  turnOffAllPrinters(command) {
    try {
      this.printer1.writeSync(0);
      this.printer2.writeSync(0);
      this.printer3.writeSync(0);
      this.printer4.writeSync(0);
      this.remoteConsole.sendCommandComplete(command);
    } catch (ex) {
      this.remoteConsole.sendLine('Installation Failed!');
      this.remoteConsole.sendLine('' + ex);
      this.remoteConsole.sendCommandFailed(command);
    }
  }
}

module.exports = Power;
