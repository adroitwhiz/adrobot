const fs = require("fs").promises,
      strTemplate = require("string-template"),
      _ = require("lodash"),
      path = require("path");

const dataFolder = "data"


module.exports = {
	initialize:() => {
		return fs.readFile(path.join(__dirname, dataFolder, "baseconf.json")).then(JSON.parse).then(staticConfig => {
			return {
				commandFunction:(inputMessage, outputChannel, config, specialResults) => {
					outputChannel.send(
						Array.from(specialResults.commands.values())
						.filter(command => command.hidden !== true)
						.map(command => strTemplate(staticConfig.helpStringTemplate, {
							commandName:command.name,
							commandHelpString:command.helpString || staticConfig.commandNoHelpString
						}))
						.join(staticConfig.helpStringJoin)
					)
				},
				name:"help",
				helpString:"Lets you know what each command does",
				configDirectory:"config",
				defaultConfig:"default.json",
				specials:["commands"]
			}
		});
	}
}
