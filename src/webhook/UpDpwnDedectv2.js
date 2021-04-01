require('dotenv').config();
const express = require('express');
const fs = require('fs');
const request = require("request");
var Time_started = new Date().getTime();

const Telebot = require('telebot');
const { isRegExp } = require('util');
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

//Für Zeit Befehle
var Sekunde = 1000;
var Minute = Sekunde*60;
var Stunde = Minute*60;
var Tag = Stunde*24;
var Monat = Tag*(365/12);
var Jahr = Tag*365;

let GSS = [];
let GSSStore = {"Server":[],"Time":[],"Pushed":[]};
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
						let Msg = "";

						let dUP = OnlineNames.filter(x => !GSS.includes(x));
						let dDown = GSS.filter(x => !OnlineNames.includes(x));

						//console.log(dDown, GSSStore)
						dDown.map(Server => {
							GSSStore.Server.push(Server);
							GSSStore.Time.push(Date.now());
							GSSStore.Pushed.push(false)
						});

						dUP.map(Server => {
							let index = GSSStore.Server.indexOf(Server);
							if(GSSStore.Pushed[index] === true){
								Msg = Msg + `Server ${Server} went UP it was down for ${convertTime(Date.now()-GSSStore.Time[index])}\n`
							}
							removeItemFromArrayByName(GSSStore.Server, Server);
							GSSStore.Time.splice(index, 1)
							GSSStore.Pushed.splice(index, 1)
						});

						if(Msg.length >= 1){
							pushTelegram(Msg);
						}

						checkGSStore();

						GSS = OnlineNames;
				}
		  	}
		  }
	});
}

/**
 * Will check if one or multiple entrys of GSSStore are ready to push.
 * This will trigger a "Server went down" message.
 */
function checkGSStore(){
	let Msg = "";
	let Apps = "";
	let AppsJ, ConfJ;
	if(fs.existsSync(`${process.env.Admin_DB}/UpDownServices.json`) && fs.existsSync(`${process.env.Admin_DB}/UpDownConfig.json`)){
		AppsJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownServices.json`));
		ConfJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownConfig.json`));
	}
	let DownTime = ConfJ.TimeUntilDownNotification*1000 || 1*60*1000
	GSSStore.Time.map((time, i) => {
		if(time+DownTime <= Date.now()){
			if(!GSSStore.Pushed[i]){
				Msg = Msg + `Server ${GSSStore.Server[i]} went DOWN!\n`
				if(ConfJ.Mute = !true){
					GSSStore.Pushed[i] = true
				}
				if(AppsJ){
					if (typeof AppsJ.Services[GSSStore.Server[i]] !== 'undefined'){
						Apps = Apps + `${AppsJ.Services[GSSStore.Server[i]]}\n`
					};
				};
			};
		};
	});

	if(Apps.length > 0){
		Msg = Msg + "\nApplications\n" + Apps;
	}
	if(Msg.length >= 1){
		pushTelegram(Msg);
	}
}

/**
 * Will send a html parsed string to telegram
 * Loads from UpDownConfig and will handle the mute function
 * @param {String} Msg 
 */
function pushTelegram(Msg){
	if(fs.existsSync(`${process.env.Admin_DB}/UpDownServices.json`) && fs.existsSync(`${process.env.Admin_DB}/UpDownConfig.json`)){
		let AppsJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownServices.json`));
		let ConfJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownConfig.json`));
		if(!ConfJ.Mute){
			bot.sendMessage(AppsJ.TelegramChatId, Msg, { parseMode: 'html' , webPreview: false});
		}else{
			if(ConfJ.MuteUntil < Date.now()){
				ConfJ.Mute = false;
				bot.sendMessage(AppsJ.TelegramChatId, Msg, { parseMode: 'html' , webPreview: false});
				let NewJson = JSON.stringify(ConfJ);
				fs.writeFile(`${process.env.Admin_DB}/UpDownConfig.json`, NewJson, (err) => {if (err) console.log(err);});
			}
		}
	}
}

/**
 * Will remove the given variable from the string if it exists 
 * @param {string|number} a
 * @param {array} arr
 * @returns {array}
 */
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
/**
 * Converts a epochtime into string split into days, hours, minutes and seconds
 * @param {number} uptime
 * @returns {String}
 */
let convertTime = function uptime(uptime) {
	var uptimeTage =  Math.floor((uptime)/Tag);
	var uptimeTageRest = uptime-(uptimeTage*Tag)
	var uptimeStunde =  Math.floor((uptimeTageRest)/Stunde);
	var uptimeStundeRest = uptimeTageRest-(uptimeStunde*Stunde)
	var uptimeMinute =  Math.floor((uptimeStundeRest)/Minute);
	var uptimeMinuteRest = uptimeStundeRest-(uptimeMinute*Minute)
	var uptimeSekunde =  Math.floor((uptimeMinuteRest)/Sekunde);
	let uptimeoutput = "";
	if(uptimeTage >= 1){uptimeoutput = `${uptimeoutput}${uptimeTage}d:`}
	if(uptimeStunde >= 1){uptimeoutput = `${uptimeoutput}${uptimeStunde}h:`}
	if(uptimeMinute >= 1){uptimeoutput = `${uptimeoutput}${uptimeMinute}m:`}
	if(uptimeSekunde >= 1){uptimeoutput = `${uptimeoutput}${uptimeSekunde}s`}
	return uptimeoutput;
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