require('dotenv').config();
const fs = require('fs');
const axios = require('axios')

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
			bot.sendMessage(AppsJ.TelegramChatId, Msg, { parseMode: 'html' , webPreview: false}).catch(error => console.log('Error:', error));
		}else{
			if(ConfJ.MuteUntil < Date.now()){
				ConfJ.Mute = false;
				bot.sendMessage(AppsJ.TelegramChatId, Msg, { parseMode: 'html' , webPreview: false}).catch(error => console.log('Error:', error));
                console.log(`Telegram: ${Msg}`)
				let NewJson = JSON.stringify(ConfJ);
				fs.writeFile(`${process.env.Admin_DB}/UpDownConfig.json`, NewJson, (err) => {if (err) console.log(err);});
			}
		}
	}
}

/**
 * Will send a given string with discord parsing
 * Loads from UpDownConfig and will handle the mute function
 * @param {String} Msg 
 */
 function pushDiscord(Msg){
    return new Promise(function(resolve, reject) {
        if(fs.existsSync(`${process.env.Admin_DB}/UpDownServices.json`) && fs.existsSync(`${process.env.Admin_DB}/UpDownConfig.json`)){
            let ConfJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownConfig.json`));
            if(!ConfJ.Mute){
                axios
                    .post(process.env.Discord_Webhook, {
                        content: Msg
                    })
                    .then(res => {
                        resolve(res)
                    })
                    .catch(error => {
                        console.error(error)
                    })
            }else{
                if(ConfJ.MuteUntil < Date.now()){
                    ConfJ.Mute = false;
                        axios
                        .post(process.env.Discord_Webhook, {
                            content: Msg
                        })
                        .then(res => {
                            resolve(res)
                        })
                        .catch(error => {
                            console.error(error)
                        })
                    console.log(`Discord: ${Msg}`)
                    let NewJson = JSON.stringify(ConfJ);
                    fs.writeFile(`${process.env.Admin_DB}/UpDownConfig.json`, NewJson, (err) => {if (err) console.log(err);});
                }
            }
        }
    });
}


module.exports = {
	pushTelegram,
    pushDiscord
  };