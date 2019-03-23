//@ts-check

require("dotenv").config();
const ws = require("ws");

const wss = new ws.Server({port: parseInt(process.env.WS_PORT)});
let nConnectionCounter = 0;

wss.on("connection", (ws) => {
	nConnectionCounter ++;
	console.log(`New connection. On total [${nConnectionCounter }]`);
	ws.on("message", (message) => {
		console.log(message);
	})
});

console.log(`Server started on port: ${process.env.WS_PORT}`);