const Promise = require('bluebird');

const specialFunctions = {
	previousMessage: message => {
		return message.channel.fetchMessages({limit: 1, before: message.id}).then(messages => {
			return messages.last();
		});
	},
	commands: (message, specials) => specials.commands,
	prefix: (message, specials) => specials.prefix
};

class Command {
	constructor(options) {
		this.commandFunction = options.commandFunction;
		this.name = options.name;
		this.helpString = options.helpString || null;
		this.advancedHelpString = options.advancedHelpString || null;
		this.hidden = options.hidden;
		this.specials = options.specials || [];
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

		return Promise.props(specialPromises).then(specialResults => {
			this.commandFunction(inputMessage, outputChannel, config, specialResults);
		});
	}
}

module.exports = Command;
