require('dotenv').config();
const express = require('express');
const fs = require('fs');
var Time_started = new Date().getTime();
const UpdownClient = require('node-updown')
const Sender = require('../lib/Sender')

const client = new UpdownClient.UpdownClient(process.env.UpdownIO_Key);

const PluginName = "UpDownIO";
const PluginRequirements = [];
const PluginVersion = "0.0.1";
const PluginAuthor = "BolverBlitz";
const PluginDocs = "Privat";

function groupBy(arr, property) {
	return arr.reduce(function(memo, x) {
	  if (!memo[x[property]]) { memo[x[property]] = []; }
	  memo[x[property]].push(x);
	  return memo;
	}, {});
  }

if(!fs.existsSync(`${process.env.Plugin_DB}/${PluginName}_Status.json`)){
	CreateNewDB()
}

function Check(){
		try {
			OldStatus = JSON.parse(fs.readFileSync(`${process.env.Plugin_DB}/${PluginName}_Status.json`));

			client.getChecks().then(Checks => {
				let nowUP = [];
				let nowDOWN = [];
				let ChecksSplit = groupBy(Checks, 'down')
				ChecksSplit.false.map(Monitor => {
					nowUP.push(Monitor.token);
				})
				ChecksSplit.true.map(Monitor => {
					nowDOWN.push(Monitor.token);
				})
				
				let dUP = nowUP.filter(x => !OldStatus.Online.includes(x));
				let dDown = nowDOWN.filter(x => !OldStatus.Offline.includes(x));
		
				OldStatus.Online = nowUP;
				OldStatus.Offline = nowDOWN;
		
				let NewJson = JSON.stringify(OldStatus);
				fs.writeFile(`${process.env.Plugin_DB}/${PluginName}_Status.json`, NewJson, (err) => {if (err) console.log(err);});
		
				let Message_Twitter = [];
				let Message_Kanal = [];
		
				Checks.map(Check => {
					if(OldStatus.Twitter.includes(Check.token)){
						if(dUP.includes(Check.token)){
							Message_Twitter.push(`The Monitor ${Check.alias} is up again.\nThe Uptime now is ${Check.uptime}`)
						}else if(dDown.includes(Check.token)){
							Message_Twitter.push(`The Monitor ${Check.alias} is down since ${Check.down_since}.\nReason: ${Check.error}`)
						}
					}
					
					if(OldStatus.Kanal.includes(Check.token)){
						if(dUP.includes(Check.token)){
							Message_Kanal.push(`The Monitor ${Check.alias} is up again.\nThe Uptime now is ${Check.uptime}`)
						}else if(dDown.includes(Check.token)){
							Message_Kanal.push(`The Monitor ${Check.alias} is down since ${Check.down_since}.\nReason: ${Check.error}`)
						}
					}
				})
				if(Message_Kanal.length > 0){Sender.pushTelegram(Message_Kanal.join("\n\n"))}
				if(Message_Twitter.length > 0){Sender.pushTweet(Message_Twitter.join("\n\n"))}
			});
		} catch (e) {
			CreateNewDB();
		}
}

//Check()

setInterval(function(){
	Check();
}, 1*5000+50);

function CreateNewDB(){
	let CleanDB = {"Online":[],"Offline":[],"Twitter":["ujvb","rhir","8702","l5tb","i2uo","i6ns","tioa","xiov"],"Kanal":["ujvb","rhir","8702","l5tb","i2uo","i6ns","tioa","xiov"]}
	
	client.getChecks().then(Checks => {
		let ChecksSplit = groupBy(Checks, 'down')
		ChecksSplit.false.map(Monitor => {
			CleanDB.Online.push(Monitor.token)
		})
		ChecksSplit.true.map(Monitor => {
			CleanDB.Offline.push(Monitor.token)
		})

		let NewJson = JSON.stringify(CleanDB);
		fs.writeFile(`${process.env.Plugin_DB}/${PluginName}_Status.json`, NewJson, (err) => {if (err) console.log(err);});
		console.log(`[API.Plugins] [${PluginName}] created DB`)
	})
}

const router = express.Router();

module.exports = {
	router: router,
	PluginName: PluginName,
	PluginRequirements: PluginRequirements,
	PluginVersion: PluginVersion,
	PluginAuthor: PluginAuthor,
	PluginDocs: PluginDocs
  };