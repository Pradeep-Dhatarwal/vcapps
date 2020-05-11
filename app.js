const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const crypt = require("./crypt.js");







let path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("./public"));
app.use(session({ secret: "uitisawesome", resave: true, saveUninitialized: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const https = require("https");
const fs = require("fs");
var ssl = {
	key: fs.readFileSync("./isotalkcerts/privateKey.pem", "utf8"),
	cert: fs.readFileSync("./isotalkcerts/isotalks.crt", "utf8"),
	ca: fs.readFileSync("./isotalkcerts/isotalksCA.crt", "utf8"),
};
// const app = require("https-localhost")();
const server = https.createServer(ssl, app);
// let server = require('http').Server(app);
let io = require("socket.io")(server);
let stream = require("./public/assets/ws/stream");

let favicon = require("serve-favicon");

let PORT = process.env.PORT || 3323;

app.use(favicon(path.join(__dirname, "favicon.ico")));




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

io.of("/stream").on("connection", stream);

server.listen(PORT, () => {
	console.log("server running on https://localhost:" + PORT);
});
// https://localhost:3323/room?wEZ0H4K0XcRq3ztjxewfeGbyPSOMfkJC3fDjU4Al9maaevL5E8MkdceNvIrsdK7ypTvCHk06nKKs5obbvRdvgTv1Ro1yPeKCeslbzZMK0xtdIr1LDusVH5aVbZGV6Kkv4gp29UfwBo02fvVUHp8zdg==
