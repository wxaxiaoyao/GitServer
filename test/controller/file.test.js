
const { app, mock, assert  } = require('egg-mock/bootstrap');
const fs = require("fs");

const queue = require("../../app/core/queue.js");

function rmdir(path){
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()){
                rmdir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }
}

describe("file", () => {
	it("000 queue", async () => {
	});

	it("001 repository file", async () => {
		const ctx = app.mockContext();
		const git = ctx.service.git;
		const token = "keepwork";
		const path = "test/file.txt";

		// 移除仓库
		//fs.rmdirSync("repository/test.git", {recursive: true});
		rmdir("repository/1/test");

		// 保存文件
		const files = await Promise.all([
			await app.httpRequest().post("/api/v0/file").send({
				path: "test/file.txt",
				content: "hello world",
			}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body),

			await app.httpRequest().post("/api/v0/file").send({
				path: "test/dir/file.txt",
				content: "hello world",
			}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body),

			await app.httpRequest().post("/api/v0/file").send({
				path: "test/file.txt",
				content: "hello world2",
			}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body),

		]);
		assert(files.length == 3);

		// 移除文件
		const commit = await app.httpRequest().delete("/api/v0/file").send({
			path: "test/file.txt",
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(commit);

		// 提交历史
		const list = await app.httpRequest().get(`/api/v0/file/history?path=${path}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		console.log(list);
		assert(list.length == 3);

		let commitId = list[0].commitId;
		let file = await app.httpRequest().get(`/api/v0/file?path=${path}&commitId=${commitId}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 404)).catch(_ => {});

		commitId = list[1].commitId;
		file = await app.httpRequest().get(`/api/v0/file?path=${path}&commitId=${commitId}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		console.log(file);
		assert(file.content, "hello world");

		commitId = list[2].commitId;
		file = await app.httpRequest().get(`/api/v0/file?path=${path}&commitId=${commitId}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		//console.log(file);
		assert(file.content, "hello world 2");
	});
});

