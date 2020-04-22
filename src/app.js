// // express server
// let express = require('express');
// let app = express();
// const https = require('https');

// const fs = require('fs');
// const key = fs.readFileSync('./key.pem');
// const cert = fs.readFileSync('./cert.pem');
// // const app = require("https-localhost")();
// const server = https.createServer({key: key, cert: cert }, app);
// // let server = require('http').Server(app);
// let io = require('socket.io')(server);
// let stream = require('./ws/stream');
// let path = require('path');
// let favicon = require('serve-favicon')
// let port = process.env.PORT || 5000;

// app.use(favicon(path.join(__dirname, 'favicon.ico')));
// app.use('/assets', express.static(path.join(__dirname, 'assets')));

// app.get('/', (req, res)=>{
//     res.sendFile(__dirname+'/index.html');
// });


// io.of('/stream').on('connection', stream);

// server.listen(port , () =>{
//     console.log('server running on http://localhost:'+port)
// });



// express server
let express = require('express');
let app = express();


let server = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./ws/stream');
let path = require('path');
let favicon = require('serve-favicon')
let port = process.env.PORT || 3000;

app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});


io.of('/stream').on('connection', stream);

server.listen(port , () =>{
    console.log("server running on port" + port)
});