var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();


let path = require('path');
app.set('view engine', 'ejs');  
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('./public'));
app.use(session({secret: 'uitisawesome', resave : true, saveUninitialized:true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
const https = require('https');
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

    if(req.body.Email == '' || req.body.Password == ''){
        res.render('login');
    } else {
  request.post({
        "headers": { "content-type": "application/json" },
        "url": "http://isotalks.isoping.com:7878/api/IsoTalks/UserLogin",
        "body": JSON.stringify({
            "Email": req.body.Email ,
            "Password": req.body.Password
        })
    }, (error, response, body) => {
        if(error) {
            return console.dir(error);
        }
        else{
            var loginresponse = JSON.parse(body);
            if (loginresponse.Result.Flag == "0"){
                console.log(loginresponse)
                res.redirect(`login`);
                res.end(body);
            } else {
                req.session.email = loginresponse.Data.Email;
                console.log(loginresponse)
                res.redirect(`/`);
                res.end(body);
            }

        }
    });
}
});


app.get("/register", (req, res) => {
    res.render(`register`)
});


app.post("/register", (req, res) => {


    if( req.body.Name == '' || req.body.Registeremail == '' || req.body.Phone == ''){
        res.render('register');
    } else {
  request.post({
        "headers": { "content-type": "application/json" },
        "url": "http://isotalks.isoping.com:7878/api/IsoTalks/UserRegistration",
        "body": JSON.stringify({
            "Name": req.body.Name ,
            "Email": req.body.Registeremail ,
            "Phone": req.body.Phone
        })
    }, (error, response, body) => {
        if(error) {
            return console.dir(error);
        }
        else{
            var registerresponse = JSON.parse(body);
            if (registerresponse.Result.Flag == "0"){
                console.log(registerresponse)
                res.redirect(`register`);
                res.end(body);
            } else {
                console.log(registerresponse)
                res.redirect(`login`);
                res.end(body);
            }

        }
    });
}});


app.get("*", (req, res) => {
    res.send(" <h1 style='position:absolute; top:50%;left:50%;transform:translate(-50%,-50%)'>Error 404</h1>")
});
io.of('/stream').on('connection', stream);


server.listen(PORT , () =>{
    console.log('server running on https://localhost:'+ PORT)
});
