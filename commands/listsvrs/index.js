const fs = require("fs").promises,
      path = require("path"),
      _ = require("lodash");

const dataFolder = "data";


module.exports = {
	initialize:() => {
		return Promise.resolve().then(() => {
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
