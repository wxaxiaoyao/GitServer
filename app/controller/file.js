const _path = require("path");
const Git = require("nodegit");

const Controller = require("../core/controller.js");

class File extends Controller {

	async show() {
		const {uid} = this.authenticated();

		const params = this.validate({
			path:"string",
			commitId: "string_optional",
		});

		params.path = uid + _path.sep + params.path;

		const file = await this.ctx.service.git.getFile(params);
		if (!file) return this.throw(404);

		file.rawcontent = undefined;

		return this.success(file);
	}

	async rowcontent() {
		// 二进制数据
	}

	async save() {
		const {uid} = this.authenticated();

		const params = this.validate({
			path:"string",
			content: "string_optional",
			committer: "string_optional",
			message: "string_optional",
		});

		params.path = uid + _path.sep + params.path;

		const data = await this.ctx.service.git.saveFile(params);

		return this.success(data);
	}

	async destroy() {
		const {uid} = this.authenticated();

		const params = this.validate({
			path:"string",
			committer: "string_optional",
			message: "string_optional",
		});

		params.path = uid + _path.sep + params.path;

		const data = await this.ctx.service.git.deleteFile(params);

		return this.success(data);
	}

	async history() {
		const {uid} = this.authenticated();

		const params = this.validate({
			path:"string",
			commitId: "string_optional",
			maxCount: "number_optional",
		});

		params.path = uid + _path.sep + params.path;
		
		const list = await this.ctx.service.git.history(params)

		return this.success(list);
	}

}

module.exports = File;
