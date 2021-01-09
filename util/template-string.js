module.exports = (string, templates) => {
	const templateRegex = /{(.+?)}/g;
	return string.replace(templateRegex, (match, p1) => {
		const templated = templates[p1];
		if (typeof templated === 'function') {
			return templated();
		}
		return templated;
	});
};
