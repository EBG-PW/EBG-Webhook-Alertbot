require('dotenv').config();
const f = require('./lib/Funktions');
const OS = require('./lib/Hardware');
const ping = require('ping');
const package = require('../package');
const fs = require('fs');
const randomstring = require('randomstring');
const request = require("request");
const Sender = require('./lib/Sender')

const Telebot = require('telebot');
const bot = new Telebot({
	token: process.env.Telegram_Bot_Token,
	limit: 1000,
        usePlugins: ['commandButton']
});

let NewPushStore = [];
let Time_started = new Date().getTime();

/* Route Managing List|Add|Remove*/

bot.on(/^\/listRoutes( .+)*/i, (msg, props) => {
	if(msg.from.id === msg.chat.id || msg.chat.id === -1001428173160){
		let URL = `http://${process.env.IP}:${process.env.PORT}/webhook`
		request(URL, { json: true }, (err, res, body) => {
			let CheckAtributes = AtrbutCheck(props);
			if(!CheckAtributes.hasAtributes){
					let LoadedRoutes = "";
					for(i in body.plugins){
						LoadedRoutes = `${LoadedRoutes}${body.plugins[i].name}\n`
					}
					msg.reply.text(`Geladene Plugins:\n${LoadedRoutes}\nBitte /listRoutes <Plugin Name> nutzen.`)
			}else{
				let plugin = CheckAtributes.atributes[0];
				//Get all loaded Plugins
				LoadedPlugins = [];
				for(i in body.plugins){
					LoadedPlugins.push(body.plugins[i].name.toLowerCase());
				}
				if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`) && fs.existsSync(`${process.env.Plugin_DB}/Routs_${plugin}.json`)) {
					var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
					var UptimeRobotJson = JSON.parse(fs.readFileSync(`${process.env.Plugin_DB}/Routs_${plugin}.json`));
					if(AdminJson["Admins"].includes(msg.from.id) && LoadedPlugins.includes(plugin.toLowerCase())){
						let LoadedRoutes = "";
						for(let i=0; i <= UptimeRobotJson.ChatID.length - 1; i++){
							LoadedRoutes = `${LoadedRoutes}${UptimeRobotJson.ChatName[i]}(${UptimeRobotJson.ChatID[i]})\n<pre language="c++">${UptimeRobotJson.ChatToken[i]}</pre>\n`
						}
						msg.reply.text(`${UptimeRobotJson.ChatID.length} geladene Routen im Plugin ${plugin}:\n\n${LoadedRoutes}`, { parseMode: 'html' , webPreview: false})
					}else{
						msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
					}
				}else{
					console.log(`Please check if ${process.env.Admin_DB}/Admins.json and ${process.env.Plugin_DB}/Routs_${plugin}.json exists.`)
					msg.reply.text(`Es gibt kein Plugin namens ${plugin} oder es fehlenden Dateien...`);
				}
			}
		});
	}else{
		msg.reply.text(`Das kann nur in einem <i>PRIVATEM</i> Chat oder <i>LANTalk Managment</i> genutzt werden!`, { parseMode: 'html' , webPreview: false})
	}
});

bot.on(/^\/routes( .+)*/i, (msg, props) => {
	let CheckAtributes = AtrbutCheck(props);
	if(!CheckAtributes.hasAtributes){
		let URL = `http://${process.env.IP}:${process.env.PORT}/webhook`
		request(URL, { json: true }, (err, res, body) => {
			let LoadedRoutes = "";
			for(i in body.plugins){
				LoadedRoutes = `${LoadedRoutes}${body.plugins[i].name}\n`
			}
			msg.reply.text(`Syntax: /routes <add|remove> <Modulname>\n- Add gibt diesem Chat eine Route\n- Remove entfernt die Route dieses Chats\nGeladene Modul sind:\n${LoadedRoutes}Beispiel Befehl:\n/routes add ${body.plugins[0].name}\nDas erstellt eine Route für das Modul ${body.plugins[0].name} mit der ChatID dieses Chats.`)
		});
	}else{
		let AvaibleModes = ['add','remove','rem']
		LoadedPlugins = [];
		let URL = `http://${process.env.IP}:${process.env.PORT}/webhook`
		request(URL, { json: true }, (err, res, body) => {
			for(i in body.plugins){
				LoadedPlugins.push(body.plugins[i].name.toLowerCase());
			}
			let plugin = CheckAtributes.atributes[1];
			let mode = CheckAtributes.atributes[0].toLowerCase();
			if(AvaibleModes.includes(mode)){
				if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`) && fs.existsSync(`${process.env.Plugin_DB}/Routs_${plugin}.json`)) {
					var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
					var UptimeRobotJson = JSON.parse(fs.readFileSync(`${process.env.Plugin_DB}/Routs_${plugin}.json`));
					if(AdminJson["Admins"].includes(msg.from.id) && LoadedPlugins.includes(plugin.toLowerCase())){
						//User is Admin and Plugin exists!
						if(mode === "add"){
							if(UptimeRobotJson["ChatID"].includes(msg.chat.id)){
								msg.reply.text(`Chat hat schon eine ID`);
							}else{
								var RString = randomstring.generate({
									length: 32,
									charset: 'hex'
								});
								if(msg.chat.title == null){
									var ChatTitle = msg.chat.id
								}else{
									var ChatTitle = msg.chat.title
								}
								UptimeRobotJson["ChatID"].push(msg.chat.id);
								UptimeRobotJson["ChatName"].push(ChatTitle);
								UptimeRobotJson["ChatToken"].push(RString);

								let NewJson = JSON.stringify(UptimeRobotJson);
								msg.reply.text(`Der Chat ${msg.chat.title}(${msg.chat.id}) hat nun eine Route.`);
								bot.sendMessage(msg.from.id, `Der Key für ${msg.chat.title}(${msg.chat.id}) lautet:\n<pre language="c++">${RString}</pre>\n\nBeispiel:\n<pre language="c++">${process.env.ProxyDomain}/webhook/${plugin}/${RString}</pre>`, { parseMode: 'html' , webPreview: false}).catch(function(error) {
									msg.reply.text(`!--- ACHTUNG ---!\n\nIch konnte dir den Key leider nicht persönlich zustellen :(\nBitte schreibe mich privat an!\nUm an den Key zu kommen mach bitte /listRoutes`)
								})
								fs.writeFile(`${process.env.Plugin_DB}/Routs_UptimeRobot.json`, NewJson, (err) => {if (err) console.log(err);});
							}
						}else if(mode === "remove" || mode === "rem"){
							if(UptimeRobotJson["ChatID"].includes(msg.chat.id)){
								let index = UptimeRobotJson["ChatID"].indexOf(msg.chat.id);
								if (index > -1) {
									UptimeRobotJson["ChatToken"].splice(index, 1);
								}
								if(msg.chat.title == null){
									var ChatTitle = msg.chat.id
								}else{
									var ChatTitle = msg.chat.title
								}
								removeItemFromArrayByName(UptimeRobotJson["ChatID"], msg.chat.id)
								removeItemFromArrayByName(UptimeRobotJson["ChatName"], ChatTitle)
								let NewJson = JSON.stringify(UptimeRobotJson);
								msg.reply.text(`Die Route vom Chat ${msg.chat.title}(${msg.chat.id}) wurde entfernt!`);
								fs.writeFile(`${process.env.Plugin_DB}/Routs_UptimeRobot.json`, NewJson, (err) => {if (err) console.log(err);});
							}else{
								msg.reply.text(`Dieser Chat hat keine Route!`);
							}
						}
					}else{
						msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
					}
				}else{
					console.log(`Please check if ${process.env.Admin_DB}/Admins.json and ${process.env.Plugin_DB}/Routs_${plugin}.json exists.`)
					msg.reply.text(`Es gibt kein Plugin namens ${plugin} oder es fehlenden Dateien...`);
				}
			}else{
				msg.reply.text(`Unbekannter Parameter ${CheckAtributes.atributes[1]}!\nBitte nutze ${AvaibleModes}.`);
			}
		})
	}
});	

/* -- Create Notifications for TG and Twitter -- */
bot.on(/^\/newPush/i, (msg) => {
	var keyID = 'Admins';
	if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
		let AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
		
		if(AdminJson[keyID].includes(msg.from.id)){
			NewPushStore.push(msg.from.id)
			bot.sendMessage(msg.chat.id, 'Was soll die Nachricht sein? (260 Zeichen)');
		}else{
			msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
		}
	}else{
		msg.reply.text(`Es gibt noch keine Admins...`);
	}
});

bot.on('text', msg => {
	if(NewPushStore.includes(msg.from.id)){
		if(msg.text !== "/newPush"){
			if(msg.text.length > 260){
				bot.sendMessage(msg.chat.id, `Die Nachricht ist zu lang (${msg.text.length})`);
			}else{
				const replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('Information', {callback: 'nP_info'}),
						bot.inlineButton('Störung', {callback: 'nP_stör'})
					]
				]);
				removeItemFromArrayByName(NewPushStore, msg.from.id)
				bot.sendMessage(msg.chat.id, `Ist diese Nachricht eine Information oder eine Störung?\n\n${msg.text}`, {replyMarkup});
			}
		}
	}
});

/* -- Mute the  automatet Alerts-- */
bot.on(/^\/mute/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id).catch((error) => {
		console.error(error);
	});

	let replyMarkup, MSG;
	var keyID = 'Admins';

	if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
		var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
	}else{
		msg.reply.text(`Es gibt noch keine Admins...`);
	}

	if(AdminJson[keyID].includes(msg.from.id)){
		if(fs.existsSync(`${process.env.Admin_DB}/UpDownConfig.json`)){
			let ConfJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownConfig.json`));
			if(ConfJ.Mute === true){
				MSG = `Der Kanal ist noch bis ${new Date(ConfJ.MuteUntil).toLocaleTimeString('de-DE')} gemutet, möchtest du Ihn entmuten?`
				replyMarkup = bot.inlineKeyboard([[
						bot.inlineButton('Unmute', {callback: 'm_mute'})
					],[
						bot.inlineButton('Schließen', {callback: 'm_delete'}),
					]
				]);
			}else{
				MSG = `Wie lange möchtest du den Kanal muten?`
				replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('10 Minuten', {callback: 'm_1'}),
						bot.inlineButton('1 Stunde', {callback: 'm_2'}),
						bot.inlineButton('1 Tag', {callback: 'm_3'})
					],[
						bot.inlineButton('Schließen', {callback: 'm_delete'}),
					]
				]);
			}
			bot.sendMessage(msg.chat.id, MSG, {replyMarkup});
		}else{
			bot.sendMessage(msg.chat.id, `Fehler: Die Config konnte nicht gefunden werden.`);
		}
	}else{
		msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
	}
});

/* -- Admin Managing List|Add|Remove -- */
bot.on(/^\/listAdmin/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));
	var keyID = 'Admins';
	var keyName = 'AdminsName';
	if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
		var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
	}else{
		msg.reply.text(`Es gibt noch keine Admins...`);
	}
	if(AdminJson[keyID].includes(msg.from.id)){
		let MessageAdmins = "Liste der Admins:\n\n";
		for (i = 0; i < AdminJson[keyID].length; i++) {
			MessageAdmins = MessageAdmins + `${AdminJson[keyName][i]}(${AdminJson[keyID][i]})\n`
		}
		msg.reply.text(`${MessageAdmins}`)
	}else{
		msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
	}
});

