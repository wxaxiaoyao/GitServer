const joi = require("joi");
const _ = require("lodash");
const Controller = require("egg").Controller;

const rules = {
	"number": joi.number().required(),
	"number_optional": joi.number(),
	"string": joi.string().required(),
	"string_optional": joi.string(),
	"boolean": joi.boolean().required(),
	"boolean_optional": joi.boolean(),
}

class BaseController extends Controller {
	get log() {
		return this.app.log;
	}

	validate(schema, data, options = {allowUnknown:true}) {
		return this.ctx.validate(schema, data, options);
	}

	authenticated() {
		const user = this.ctx.state.user;
		if (!user || !user.uid) this.throw(411, "unauthenticated");

		return user;
	}

	success(body = "success", status = 200) {
		this.ctx.status = status;
		this.ctx.body = body;
	}

	fail(body = "fail", status = 400) {
		this.ctx.status = status;
		this.ctx.body = body;
	}

	throw(...args) {
		return this.ctx.throw(...args);
	}

}

module.exports = BaseController;
