const appUtils = require('../../common/app-utils.js');

module.exports = {
	command: () => {
		return {
			commandFunction: (inputMessage, outputChannel, config, specialResults) => {
				let helpCommand = appUtils.parseCommand(inputMessage.content, {splitSpaces: false});
				if (helpCommand) {
					// support both '-help -command' and '-help command'
					if (helpCommand.startsWith(specialResults.prefix)) {
						helpCommand = helpCommand.slice(specialResults.prefix.length);
					}

					if (specialResults.commands.has(helpCommand)) {
						const commandToHelpWith = specialResults.commands.get(helpCommand);
						return outputChannel.send(commandToHelpWith.advancedHelpString || 'Advanced help is not available for that command.');
					} else {
						return outputChannel.send('That command doesn\'t exist.');
					}

				} else {
					const helpHelpString = `Learn what the commands do. Try ${specialResults.prefix}help <command name> to learn more about what each command does.`;
					const helpEntries = [];
					for (const [commandName, command] of specialResults.commands) {
						const helpString = commandName === 'help' ? helpHelpString : command.helpString + '.';
						helpEntries.push(`${commandName}: ${helpString}`);
					}

					return outputChannel.send(helpEntries.join('\n'));
				}
			},

			name: 'help',
			helpString: 'Learn what the commands do',
			specials: ['commands', 'prefix']
		};
	}
};