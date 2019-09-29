
const jwt = require("jwt-simple");

function getCookieToken(ctx) {
	return ctx.cookies.get("token");
}

function getAuthorizationHeaderToken(ctx) {
	const authorization = ctx.header.authorization || "";
	const parts = authorization.split(' ');

	if (parts.length == 2) {
		if (/^Bearer$/i.test(parts[0])) return parts[1];
	}

	return;
}

module.exports = (options, app) => {
	const config = app.config.self;
	return async function(ctx, next) {
		const token = getCookieToken(ctx) || getAuthorizationHeaderToken(ctx) || ctx.query.token || "";

		ctx.state.token = token;
		ctx.state.user = config.tokens[token] || {};

		//try {
			//ctx.state.user = token ? jwt.decode(token, config.secret, false) : {};
		//} catch(e) {
			//return ctx.throw(411, "invalid token");
			//ctx.state.user = {};
		//}

		//try {
			//ctx.state.admin = token ? jwt.decode(token, config.adminSecret, false) : {};
		//} catch(e) {
			//ctx.state.admin = {};
		//}

		await next();
	}
}
