"use strict";

const dgram = require("dgram");
const getmac = require('getmac');
const os = require('os');

function BroadcastServer(port) {
    this.port = port;
    this.onlineServers = Object.create(null);
}

BroadcastServer.prototype.start = function (options = {}) {
    this.options = options;
    this.socket = dgram.createSocket("udp4");
    this.socket.on("error", options.onerror);
    this.socket.on("message", this.onmessage.bind(this, options.onmessage));
    this.socket.on("listening", this.onlistening.bind(this, this.socket));
    this.socket.bind(this.port, () => this.socket.setBroadcast(true));
    this._gc();
}

BroadcastServer.prototype._gc = function () {
    setInterval(() => {
        const currentTimestamp = new Date().getTime();
        for (let key in this.onlineServers) {
            if (currentTimestamp - this.onlineServers[key].timestamp > 6000) {
                const offlineServer = Object.assign({}, this.onlineServers[key]);
                delete this.onlineServers[key];
                if (typeof this.options.onoffline === "function") {
                    this.options.onoffline(offlineServer, this.onlineServers);
                }
            }
        }
    }, 2000);
}

BroadcastServer.prototype.onlistening = function (socket) {
    var address = socket.address();
    var ifs = os.networkInterfaces();
    var ip = Object.keys(ifs)
        .map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0])
        .filter(x => x)[0].address;
    getmac.getMac((err, macAddress) => {
        if (err) throw err
        const hostname = os.hostname();
        const onlineMessage = {
            type: "online",
            payload: {
                hostname,
                ip,
                port: address.port,
                mac: macAddress
            }
        };
        this.send("__" + JSON.stringify(onlineMessage));
        setInterval(() => {
            const heartbeatMessage = {
                type: "heartbeat",
                payload: {
                    hostname,
                    ip,
                    port: address.port,
                    mac: macAddress
                }
            };
            this.send("__" + JSON.stringify(heartbeatMessage));
        }, 5000);
    })
}

BroadcastServer.prototype.onmessage = function (callback, message, rinfo) {
    let messageStr = message.toString();
    if (messageStr.indexOf("__") === 0) {
        // internal message
        try {
            const messageObj = JSON.parse(messageStr.substring(2));
            const timestamp = new Date().getTime();
            switch (messageObj.type) {
                case "online":
                    this.onlineServers[messageObj.payload.mac] = Object.assign(messageObj.payload, {
                        timestamp
                    });
                    if (typeof this.options.ononline === "function") {
                        this.options.ononline(messageObj.payload, this.onlineServers);
                    }
                    break;
                case "heartbeat":
                    this.onlineServers[messageObj.payload.mac] = Object.assign(messageObj.payload, {
                        timestamp
                    });
                    if (typeof this.options.onheartbeat === "function") {
                        this.options.onheartbeat(messageObj.payload);
                    }
                    break;
                default:
                    break;
            }
        } catch (err) {
            if (err) console.log(err);
        }
    } else {
        callback(message, rinfo);
    }
}

BroadcastServer.prototype.send = function (data) {
    var message = new Buffer(data);
    this.socket.send(message, 0, message.length, this.port, '255.255.255.255', (err, bytes) => {
        if (err) throw err;
    });
}

BroadcastServer.prototype.getOnlineServers = function () {
    return this.onlineServers;
}

module.exports = BroadcastServer;