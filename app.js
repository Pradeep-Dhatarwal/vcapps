const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const request = require("request")
const app = express();
const crypt = require("./crypt.js");
let path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("./public"));
app.use(session({ secret: "uitisawesome", resave: true, saveUninitialized: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const https = require("http");
const fs = require("fs");
// var ssl = {
// 	key: fs.readFileSync("./isotalkcerts/privateKey.pem", "utf8"),
// 	cert: fs.readFileSync("./isotalkcerts/isotalks.crt", "utf8"),
// 	ca: fs.readFileSync("./isotalkcerts/isotalksCA.crt", "utf8"),
// };
// const server = https.createServer(ssl, app);
const server = https.createServer(app);
let io = require("socket.io")(server);
let stream = require("./public/assets/ws/stream");
let favicon = require("serve-favicon");
let PORT = process.env.PORT || 3323;
app.use(favicon(path.join(__dirname, "favicon.ico")));

function onConnection(socket){
	socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
	}
	
app.get("/room", function (req, res) {
	let pageUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	let qs = pageUrl.split("?")[1];
	// Wq1+ooBbt7as0r/KeSaZkcziNO55ujAM5whbDr4NYkd2TD9kAx0pcyt3o1xPGOzWb8qOJ3FRLgYdR8YmWW51g==
	const decryptedText = crypt.decrypt(qs);
	const encryptedContent = decryptedText.split("|N|");
	req.session.roomNo = encryptedContent[0];
	console.log(req.session.roomNo);
	req.session.email = encryptedContent[1];
	console.log(req.session.email);
	req.session.name = encryptedContent[2];
	console.log(req.session.name);
	res.render( "index" , {
		"email" : req.session.email,
		"userName":req.session.name,
		"roomid" : req.session.roomNo
	} );
});
app.get("/leaveroom", (req,res)=>{
	request.post({
			"headers": { "content-type": "application/json" },
			"url": "http://isotalks.com:7878/api/IsoTalks/LeaveRoom",
			"body": JSON.stringify({
					"Email": req.session.email ,
					"RoomId": req.session.roomNo
			})},
			 (error, response, body) => {
			if(error) {
					return console.dir(error);
			}
			else{
					req.session.destroy();
					res.redirect(301 , `https://isotalks.com/`);
					res.end(body);
			
			}
	});});

io.of("/stream").on("connection", stream);
io.on('connection', onConnection);
server.listen(PORT, () => {
	console.log("server running on https://localhost:" + PORT);
});


// const express = require("express");
// const session = require("express-session");
// const bodyParser = require("body-parser");
// const request = require("request")
// const app = express();
// const crypt = require("./crypt.js");
// let path = require("path");
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));
// app.use(express.static("./public"));
// app.use(session({ secret: "uitisawesome", resave: true, saveUninitialized: true }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// const https = require("https");
// const fs = require("fs");
// var ssl = {
// 	key: fs.readFileSync("./isotalkcerts/privateKey.pem", "utf8"),
// 	cert: fs.readFileSync("./isotalkcerts/isotalks.crt", "utf8"),
// 	ca: fs.readFileSync("./isotalkcerts/isotalksCA.crt", "utf8"),
// };
// const server = https.createServer(ssl, app);
// let io = require("socket.io")(server);
// let stream = require("./public/assets/ws/stream");
// let favicon = require("serve-favicon");
// let PORT = process.env.PORT || 3323;
// app.use(favicon(path.join(__dirname, "favicon.ico")));

// function onConnection(socket){
// 	socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
// 	}
	
// app.get("/room", function (req, res) {
// 	let pageUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
// 	let qs = pageUrl.split("?")[1];
// 	// Wq1+ooBbt7as0r/KeSaZkcziNO55ujAM5whbDr4NYkd2TD9kAx0pcyt3o1xPGOzWb8qOJ3FRLgYdR8YmWW51g==
// 	const decryptedText = crypt.decrypt(qs);
// 	const encryptedContent = decryptedText.split("|N|");
// 	req.session.roomNo = encryptedContent[0];
// 	console.log(req.session.roomNo);
// 	req.session.email = encryptedContent[1];
// 	console.log(req.session.email);
// 	req.session.name = encryptedContent[2];
// 	console.log(req.session.name);
// 	res.render( "index" , {
// 		"email" : req.session.email,
// 		"userName":req.session.name,
// 		"roomid" : req.session.roomNo
// 	} );
// });
// app.get("/leaveroom", (req,res)=>{
// 	request.post({
// 			"headers": { "content-type": "application/json" },
// 			"url": "http://isotalks.com:7878/api/IsoTalks/LeaveRoom",
// 			"body": JSON.stringify({
// 					"Email": req.session.email ,
// 					"RoomId": req.session.roomNo
// 			})},
// 			 (error, response, body) => {
// 			if(error) {
// 					return console.dir(error);
// 			}
// 			else{
// 					req.session.destroy();
// 					res.redirect(301 , `https://isotalks.com/`);
// 					res.end(body);
			
// 			}
// 	});});

// io.of("/stream").on("connection", stream);
// io.on('connection', onConnection);
// var Host='192.168.43.203'
// server.listen(PORT,Host, () => {
// 	console.log("server running on https://localhost:" + PORT);
// });





// https://localhost:3323/room?wEZ0H4K0XcRq3ztjxewfeGbyPSOMfkJC3fDjU4Al9maaevL5E8MkdceNvIrsdK7ypTvCHk06nKKs5obbvRdvgTv1Ro1yPeKCeslbzZMK0xtdIr1LDusVH5aVbZGV6Kkv4gp29UfwBo02fvVUHp8zdg==
