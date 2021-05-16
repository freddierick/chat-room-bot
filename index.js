const settings = require("./data.json");
const axios = require('axios');
const socket = require('socket.io-client')(settings.baseURL);
const { EventEmitter } = require('events');
const { send } = require("process");

function requestHome(url, data) {
    return new Promise((res, rej) => {
        axios
            .post(settings.baseURL + url, data)
            .then((rees) => {
                res(rees.data)
            })
            .catch((error) => {
                res(error.response)
            })
    });
};

class MessageConstructor {
    constructor(data, client) {
        this.client = client;
        this.send = this.send.bind(this);

        this.roomID = data.roomID;
        this.content = data.content,
            this.sentAt = data.time,
            this.room = {
                id: data.roomID,
                send: this.send
            },
            this.author = {
                isBot: data.isBot,
                username: data.author.username,
                id: data.author.id,
                icon: data.author.icon
            }
    };
    send(message) {
        return requestHome("/message", { roomID: this.roomID, message, WsToken: this.token });
    };
}

class Client extends EventEmitter {
    constructor() {
        super()
        this.MessageConstructor = MessageConstructor;
    }
    async login(email, pass) {
        if (!email || !pass) throw 'Invalid Login Credentials!';
        socket.on("message", async (data) => {
            const message = new this.MessageConstructor(data, client);
            this.emit("message", message)
        });
        return new Promise(async (res, rej) => {
            const data = await requestHome(`/auth`, { type: "bot", username: email, password: pass });
            if (data.error) {
                if (data.error == 0) rej("Email or Password is incorrect!")
            } else {
                this.me = { username: data.username }
                this.token = data.WsToken;
                socket.emit("ws_login", data.WsToken)
                this.loggedIn = true;
                this.emit("ready");
                res(data)
            }
        });
    };
}



const client = new Client();

client.login("freddiewren9@gmail.com", "Freddie123");

client.on("ready", () => {
    console.log(`[BOOT] Logged In As ${client.me.username}`)
});

client.on("message", async (message) => {
    if (message.content == "Test") {
        console.log("Sending Response")
        console.log(message.client.me.username)
        r = await message.room.send("Hello");
        // console.log(r)
    }
});


module.exports = {
    Client,
};