bot.on(/^\/addAdmin/i, (msg) => {
		bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));
		if ('reply_to_message' in msg) {
			var UserID = msg.reply_to_message.from.id
			if ('username' in msg.reply_to_message.from) {
				var username = msg.reply_to_message.from.username.toString();
			}else{
				var username = msg.reply_to_message.from.first_name.toString();
			}

			var keyID = 'Admins';
			var keyName = 'AdminsName';
			if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
				var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
			}else{
				console.log("No Admins file found!")
				var AdminJson = {}
				AdminJson[keyID] = [];
				AdminJson[keyName] = [];
			}
			if(AdminJson[keyID].includes(msg.from.id)){
				if(UserID === 777000 || UserID === 1087968824){
					msg.reply.text(`${username}(${UserID}) dieser Nutzer darf kein Admin sein!`);
				}else{
					if(AdminJson[keyID].includes(UserID)){
						msg.reply.text(`${username}(${UserID}) ist bereits Admin!`);
					}else{
						AdminJson[keyID].push(UserID);
						AdminJson[keyName].push(username);

						let NewJson = JSON.stringify(AdminJson);
						msg.reply.text(`${username}(${UserID}) ist nun Admin!`);
						fs.writeFile(`${process.env.Admin_DB}/Admins.json`, NewJson, (err) => {if (err) console.log(err);});
					}
				}
			}else{
				msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
			}
	}else{
		msg.reply.text(`Fehler: Das kann nur als Antwort auf einen anderen Benutzer verwendet werden!`);
	}
});

