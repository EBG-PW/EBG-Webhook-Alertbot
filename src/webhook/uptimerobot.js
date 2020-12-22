require('dotenv').config();
const express = require('express');
const fs = require('fs');
var Time_started = new Date().getTime();

const Telebot = require('telebot');
const bot = new Telebot({
	token: process.env.Telegram_Bot_Token,
	limit: 1000,
        usePlugins: ['commandButton']
});


const PluginName = "UptimeRobot";
const PluginRequirements = [];
const PluginVersion = "0.0.2";
const PluginAuthor = "BolverBlitz";
const PluginDocs = "Privat";

if(!fs.existsSync(`${process.env.Plugin_DB}/Routs_${PluginName}.json`)){
	const CleanDB = {"ChatID":[],"ChatName":[],"ChatToken":[]}
	let NewJson = JSON.stringify(CleanDB);
	fs.writeFile(`${process.env.Plugin_DB}/Routs_UptimeRobot.json`, NewJson, (err) => {if (err) console.log(err);});
	console.log(`[API.Plugins] [${PluginName}] created DB`)
}

const router = express.Router();

router.get("/", (reg, res) => {
    res.status(401)
    res.json({message: "Application Token is needed!"});
});

router.get("/:Token", (reg, res) => {
	if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`) && fs.existsSync(`${process.env.Plugin_DB}/Routs_${PluginName}.json`)) {
		var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
		var UptimeRobotJson = JSON.parse(fs.readFileSync(`${process.env.Plugin_DB}/Routs_${PluginName}.json`));
		if(UptimeRobotJson["ChatToken"].includes(reg.params.Token)){
			let indexChatToken = UptimeRobotJson["ChatToken"].indexOf(reg.params.Token);
			let ChatID = UptimeRobotJson["ChatID"][indexChatToken];

			let MonitorNameSplit = reg.query.monitorFriendlyName.split(' ')
			if(AdminJson["AdminsName"].includes(MonitorNameSplit[1])){
				let indexAdminsName = AdminJson["AdminsName"].indexOf(MonitorNameSplit[1]);
				let UserID = AdminJson["Admins"][indexAdminsName];
				var Mention = `<a href="tg://user?id=${UserID}">​</a>`
			}else{
				var Mention = "";
				for (i = 0; i < AdminJson["AdminsName"].length; i++) {
					Mention += `<a href="tg://user?id=${AdminJson["Admins"][i]}">​</a>`
				}
			}
			if(!reg.query.alertDuration){
				bot.sendMessage(ChatID, `The screen ${reg.query.monitorFriendlyName} is ${reg.query.alertTypeFriendlyName}\n${Mention}`, { parseMode: 'html' , webPreview: false})
			}else{
				bot.sendMessage(ChatID, `The screen ${reg.query.monitorFriendlyName} is ${reg.query.alertTypeFriendlyName}\n\nThe screen was for ${reg.query.alertFriendlyDuration} down!\n${Mention}`, { parseMode: 'html' , webPreview: false})
			}
			res.status(200)
			res.json({message: "Working"});
		}else{
			res.status(403)
			res.json({message: "Application Token is invalid!"});
		}
	}
});

module.exports = {
	router: router,
	PluginName: PluginName,
	PluginRequirements: PluginRequirements,
	PluginVersion: PluginVersion,
	PluginAuthor: PluginAuthor,
	PluginDocs: PluginDocs
  };