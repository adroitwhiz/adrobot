const fs = require("fs").promises,
      path = require("path"),
      _ = require("lodash");

const dataFolder = "data";
var staticConfig = toonMemeList = null;


module.exports = {
	initialize:() => {
		return fs.readFile(path.join(__dirname, dataFolder, "baseconf.json")).then(contents => {staticConfig = JSON.parse(contents)}).then(() => {
			return {
				commandFunction:(inputMessage, outputChannel, config) => {
					inputMessage.author.sendMessage(client.guilds.array().map(item => item.name + ": " + item.id).join("\n"));
				},
				name:"listsvrs",
				helpString:"Lists servers",
				configDirectory:"config",
				defaultConfig:"default.json",
				hidden:true
			}
		});
	}
}
