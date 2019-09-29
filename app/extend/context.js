const joi = require("joi");
const _ = require("lodash");

const rules = {
	"number": joi.number().required(),
	"number_optional": joi.number(),
	"string": joi.string().required(),
	"string_optional": joi.string(),
	"boolean": joi.boolean().required(),
	"boolean_optional": joi.boolean(),
}

module.exports = {
	validate(schema, data, options = {allowUnknown:true}) {
		const params = data || _.merge({}, this.request.body, this.query, this.params);
		schema = schema || {};

		_.each(schema, (val, key) => {
			schema[key] = rules[val] || val;
		});

		const result = joi.validate(params, schema, options);

		if (result.error) {
			const errmsg = result.error.details[0].message.replace(/"/g, '');
			this.throw(400, "invalid params:" + errmsg);
		}

		_.assignIn(params, result.value);

		return params;
	}
}
