require("app-module-path").addPath(__dirname);

//load libraries
const fs = require("fs").promises,
      path = require("path"),
      Promise = require("bluebird"),
      Discord = require("discord.js"),
      argv = require("minimist")(process.argv.slice(2));

//load other modules
const Command = require("./command.js"),
      ConfigFetcher = require("./configfetch.js");

//define initial config
const initConfig = {
	commandDirectory:"commands",
	configDirectory:"config"
}

//set up some stuff
let client = new Discord.Client();

function loadCommands(commandDirectory) {
	return fs.readdir(commandDirectory).then(files => {
		console.log(`Loading ${files.length} command(s)...`);
		
		const commandPromises = [];
		
		files.forEach(file => {
			let currentCommandDirectory = path.join(__dirname, commandDirectory, file);
			
			let currentCommand = require(currentCommandDirectory);
			
			console.log(`Loading ${currentCommandDirectory}`);
			
			commandPromises.push(Promise.props({command:currentCommand.initialize(), directory:currentCommandDirectory}));
		});
		
		return Promise.all(commandPromises);
	}).then(initializedCommands => {
		let commands = new Map();
		
		initializedCommands.forEach(currentCommand => {
			commands.set(currentCommand.command.name, new Command(
				Object.assign( //the very best way to properly implement things
					currentCommand.command,
					{_commandLocation:currentCommand.directory}
				)
			));
			
			console.log(`Loaded ${currentCommand.command.name} (${currentCommand.command.helpString || ""})`);
		});
		
		return commands;
	});
}

function fetchCommandPermission(commandName, configFetcher) { //TODO: Actually implement this
	return Promise.resolve(true);
}

function performActionOnMessage(message, commands, configFetcher) { //naming things is hard ok :'(
	if (message.author === client.user) return; //could probably be implemented more elegantly, if another nested "if" expression is "elegant"
	
	configFetcher.fetchBotConfig(initConfig.configDirectory, message.guild).then(config => {
		if (message.content.startsWith(config.prefix)) {
			const commandName = message.content.slice(config.prefix.length).split(" ")[0];
			
			if (commands.has(commandName)) {
				fetchCommandPermission(commandName, configFetcher).then(allowed => {
					if (allowed) {
						let command = commands.get(commandName);
						configFetcher.fetchCommandConfig(command, message.guild).then(config => { //here we see the classic hadouken pattern
							command.run(message, message.channel, config, {commands:commands/*.filter(cmd => cmd.hidden !== true)*/});
						})
					}
				})
			}
		}
	});
}

Promise.props({
	"login":client.login(argv.token),
	"commands":loadCommands(initConfig.commandDirectory)
}).then(res => {
	console.log("Logged in");
	
	const commands = res.commands;
	
	const configFetcher = new ConfigFetcher({});
	
	client.on("error", err => {
		console.log(err);
	});
	
	client.on("message", message => {
		performActionOnMessage(message, commands, configFetcher);
	});
})
