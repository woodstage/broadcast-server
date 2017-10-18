const BroadcastServer = require("./BroadcastServer.js");
const readline = require('readline');

const server = new BroadcastServer(12345);

server.start({
    onmessage: (msg, rinfo) => {
        console.log("server got: " + msg + " from " +
            rinfo.address + ":" + rinfo.port);
    },
    onlistening: (socket) => {
        const address = socket.address();
        console.log("server listening " +
            address.address + ":" + address.port);
    },
    onerror: (err) => {
        console.log("server error:\n" + err.stack);
        server.close();
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', () => {
    rl.question('Enter a message:', (answer) => {
        server.send(answer)
    })
});