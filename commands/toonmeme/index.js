const fs = require("fs").promises,
      path = require("path"),
      _ = require("lodash");

const dataFolder = "data";
var staticConfig = toonMemeList = null;


module.exports = {
	initialize:() => {
		return fs.readFile(path.join(__dirname, dataFolder, "baseconf.json")).then(contents => {staticConfig = JSON.parse(contents)}).then(() => {
			return fs.readdir(path.join(__dirname, dataFolder, staticConfig.toonMemeFolder))
		}).then(files => {
			staticConfig.toonMemeFiles = files.map(filename => path.join(__dirname, dataFolder, staticConfig.toonMemeFolder, filename));
		}).then(() => {
			return {
				commandFunction:(inputMessage, outputChannel, config) => {
					outputChannel.send("", {files:[_.sample(staticConfig.toonMemeFiles)]});
				},
				name:"toonmeme",
				helpString:"Serves up a fresh toon meme",
				configDirectory:"config",
				defaultConfig:"default.json"
			}
		});
	}
}
