const mzfs = require("mz/fs"),
      path = require("path");

const dataFolder = "data";

module.exports = {
	initialize:() => {
		return mzfs.readFile(path.join(__dirname, dataFolder, "bees.txt"), "utf8").then(contents => {
			
			const beeList = contents.split("\n");
			
			return {
				commandFunction:(inputMessage, outputChannel, config) => {
					outputChannel.send(beeList[Math.floor(Math.random() * beeList.length)]);
				},
				
				name:"bees",
				helpString:"Bees",
				configDirectory:"config",
				defaultConfig:"default.json"
			}
		})
	}
}