bot.on(/^\/remAdmin/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));
	if ('reply_to_message' in msg) {
		var UserID = msg.reply_to_message.from.id
		if ('username' in msg.reply_to_message.from) {
			var username = msg.reply_to_message.from.username.toString();
		}else{
			var username = msg.reply_to_message.from.first_name.toString();
		}
		var keyID = 'Admins';
		var keyName = 'AdminsName';
		if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
			var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
		}else{
			msg.reply.text(`Es gibt noch keine Admins...`);
		}
		if(AdminJson[keyID].includes(msg.from.id)){
			removeItemFromArrayByName(AdminJson[keyID], UserID)
			removeItemFromArrayByName(AdminJson[keyName], username)

			let NewJson = JSON.stringify(AdminJson);
					msg.reply.text(`${username}(${UserID}) ist nun KEIN Admin mehr!`);
					fs.writeFile(`${process.env.Admin_DB}/Admins.json`, NewJson, (err) => {if (err) console.log(err);});
		}else{
			msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
		}
	}else{
		msg.reply.text(`Fehler: Das kann nur als Antwort auf einen anderen Benutzer verwendet werden!`);
	}
});

/* User Managing List|Add|Remove */
/* Users will also be notifyed if thery name is in the screen name */
/* Users are behind Admins in priority, a userID should never be Admin AND User */
bot.on(/^\/listUser/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));
	var keyID = 'User';
	var keyName = 'UserName';
	if(fs.existsSync(`${process.env.Admin_DB}/User.json`) && fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
		var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
		var UserJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/User.json`));
	}else{
		msg.reply.text(`Es gibt noch keine User...`);
	}
	if(AdminJson['Admins'].includes(msg.from.id)){
		let MessageAdmins = "Liste der User:\n\n";
		for (i = 0; i < UserJson[keyID].length; i++) {
			MessageAdmins = MessageAdmins + `${UserJson[keyName][i]}(${UserJson[keyID][i]})\n`
		}
		msg.reply.text(`${MessageAdmins}`)
	}else{
		msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
	}
});

bot.on(/^\/addUser/i, (msg) => {
		bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));
		if ('reply_to_message' in msg) {
			var UserID = msg.reply_to_message.from.id
			if ('username' in msg.reply_to_message.from) {
				var username = msg.reply_to_message.from.username.toString();
			}else{
				var username = msg.reply_to_message.from.first_name.toString();
			}

			var keyID = 'User';
			var keyName = 'UserName';
			if(fs.existsSync(`${process.env.Admin_DB}/User.json`) && fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
				var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
				var UserJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/User.json`));
			}else{
				console.log("No User file found!")
				var UserJson = {}
				UserJson[keyID] = [];
				UserJson[keyName] = [];
			}
			if(AdminJson['Admins'].includes(msg.from.id)){
				if(UserID === 777000 || UserID === 1087968824){
					msg.reply.text(`${username}(${UserID}) dieser Nutzer darf kein User sein!`);
				}else{
					if(UserJson[keyID].includes(UserID)){
						msg.reply.text(`${username}(${UserID}) ist bereits User!`);
					}else{
						UserJson[keyID].push(UserID);
						UserJson[keyName].push(username);

						let NewJson = JSON.stringify(UserJson);
						msg.reply.text(`${username}(${UserID}) ist nun User!`);
						fs.writeFile(`${process.env.Admin_DB}/User.json`, NewJson, (err) => {if (err) console.log(err);});
					}
				}
			}else{
				msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
			}
	}else{
		msg.reply.text(`Fehler: Das kann nur als Antwort auf einen anderen Benutzer verwendet werden!`);
	}
});

