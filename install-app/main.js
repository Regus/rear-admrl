var glbl = {}

function init() {
  glbl.console = document.getElementById('remote-console');
  glbl.consoleBuffer = '';

  glbl.ws = new WebSocket('ws://' + location.host + '/ws');

  glbl.ws.onopen = function (event) {
    console.log('on open', event);
  };

  glbl.ws.onmessage = function (event) {
    var message = JSON.parse(event.data);
    if (message.type === "console") {
      glbl.consoleBuffer += message.data;
      if (glbl.consoleBuffer.indexOf('\n') >= 0) {
        var line = document.createElement('div');
        line.innerText = glbl.consoleBuffer;
        glbl.console.appendChild(line);
        glbl.console.scrollTop = glbl.console.scrollHeight;
        glbl.consoleBuffer = '';
      }
    }
  };

  glbl.ws.onerror = function (event) {
    console.log('on error', event);
  };
}

window.addEventListener('load', function() {
  init();
});

function installFleetAdmiral() {
  glbl.ws.send('install-fleet-admiral');
}
