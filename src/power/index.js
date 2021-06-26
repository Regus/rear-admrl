const Gpio = require('onoff').Gpio;

class Power {
  printer1 = new Gpio(26, 'out');
  printer2 = new Gpio(16, 'out');
  printer3 = new Gpio(20, 'out');
  printer4 = new Gpio(21, 'out');

  constructor() {
  }

  handleMessage(message, remoteConsole) {
    if (message.command === 'power.turn-on-all') {
      this.turnOnAllPrinters(message.command, remoteConsole);
      return true;
    }
    else if (message.command === 'power.turn-off-all') {
      this.turnOffAllPrinters(message.command, remoteConsole);
      return true;
    }
    return false;
  }

  turnOnAllPrinters(command, remoteConsole) {
    try {
      console.log('turn on all');
      this.printer1.writeSync(1);
      this.printer2.writeSync(1);
      this.printer3.writeSync(1);
      this.printer4.writeSync(1);
      remoteConsole.sendCommandComplete(command);
    } catch (ex) {
      remoteConsole.sendLine('Installation Failed!');
      remoteConsole.sendLine('' + ex);
      remoteConsole.sendCommandFailed(command);
    }
  }

  turnOffAllPrinters(command, remoteConsole) {
    try {
      console.log('turn off all');
      this.printer1.writeSync(0);
      this.printer2.writeSync(0);
      this.printer3.writeSync(0);
      this.printer4.writeSync(0);
      remoteConsole.sendCommandComplete(command);
    } catch (ex) {
      remoteConsole.sendLine('Installation Failed!');
      remoteConsole.sendLine('' + ex);
      remoteConsole.sendCommandFailed(command);
    }
  }
}

module.exports = Power;
