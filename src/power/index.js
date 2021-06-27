const Gpio = require('onoff').Gpio;

class Power {
  printer1 = new Gpio(16, 'out');
  printer2 = new Gpio(20, 'out');
  printer3 = new Gpio(26, 'out');
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
    else if (message.command === 'power.turn-on') {
      this.turnOnPrinter(message, remoteConsole);
      return true;
    }
    else if (message.command === 'power.turn-off') {
      this.turnOffPrinter(message, remoteConsole);
      return true;
    }
    return false;
  }

  turnOnAllPrinters(command, remoteConsole) {
    try {
      remoteConsole.sendLine('Turn on all printers');
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
      remoteConsole.sendLine('Turn off all printers');
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

  turnOnPrinter(message, remoteConsole) {
    try {
      remoteConsole.sendLine('Turn on printer ' + message.data.pinIndex);
      switch (message.data.pinIndex) {
        case 1:
          this.printer1.writeSync(1);
        break;
        case 2:
          this.printer2.writeSync(1);
        break;
        case 3:
          this.printer3.writeSync(1);
        break;
        case 4:
          this.printer4.writeSync(1);
        break;
      }
      remoteConsole.sendCommandComplete(message.command);
    } catch (ex) {
      remoteConsole.sendLine('Operation Failed!');
      remoteConsole.sendLine('' + ex);
      remoteConsole.sendCommandFailed(message.command);
    }
  }

  turnOffPrinter(message, remoteConsole) {
    try {
      remoteConsole.sendLine('Turn off printer ' + message.data.pinIndex);
      switch (message.data.pinIndex) {
        case 1:
          this.printer1.writeSync(0);
        break;
        case 2:
          this.printer2.writeSync(0);
        break;
        case 3:
          this.printer3.writeSync(0);
        break;
        case 4:
          this.printer4.writeSync(0);
        break;
      }
      remoteConsole.sendCommandComplete(message.command);
    } catch (ex) {
      remoteConsole.sendLine('Operation Failed!');
      remoteConsole.sendLine('' + ex);
      remoteConsole.sendCommandFailed(message.command);
    }
  }
}

module.exports = Power;
