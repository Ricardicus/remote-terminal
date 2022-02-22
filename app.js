/* Interactive shell */

/*
*
* In order for this program to work,
* ric-script interpretor must be placed
* in the path.
*
* This will not work on a Windows machine.
*
*/

var express = require('express')

const { spawn } = require('child_process');
var app = express();
var fs = require('fs');
var bodyParser  = require('body-parser');
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));

/* BASH is used */
var shell = "bash";

/* Output index file */
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/js/:script([a-z][a-z]*)', function(req, res) {
    res.sendFile(__dirname + '/js/' + req.params.script);
});

app.get('/doc', function(req, res) {
    res.sendFile(__dirname + '/doc/index.html');
});

app.get('/favicon.ico', function(req, res) {
    res.sendFile(__dirname + '/favicon.ico');
});

app.get('/doc/*', function(req, res) {
    if ( req.originalUrl.includes("?") ) {
        res.sendFile(__dirname + req.originalUrl.split("?")[0]);
    } else {
        res.sendFile(__dirname + req.originalUrl);
    }
});

app.get('/node_modules/*', function(req, res) {
        res.sendFile(__dirname + req.originalUrl);
});


app.get('/images/*', function(req, res) {
    res.sendFile(__dirname + req.originalUrl);
});

app.get('/samples/:script([a-z][a-z]*)', function(req, res) {
    var file = __dirname + '/samples/' + req.params.script;
    res.sendFile(file);

    /* Read file content, send it with socket.io */
    fs.readFile(file, "utf8", function(err, data){
        if(err) throw err;

        io.emit("terminal-sample", {message: data});        
    });

});

child = null;

// Create Interface
function initializeInterface(socket) {
  var interface = {
      terminal: spawn("/bin/sh"),
      handler: console.log,
      send: (data) => {
          interface.terminal.stdin.write(data + '\n');
      },
      cwd: () => {
          let cwd = fs.readlinkSync('/proc/' + interface.terminal.pid + '/cwd');
          interface.handler({ type: 'cwd', data: cwd });
      }
  };
  // Handle Data
  interface.terminal.stdout.on('data', (buffer) => {
      interface.handler({ type: 'data', data: buffer });
      socket.emit("terminal-output-stdout", {message: buffer.toString('utf8')});
  });

  // Handle Error
  interface.terminal.stderr.on('data', (buffer) => {
      interface.handler({ type: 'error', data: buffer });
      socket.emit("terminal-output-stderr", {message: buffer.toString('utf8')});
  });

  // Handle Closure
  interface.terminal.on('close', () => {
      interface.handler({ type: 'closure', data: null });
      socket.emit("terminal-exit-code", {message: 1337});
  });

  return interface;
}

function closeInterface(interface) {
  interface.terminal.kill("SIGTERM");
}

/* Redirect the rest to index */
app.get('*', function(req, res) {
    res.redirect('/');
});

io.on('connection', (socket) => {
  var interface = initializeInterface(socket);

  socket.on('disconnect', () => {
    /* User disconnected */
    closeInterface(interface);
  });

  socket.on('input', (command) => {
    interface.send(command);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
