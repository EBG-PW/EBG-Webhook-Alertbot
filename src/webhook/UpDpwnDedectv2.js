require('dotenv').config();
const express = require('express');
const fs = require('fs');
const request = require("request");
var Time_started = new Date().getTime();

const Telebot = require('telebot');
const bot = new Telebot({
	token: process.env.Telegram_Bot_Token,
	limit: 1000,
        usePlugins: ['commandButton']
});


const PluginName = "UpDownDedect";
const PluginRequirements = [];
const PluginVersion = "0.0.2";
const PluginAuthor = "BolverBlitz";
const PluginDocs = "Privat";

let GSS = [];
let GSSStore = {"Server":[],"Time":[]};
let skip = 0

const router = express.Router();

router.get("/", (reg, res) => {
    res.status(401)
    res.json({message: "Active"});
});

function Check(){
	request(`https://api.ebg.pw/api/v1/serverstatus/now`, { json: true }, (err, res, body) => {
		if (err || typeof(body) === "undefined" || res.statusCode === 503){
			console.log("[Module.UpDown] \x1b[31m[ER]\x1b[0m EBG.PW API didn´t respont in time.");
			skip = 10
		  }else{
				let OnlineNames = [];  
				body.Out.onlineservers.map(Server => {
					OnlineNames.push(Server.name)
				});
				if(skip > 0){ //Don´t trigger when Stats Server restarts...
					skip = skip - 1
				}else{
					if(GSS.length === 0){
						GSS = OnlineNames
					}else{
						let dUP = OnlineNames.filter(x => !GSS.includes(x));
						let dDown = GSS.filter(x => !OnlineNames.includes(x));

						console.log(dDown, GSSStore.Server)
						dDown.map(Server => {
							GSSStore.Server.push(Server);
							GSSStore.Time.push(Date.now());
						});

						dUP.map(Server => {
							let index = GSSStore.Server.indexOf(Server);
							removeItemFromArrayByName(GSSStore.Server, Server);
							GSSStore.Time.splice(index, 1)
						});

						GSS = OnlineNames
				}
		  	}
		  }
	});
}

function pushTelegram(Msg){
	if(fs.existsSync(`${process.env.Admin_DB}/UpDownServices.json`)){
		let AppsJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownServices.json`));
		bot.sendMessage(AppsJ.TelegramChatId, Msg, { parseMode: 'html' , webPreview: false});
	}
}

function removeItemFromArrayByName(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

setInterval(function(){
	Check();
  }, 1*5000+50);

module.exports = {
	router: router,
	PluginName: PluginName,
	PluginRequirements: PluginRequirements,
	PluginVersion: PluginVersion,
	PluginAuthor: PluginAuthor,
	PluginDocs: PluginDocs
  };