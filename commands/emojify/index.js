const fs = require("fs").promises,
      path = require("path"),
      _ = require("lodash");

const appUtils = require("common/app-utils.js");

const dataFolder = "data";
var staticConfig;

module.exports = {
	initialize:() => {
		return fs.readFile(path.join(__dirname, dataFolder, "baseconf.json"), {encoding:"utf8"}).then(contents => {
			staticConfig = JSON.parse(contents);
		}).then(() => {
			return fs.readFile(path.join(__dirname, dataFolder, staticConfig.replacementsFile), {encoding:"utf8"});
		}).then(replacementsFile => {
			const replacements = JSON.parse(replacementsFile);
			
			return {
				commandFunction:(inputMessage, outputChannel, config, specialResults) => {
					let inputText = appUtils.parseCommand(inputMessage.content, {splitSpaces:false})[0];
					
					if (!inputText.length > 0) {
						inputText = specialResults.previousMessage.content;
					}
					
					outputChannel.send(_.deburr(inputText.toLowerCase()).split("").map(char => replacements.hasOwnProperty(char) ? replacements[char] : char).join(""));
				},
				
				name:"emojify",
				helpString:"Converts the previous message, or a message you provide, into emojis",
				configDirectory:"config",
				defaultConfig:"default.json",
				specials:["previousMessage"]
			}
		})
		return Promise.resolve()
	}
}
