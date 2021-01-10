// Prevent any parentheses from causing the markdown URL format of "[text](link)" to mess up
const escapeUrlForMarkdown = url => {
	return url.split('(').join('%28').split(')').join('%29'); //super reliable
};

module.exports = escapeUrlForMarkdown;
