require('dotenv').config();
const fs = require('fs');

const Telebot = require('telebot');
const bot = new Telebot({
	token: process.env.Telegram_Bot_Token,
	limit: 1000,
        usePlugins: ['commandButton']
});

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

module.exports = {
	pushTelegram
  };