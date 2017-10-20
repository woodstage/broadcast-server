const BroadcastServer = require("../src/BroadcastServer.js");
const readline = require('readline');

const server = new BroadcastServer(12345);

server.start({
    onmessage: (message, rinfo) => {
        console.log("server got: " + message + " from " +
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
    },
    ononline: (server, servers) => {
        console.log("server online: ", JSON.stringify(server));
        console.log("online servers: ", JSON.stringify(servers));
    },
    onoffline: (server, servers) => {
        console.log("server offline: ", JSON.stringify(server));
        console.log("online servers: ", JSON.stringify(servers));
    }
});