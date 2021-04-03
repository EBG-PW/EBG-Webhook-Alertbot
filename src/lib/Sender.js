require('dotenv').config();
const fs = require('fs');

const Twitter = require('twitter');
var client = new Twitter({
    consumer_key: process.env.Twitter_APIKey,
    consumer_secret: process.env.Twitter_API_S,
    access_token_key: process.env.Twitter_AccesToken,
    access_token_secret: process.env.Twitter_AccesToken_S
  });

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

/**
 * Will send a html parsed string to twitter
 * Loads from UpDownConfig and will handle the mute function
 * @param {String} text 
 * @param {boolean} override
 * @returns {Promise}
 */
let pushTweet = function(text, override) {
	return new Promise(function(resolve, reject) {
        if(fs.existsSync(`${process.env.Admin_DB}/UpDownConfig.json`)){
            let ConfJ = JSON.parse(fs.readFileSync(`${process.env.Admin_DB}/UpDownConfig.json`));
            if(!ConfJ.Mute || override){
                client.post('statuses/update', {status: text}, function(error, tweet, response) {
                    if (!error) {
                        tweet.url = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
                        resolve(tweet);
                    }else{
                        console.log(error)
                        throw error;
                    }
                });
            }
        }
	});
}


module.exports = {
	pushTelegram,
    pushTweet
  };