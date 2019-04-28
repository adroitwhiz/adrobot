module.exports = {
	initialize:() => {
		return Promise.resolve({
			commandFunction:(inputMessage, outputChannel, config) => {
				outputChannel.send("pong");
			},
			
			name:"pong",
			helpString:"if u pong it pong",
			configDirectory:"config",
			defaultConfig:"default.json"
		})
	}
}
