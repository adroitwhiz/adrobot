class Command {
	constructor(options) {
		this.commandFunction = options.commandFunction;
		this.name = options.name;
		this.helpString = options.helpString || null;
		this.advancedHelpString = options.advancedHelpString || null;
		this.hidden = options.hidden;
		this.specials = new Set(options.specials);
	}

	run(outputChannel, config, specialInputs) {
		return this.commandFunction(outputChannel, config, specialInputs);
	}
}

module.exports = Command;
