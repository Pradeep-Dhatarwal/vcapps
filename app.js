var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();


let path = require('path');
app.set('view engine', 'ejs');  
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('./public'));
app.use(session({secret: 'uitisawesome', resave : true, saveUninitialized:true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const https = require('https');
var http = require('http');
const fs = require('fs');
var ssl = {
    key:fs.readFileSync('./isotalkcerts/privateKey.pem', 'utf8'),
    cert: fs.readFileSync('./isotalkcerts/isotalks.crt', 'utf8'),
    ca: fs.readFileSync('./isotalkcerts/isotalksCA.crt', 'utf8')
  };
// const app = require("https-localhost")();
const server = https.createServer( ssl , app);
// let server = require('http').Server(app);
let io = require('socket.io')(server);
let stream = require('./public/assets/ws/stream');

let favicon = require('serve-favicon')

let PORT = process.env.PORT || 3433;

app.use(favicon(path.join(__dirname, 'favicon.ico')));

app.get('/',function(req,res){
	if(!req.session.email) {
	    res.redirect('login');
	}
	else {
	    res.render('index');
	}
});
app.get('/login',function(req,res){
    res.render('login')
});


app.post('/login',function(req,res){
    var data = JSON.stringify( {
        'Email' : req.body.Email ,
        'Password' : req.body.Password
    });




console.log(data);
console.log(req.body);

    var options = {
        host: 'isotalks.isoping.com',
        port: 7878,
        path: '/api/IsoTalks/UserLogin',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    };
    
    var httpreq = http.request(options, function (response) {
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            console.log("body: " + chunk);
        });
        response.on('end', function() {
            res.send('ok');
        })
    });
        httpreq.write(data);
        httpreq.end();
        req.session.email = req.body.email;
        res.end('done');
        res.redirect(`/`)
});


app.get("/register", (req, res) => {
    res.render(`register`)
});


app.post("/register", (req, res) => {
    var proxyRequest = https.request({
        host: 'isotalks.isoping.com',
        port: 7878 ,
        method: 'POST',
        path: '/api/IsoTalks/UserRegistration',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    },
    function (error , proxyResponse , body) {
        if(!error){
            proxyResponse.on('data', function (chunk) {
                res.send(chunk);
            });
        } else {
            console.log(error);
        }
    });
    proxyRequest.write(res.body);
    proxyRequest.end();
});


app.get("*", (req, res) => {
    res.send(" <h1 style='position:absolute; top:50%;left:50%;transform:translate(-50%,-50%)' >Error 404</h1>")
});
io.of('/stream').on('connection', stream);


server.listen(PORT , () =>{
    console.log('server running on https://localhost:'+ PORT)
});
