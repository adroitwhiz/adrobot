//load libraries
const fs = require('fs').promises;
const path = require('path');
const Promise = require('bluebird');
const Discord = require('discord.js');
const argv = require('minimist')(process.argv.slice(2));

//load other modules
const Command = require('./command.js');
const ConfigFetcher = require('./configfetch.js');

const COMMAND_DIRECTORY = 'commands';

//set up some stuff
const client = new Discord.Client();

const loadCommands = () => {
	return fs.readdir(COMMAND_DIRECTORY).then(files => {
		console.log(`Loading ${files.length} command(s)...`);

		const commandPromises = [];

		files.forEach(file => {
			let currentCommandDirectory = path.join(__dirname, COMMAND_DIRECTORY, file);

			let currentCommand = require(currentCommandDirectory);

			console.log(`Loading ${file}`);

			let commandPromise;
			if (currentCommand.initializeData) {
				commandPromise = currentCommand.initializeData().then(currentCommand.command);
			} else {
				commandPromise = currentCommand.command();
			}

			commandPromises.push(Promise.props({command: commandPromise, directory: currentCommandDirectory}));
		});

		return Promise.all(commandPromises);
	}).then(initializedCommands => {
		let commands = new Map();

		initializedCommands.forEach(currentCommand => {
			commands.set(currentCommand.command.name, new Command(currentCommand.command));

			console.log(`Loaded ${currentCommand.command.name} (${currentCommand.command.helpString || ''})`);
		});

		return commands;
	});
};

const performActionOnMessage = (message, commands, configFetcher) => { //naming things is hard ok :'(
	if (message.author === client.user) return; //could probably be implemented more elegantly, if another nested "if" expression is "elegant"

	configFetcher.fetchGuildConfig(message.guild).then(guildConfig => {
		if (message.content.startsWith(guildConfig.prefix)) {
			const commandName = message.content.slice(guildConfig.prefix.length).split(' ')[0];

			if (commands.has(commandName)) {
				let command = commands.get(commandName);
				configFetcher.fetchCommandConfig(message.guild, commandName).then(cmdConfig => {
					// Prevent hidden commands from showing up in e.g. the help results
					const visibleCommands = new Map();
					for (const [commandName, command] of commands) {
						if (!command.hidden) visibleCommands.set(commandName, command);
					}

					command.run(message, message.channel, cmdConfig, {commands: visibleCommands, prefix: guildConfig.prefix});
				});
			}
		}
	});
};

Promise.props({
	'login': client.login(argv.token),
	'commands': loadCommands()
}).then(res => {
	console.log('Logged in');

	const commands = res.commands;

	const configFetcher = new ConfigFetcher({});

	client.on('error', err => {
		console.log(err);
	});

	client.on('message', message => {
		performActionOnMessage(message, commands, configFetcher);
	});
});
