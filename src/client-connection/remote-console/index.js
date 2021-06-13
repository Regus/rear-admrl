
class RemoteConsole {

  constructor(connection) {
    this.connection = connection;
    this.sendLine('Welcome to Rear Admrl Console 1.0.0');
  }

  sendCommandComplete(command) {
    this.connection.send(JSON.stringify({
      type: 'command-complete',
      data: command
    }));
  }

  sendCommandFailed(command) {
    this.connection.send(JSON.stringify({
      type: 'command-failed',
      data: command
    }));
  }

  sendLine(text) {
    this.connection.send(JSON.stringify({
      type: 'console',
      data: text + '\n'
    }));
  }

  send(text) {
    this.connection.send(JSON.stringify({
      type: 'console',
      data: text
    }));
  }

  updateLine(text) {
    this.connection.send(JSON.stringify({
      type: 'console.update-last-line',
      data: text + '\n'
    }));
  }

}

module.exports = RemoteConsole;
