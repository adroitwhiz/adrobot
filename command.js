const Promise = require("bluebird");

const specialFunctions = {
	previousMessage:message => {
		const messageArray = message.channel.messages.array(),
		      messageIndex = messageArray.findIndex(item => item.id === message.id) - 1;
		
		return message.channel.fetchMessages({limit:1, before:message.id}).then(messages => {
			return messages.last();
		})
	},
	commands:(message, specials) => {
		return Promise.resolve(specials.commands);
	}
}

class Command { //probably not necessary by any stretch of the imagination
	constructor(options) {
		this.commandFunction = options.commandFunction;
		this.name = options.name;
		this.helpString = options.helpString || null;
		this.hidden = options.hidden;
		this.specials = options.specials || [];
		this._commandLocation = options._commandLocation;
		this.configDirectory = options.configDirectory;
	}
	
	run(inputMessage, outputChannel, config, specialInputs) {
		const specialPromises = {};
		
		if (this.specials) {
			this.specials.forEach(special => {
				if (specialFunctions.hasOwnProperty(special)) {
					specialPromises[special] = specialFunctions[special](inputMessage, specialInputs);
				}
			});
		}
		
		Promise.props(specialPromises).then(specialResults => {
			this.commandFunction(inputMessage, outputChannel, config, specialResults);
		});
	}
}

module.exports = Command;
