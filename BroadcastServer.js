"use strict";

const dgram = require("dgram");

function BroadcastServer(port) {
    this.port = port;
}

BroadcastServer.prototype.start = function (options = {}) {
    this.socket = dgram.createSocket("udp4");
    this.socket.on("error", options.onerror);
    this.socket.on("message", options.onmessage);
    this.socket.on("listening", options.onlistening.bind(null, this.socket));
    this.socket.bind(this.port, () => this.socket.setBroadcast(true));
}

BroadcastServer.prototype.send = function (data) {
    var message = new Buffer(data);
    this.socket.send(message, 0, message.length, this.port, '255.255.255.255', (err, bytes) => {
        if (err) return console.log(err);
        console.log("message sent!");
    });
}

module.exports = BroadcastServer;