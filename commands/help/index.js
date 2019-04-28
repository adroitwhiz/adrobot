const mzfs = require("mz/fs"),
      strTemplate = require("string-template"),
      _ = require("lodash"),
      path = require("path");

const dataFolder = "data"


module.exports = {
	initialize:() => {
		return mzfs.readFile(path.join(__dirname, dataFolder, "baseconf.json")).then(contents => JSON.parse(contents)).then(staticConfig => {
			return {
				commandFunction:(inputMessage, outputChannel, config, specialResults) => {
					outputChannel.send(
						Array.from(specialResults.commands.values()).map(command => strTemplate(staticConfig.helpStringTemplate, {
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
