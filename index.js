//load libraries
const fs = require('fs').promises;
const path = require('path');
const Discord = require('discord.js');

//load other modules
const Command = require('./command.js');
const ConfigFetcher = require('./configfetch.js');

const COMMAND_DIRECTORY = 'commands';

//set up some stuff
const client = new Discord.Client();

const loadCommands = () => {
	return fs.readdir(COMMAND_DIRECTORY)
	.then(files => {
		console.log(`Loading ${files.length} command(s)...`);

		const commandPromises = [];

		files.forEach(file => {
			let currentCommandDirectory = path.join(__dirname, COMMAND_DIRECTORY, file);

			let currentCommand = require(currentCommandDirectory);

			console.log(`Loading ${file}`);

			const commandPromise = currentCommand.initializeData ?
				currentCommand.initializeData().then(currentCommand.command) :
				currentCommand.command();

			commandPromises.push(commandPromise);
		});

		return Promise.all(commandPromises);
	}).then(initializedCommands => {
		let commands = new Map();

		initializedCommands.forEach(currentCommand => {
			commands.set(currentCommand.name, new Command(currentCommand));

			console.log(`Loaded ${currentCommand.name} (${currentCommand.helpString || ''})`);
		});

		return commands;
	});
};

const performActionOnMessage = (message, commands, configFetcher) => { //naming things is hard ok :'(
	if (message.author === client.user) return; //could probably be implemented more elegantly, if another nested "if" expression is "elegant"

	return configFetcher.fetchGuildConfig(message.guild).then(guildConfig => {
		if (message.content.startsWith(guildConfig.prefix)) {
			const commandName = message.content.slice(guildConfig.prefix.length).split(' ')[0];

			if (commands.has(commandName)) {
				const command = commands.get(commandName);
				const specials = {prefix: guildConfig.prefix};
				let cmdConfig;

				const promises = [configFetcher.fetchCommandConfig(message.guild, commandName).then(config => {cmdConfig = config;})];

				if (command.specials.has('commands')) {
					const visibleCommands = new Map();
					for (const [commandName, command] of commands) {
						if (!command.hidden) visibleCommands.set(commandName, command);
					}
					specials.commands = visibleCommands;
				}

				if (command.specials.has('previousMessage')) {
					promises.push(message.channel.fetchMessages({limit: 1, before: message.id}).then(messages => {
						specials.previousMessage = messages.last();
					}));
				}

				if (command.specials.has('args')) {
					specials.args = message.content.split(' ').slice(1).join(' ');
				}

				return Promise.all(promises).then(() => {
					return command.run(message.channel, cmdConfig, specials);
				});
			}
		}
	});
};

(() => {
	let commands;
	Promise.all([
		client.login(process.argv[2]),
		loadCommands().then(loadedCommands => {
			commands = loadedCommands;
		})
	])
	.then(() => {
		console.log('Logged in');

		const configFetcher = new ConfigFetcher({});

		client.on('error', err => {
			console.log(err);
		});

		client.on('message', message => {
			performActionOnMessage(message, commands, configFetcher);
		});
	});
})();
