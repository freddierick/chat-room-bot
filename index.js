const settings = require("./data.json");
const axios = require('axios');
const socket = require('socket.io-client')(settings.baseURL);
const { EventEmitter } = require('events');
const { send } = require("process");

function requestHome(url,data){ 
    return new Promise( (res,rej) => {
                axios
        .post(settings.baseURL+url, data)
        .then((rees) => {
            res(rees.data)
        })
        .catch((error) => {
            res(error.response)
  })
    });
};

function messageBuilder(data){
    const roomID = data.roomID;
    sendMsg = function (message){
        sendToChannel(roomID, message)
    };
    return {
        content:data.content,
        sentAt:data.time,
        room:{
            id:data.roomID,
            send:sendMsg
        },
        author:{
            isBot: data.isBot,
            username:data.author.username,
            id:data.author.id,
            icon:data.author.icon
        }
    };
};

function sendToChannel(roomID, message){
    requestHome("/message",{ roomID, message, WsToken:global.WsToken })
};

class Client extends EventEmitter{

    async login(email,pass){
        socket.on("message",async (data) => {
           const message = await messageBuilder(data)
            this.emit("message",  message)
        });
        return new Promise(async (res, rej) => {

            const data = await requestHome(`/auth`,{type:"bot",username:email, password:pass});
            if (data.error){
                if (data.error == 0) rej("Email or Password is incorrect!")
            }
            socket.emit("ws_login",data.WsToken)

              this.loggedIn=true;
              global.WsToken = data.WsToken;
            res(data)
        });
        
    };

    

    


  }

module.exports = {
    Client,
};
