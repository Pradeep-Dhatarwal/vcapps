// express server
let express = require('express');
let app = express();
const https = require('https');
debugger;
const fs = require('fs');
var ssl = {
    key:fs.readFileSync('./src/isotalkcerts/privateKey.pem', 'utf8'),
    cert: fs.readFileSync('./src/isotalkcerts/isotalks.crt', 'utf8'),
    ca: fs.readFileSync('./src/isotalkcerts/isotalksCA.crt', 'utf8')
  };
// const app = require("https-localhost")();
const server = https.createServer( ssl , app);
// let server = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./ws/stream');
let path = require('path');
let favicon = require('serve-favicon')
let port = process.env.PORT || 4433;

app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});


io.of('/stream').on('connection', stream);

server.listen(port , () =>{
    console.log('server running on https://localhost:'+port)
});



// // // express server
// let express = require('express');
// let app = express();
// let server = require('http').Server(app);
// let io = require('socket.io')(server);
// let stream = require('./ws/stream');
// let path = require('path');
// let favicon = require('serve-favicon')
// let port = process.env.PORT || 3000;
// // const host="192.168.43.203";

// app.use(favicon(path.join(__dirname, 'favicon.ico')));
// app.use('/assets', express.static(path.join(__dirname, 'assets')));

// app.get('/', (req, res)=>{
//     res.sendFile(__dirname+'/index.html');
// });


// io.of('/stream').on('connection', stream);

// server.listen(port,() =>{
//     console.log("server running on port" + port)
// });


// screen