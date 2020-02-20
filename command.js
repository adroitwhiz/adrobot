const specialFunctions = {
	previousMessage: message => {
		return message.channel.fetchMessages({limit: 1, before: message.id}).then(messages => {
			return messages.last();
		});
	},
	commands: (message, specials) => Promise.resolve(specials.commands),
	prefix: (message, specials) => Promise.resolve(specials.prefix)
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
		const specialResults = {};
		const specialPromises = [];

		if (this.specials) {
			for (const special of this.specials) {
				if (!specialFunctions.hasOwnProperty(special)) throw new Error(`Unknown special: ${special}`);
				specialPromises.push(specialFunctions[special](inputMessage, specialInputs)
					.then(result => {
						specialResults[special] = result;
					}));
			}
		}

		return Promise.all(specialPromises).then(() => {
			this.commandFunction(inputMessage, outputChannel, config, specialResults);
		});
	}
}

module.exports = Command;
