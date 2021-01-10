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
	const commonData = new Map();

	return fs.readdir(COMMAND_DIRECTORY)
		.then(async files => {
			console.log(`Loading ${files.length} command(s)...`);

			const commandPromises = [];

			for (const file of files) {
				let currentCommandDirectory = path.join(__dirname, COMMAND_DIRECTORY, file);

				let currentCommand = require(currentCommandDirectory);

				let initDataPromise = currentCommand.initializeData ?
					currentCommand.initializeData() :
					Promise.resolve({});

				let failedToLoad = false;
				if (Object.prototype.hasOwnProperty.call(currentCommand, 'commonData')) {
					const loadedCommonData = {};
					for (const [key, filename] of Object.entries(currentCommand.commonData)) {
						let fileData;
						if (commonData.has(filename)) {
							fileData = commonData.get(filename);
						} else {
							try {
								fileData = Object.freeze(JSON.parse(await fs.readFile(path.join(__dirname, 'common-data', filename))));
								commonData.set(filename, fileData);
							} catch (err) {
								console.warn(`Failed to load ${file} because required data ${filename} does not exist`);
								failedToLoad = true;
							}
						}

						loadedCommonData[key] = fileData;
					}

					initDataPromise = initDataPromise.then(data => Object.assign(data, loadedCommonData));
				}
				if (failedToLoad) continue;

				console.log(`Loading ${file}`);

				const commandPromise = initDataPromise.then(currentCommand.command);

				commandPromises.push(commandPromise);
			}

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
	if (message.author === client.user) return;

	return configFetcher.fetchGuildConfig(message.guild).then(guildConfig => {
		if (message.content.startsWith(guildConfig.prefix)) {
			const commandName = message.content.slice(guildConfig.prefix.length).split(' ')[0];

			if (commands.has(commandName)) {
				const command = commands.get(commandName);
				const specials = {prefix: guildConfig.prefix};
				let cmdConfig;

				const promises = [
					configFetcher.fetchCommandConfig(message.guild, commandName)
						.then(config => {
							cmdConfig = config;
						})
				];

				if (command.specials.has('commands')) {
					const visibleCommands = new Map();
					for (const [commandName, command] of commands) {
						if (!command.hidden) visibleCommands.set(commandName, command);
					}
					specials.commands = visibleCommands;
				}

				if (command.specials.has('previousMessage')) {
					promises.push(message.channel.messages.fetch({limit: 1, before: message.id}).then(messages => {
						specials.previousMessage = messages.last();
					}));
				}

				if (command.specials.has('args')) {
					specials.args = message.content.split(' ').slice(1).join(' ');
				}

				return Promise.all(promises).then(() => {
					return command.run(message.channel, cmdConfig, specials);
				}).catch(err => {
					// report errors to meeeeeee
					client.users.fetch('323268429769342978')
						.then(user => user.createDM())
						.then(dm => {
							dm.send(`AdroBot encountered an error: \`\`\`${err.stack}\`\`\`\nCommand was \`\`\`${message}\`\`\``);
						});
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