bot.on(/^\/remUser/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error: (delMessage)', error.description));
	if ('reply_to_message' in msg) {
		var UserID = msg.reply_to_message.from.id
		if ('username' in msg.reply_to_message.from) {
			var username = msg.reply_to_message.from.username.toString();
		}else{
			var username = msg.reply_to_message.from.first_name.toString();
		}
		var keyID = 'User';
		var keyName = 'UserName';
		if(fs.existsSync(`${process.env.Admin_DB}/User.json`) && fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
			var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
			var UserJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/User.json`));
		}else{
			msg.reply.text(`Es gibt noch keine User...`);
		}
		if(AdminJson['Admins'].includes(msg.from.id)){
			removeItemFromArrayByName(UserJson[keyID], UserID)
			removeItemFromArrayByName(UserJson[keyName], username)

			let NewJson = JSON.stringify(UserJson);
					msg.reply.text(`${username}(${UserID}) ist nun KEIN User mehr!`);
					fs.writeFile(`${process.env.Admin_DB}/User.json`, NewJson, (err) => {if (err) console.log(err);});
		}else{
			msg.reply.text(`Du musst Admin sein um dies zu nutzen!`);
		}
	}else{
		msg.reply.text(`Fehler: Das kann nur als Antwort auf einen anderen Benutzer verwendet werden!`);
	}
});

/*Standart funktions Start|Alive|Help*/
bot.on(/^\/alive/i, (msg) => {
	OS.Hardware.then(function(Hardware) {
		let Output = "";
		Output = Output + '\n- CPU: ' + Hardware.cpubrand + ' ' + Hardware.cpucores + 'x' + Hardware.cpuspeed + ' Ghz';
		Output = Output + '\n- Load: ' + f.Round2Dec(Hardware.load);
		Output = Output + '%\n- Memory Total: ' + f.Round2Dec(Hardware.memorytotal/1073741824) + ' GB'
		Output = Output + '\n- Memory Free: ' + f.Round2Dec(Hardware.memoryfree/1073741824) + ' GB'
		ping.promise.probe('api.telegram.org').then(function (ping) {
			msg.reply.text(`Botname: ${package.name}\nVersion: ${package.version}\nPing: ${ping.avg}ms\n\nUptime: ${f.uptime(Time_started)}\n\nSystem: ${Output}`).then(function(msg)
			{
				setTimeout(function(){
				bot.deleteMessage(msg.chat.id,msg.message_id).catch(error => f.Elog('Error (deleteMessage):' + error.description));
				}, 25000);
            });
            bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error (deleteMessage):' + error.description));
		});
	});
});

bot.on(/^\/help/i, (msg) => {
	if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
		var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
	}else{
		msg.reply.text(`Es gibt noch keine Admins...`);
	}
	if(AdminJson["Admins"].includes(msg.from.id)){
		msg.reply.text(`Befehle für Nutzer:\n/help - Zeigt diese Nachricht\n/alive - Zeigt den Bot Status\n\nBefehle für Admins:\n/listRoutes - Zeigt alle Plugins und beispiel\n/listRoutes <Plugin Name> - Zeigt alle Routs\n/routes - Zeigt Hilfe für diesen Befehl\n/routes add|rem <Pluginname> - Erstellt/Löscht Route für Chat\n/mute - Um den Status Kanal zu muten/unmuten\n/newPush - Um einen neuen EBG-Post auf Twitter und dem TG Kanel zu senden\n/listAdmin - Zeigt alle Admins\n/addAdmin - Fügt Nutzer als Admin hinzu\n/remAdmin - Nimmt dem Nutzer Admin weg\n/listUser - Zeigt alle User\n/addUser - Fügt Nutzer als User hinzu\n/remUser - Nimmt dem Nutzer User weg`)
	}else{
		msg.reply.text(`Befehle für Nutzer:\n/help - Zeigt diese Nachricht\n/alive - Zeigt den Bot Status`);
	}
});
/* -- Handle Bot -- */

bot.start();

/* -- Handle Querycallback --
bot.inlineButton('Information', {callback: 'nP_info'}),
bot.inlineButton('Störung', {callback: 'nP_stör'}),
bot.inlineButton('10 Minuten', {callback: 'm_1'}),
bot.inlineButton('Muten', {callback: 'm_mute'}),
*/

bot.on('callbackQuery', (msg) => {
	var keyID = 'Admins';
	if(fs.existsSync(`${process.env.Admin_DB}/Admins.json`)) {
		var AdminJson = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/Admins.json`));
	}else{
		msg.reply.text(`Es gibt noch keine Admins...`);
	}

	if(AdminJson[keyID].includes(msg.from.id)){
		if ('inline_message_id' in msg) {
			var inlineId = msg.inline_message_id;
		}else{
			var chatId = msg.message.chat.id;
			var messageId = msg.message.message_id;
		}

		let data = msg.data.split("_")
		let replyMarkup;
		
		if(data[0] === "nP")
		{
			let type;
			let Text = msg.message.text.replace("Ist diese Nachricht eine Information oder eine Störung?\n\n","");
			if(data[1] === "stör"){type = "‼️  Alert  ‼️\n"}else{type = "🌐  Info  🌐\n"}
			Text = `${type}${Text}`

			const replyMarkup = bot.inlineKeyboard([
				[
					bot.inlineButton('#Servers', {callback: 'h_Servers_0'}),
					bot.inlineButton('#vServers', {callback: 'h_vServers_0'}),
					bot.inlineButton('#Docker', {callback: 'h_Docker_0'}),
				],[
					bot.inlineButton('#Hardware', {callback: 'h_Hardware_0'}),
					bot.inlineButton('#Software', {callback: 'h_Software_0'}),
					bot.inlineButton('#Network', {callback: 'h_Network_0'}),
				],[
					bot.inlineButton('#Pterodactyl', {callback: 'h_Pterodactyl_0'}),
					bot.inlineButton('#Webserver', {callback: 'h_Webserver_0'})
				]
			]);

			if ('inline_message_id' in msg) {
				bot.editMessageText(
					{inlineMsgId: inlineId}, Text,
					{parseMode: 'html', webPreview: false, replyMarkup}
				).catch(error => console.log('Error:', error));
			}else{
				bot.editMessageText(
					{chatId: chatId, messageId: messageId}, Text,
					{parseMode: 'html', webPreview: false, replyMarkup}
				).catch(error => console.log('Error:', error));
			}
		}else if(data[0] === "h"){
			let Text = msg.message.text
			if(Number(data[2]) === 0){
				Text = `${Text}\n\n#${data[1]}`
			}else{
				Text = `${Text} #${data[1]}`
			}
			
			if(Number(data[2]) <= 2){
				replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('#Servers', {callback: `h_Servers_${data[2]+1}`}),
						bot.inlineButton('#vServers', {callback: `h_vServers_${data[2]+1}`}),
						bot.inlineButton('#Docker', {callback: `h_Docker_${data[2]+1}`}),
					],[
						bot.inlineButton('#Hardware', {callback: `h_Hardware_${data[2]+1}`}),
						bot.inlineButton('#Software', {callback: `h_Software_${data[2]+1}`}),
						bot.inlineButton('#Network', {callback: `h_Network_${data[2]+1}`}),
					],[
						bot.inlineButton('#Pterodactyl', {callback: `h_Pterodactyl_${data[2]+1}`}),
						bot.inlineButton('#Webserver', {callback: `h_Webserver_${data[2]+1}`})
					],[
						bot.inlineButton(`Senden (${Text.length})`, {callback: `Senden`})
					]
				]);
			}else{
				replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton(`Senden (${Text.length})`, {callback: `Senden`})
					]
				]);
			}

			if ('inline_message_id' in msg) {
				bot.editMessageText(
					{inlineMsgId: inlineId}, Text,
					{parseMode: 'html', webPreview: false, replyMarkup}
				).catch(error => console.log('Error:', error));
			}else{
				bot.editMessageText(
					{chatId: chatId, messageId: messageId}, Text,
					{parseMode: 'html', webPreview: false, replyMarkup}
				).catch(error => console.log('Error:', error));
			}

		}else if(data[0] === "Senden"){
			Promise.all([bot.sendMessage(process.env.Telegram_EBGKanal_ID, msg.message.text, { parseMode: 'html' , webPreview: false}), Sender.pushTweet(msg.message.text, true)]).then((data) => {
				//let MSG = `Telegram: https://t.me/${data[0].chat.username}/${data[0].message_id}\nTwitter: ${data[1].url}\n\nText:\n${msg.message.text}\n\nTwitter Stats:\nFollower: ${data[1].user.followers_count}\nLikes: ${data[1].favorite_count}\nRetweets: ${data[1].retweet_count}`
				let MSG = `Telegram: https://t.me/${data[0].chat.username}/${data[0].message_id}\nTwitter: ${data[1].url}\n\nText:\n${msg.message.text}`
				/*
				const replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton(`Aktualisieren`, {callback: `refresh_${data[1].id}`})
					]
				]);*/

				if ('inline_message_id' in msg) {
					bot.editMessageText(
						{inlineMsgId: inlineId}, MSG,
						{parseMode: 'html', webPreview: false}
					).catch(error => console.log('Error:', error));
				}else{
					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, MSG,
						{parseMode: 'html', webPreview: false}
					).catch(error => console.log('Error:', error));
				}
			});

		}else if(data[0] === "m"){
			if(data[1] === "delete"){
				bot.deleteMessage(chatId, messageId).catch((error) => {
					console.error(error);
				});
			}else{
				if(fs.existsSync(`${process.env.Admin_DB}/UpDownConfig.json`)){
					let TimeString, MSG;
					let ConfJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownConfig.json`));

					if(data[1] === "mute"){
						ConfJ.Mute = false;
						MSG = `Der Kanal wurde entmutet!`;
					}else{
						let TimeSpan;
						ConfJ.Mute = true;
						if(data[1] === "1"){TimeSpan = 10*60; TimeString = "10 Minuten";};
						if(data[1] === "2"){TimeSpan = 60*60; TimeString = "1 Stunde";};
						if(data[1] === "3"){TimeSpan = 24*60*60; TimeString = "1 Tag";};
						ConfJ.MuteUntil = Date.now() + TimeSpan*1000;
						MSG = `Der Kanal wurde bis ${new Date(ConfJ.MuteUntil).toLocaleTimeString('de-DE')} gemutet!\nDauer: ${TimeString}`;
					}

					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, MSG,
							{parseMode: 'html', webPreview: false}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, MSG,
							{parseMode: 'html', webPreview: false}
						).catch(error => console.log('Error:', error));
					}

					let NewJson = JSON.stringify(ConfJ);
					fs.writeFile(`${process.env.Admin_DB}/UpDownConfig.json`, NewJson, (err) => {if (err) console.log(err);});
				}	
			}
		}
	}else{
		bot.answerCallbackQuery(msg.id,{
			text: "Diese Funktion ist nur für Administratoren.",
			showAlert: true
		});
	}
});

/* -- Function -- */
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

function AtrbutCheck(props) {
	let input = props.match.input.split(' ')
	if(input[0].endsWith(process.env.Telegram_Bot_Botname)){
		let atributesWName = [];
		for(let i=1; i <= input.length - 1; i++){
			atributesWName.push(input[i])
		}
		if(atributesWName.length >= 1){
			return {hasAtributes: true, atributes: atributesWName}
		}else{
			return {hasAtributes: false}
		}
	}else{
		if(typeof(props.match[1]) === 'undefined'){
			return {hasAtributes: false}
		}else{
			let atributeOName = [];
			let input = props.match[1].split(' ')
			for(let i=1; i <= input.length - 1; i++){
				atributeOName.push(input[i])
			}
			return {hasAtributes: true, atributes: atributeOName}
		}
	}
}
