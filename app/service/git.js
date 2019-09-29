
const _path = require("path");
const _fs = require("fs");
const _ = require("lodash");
const Service = require('egg').Service;
const Git = require("nodegit");

const queue = require("../core/queue.js");

class GitService extends Service {
	get repositoryDir() {
		return this.config.self.repositoryDir;
	}

	lock(path) {
		path = _path.join(path, ".repository.lock");
		try {
			return _fs.openSync(path, "wx");
		} catch(e) {
			console.log(e);
			return 0;
		} 
	}

	unlock(fd, path) {
		path = _path.join(path, ".repository.lock");
		_fs.closeSync(fd);
		_fs.unlinkSync(path)
	}

	async openRepository({path}) {
		if (_fs.existsSync(path)) {
			return await Git.Repository.openBare(path);
		} else {
			const dir = _path.dirname(path);
			if (dir.length > this.repositoryDir.length) {
				await this.openRepository({path: dir});
			}
			return await Git.Repository.init(path, 1);
		}
	}

	parsePath(path) {
		path = _.trim(path, " " + _path.sep);
		if (path.indexOf(_path.sep) < 0) return {};

		path = _path.join(this.repositoryDir, path);
		return _path.parse(path);
	}

	// 文件历史
	async history({path, commitId, maxCount = 100}) {
		const {dir, base} = this.parsePath(path);
		if (!dir || !base) return [];
		//const repodir = `${dir}.git`;
		const repodir = dir;
		const filename = base;

		// 打开仓库
		const repo = await this.openRepository({path: repodir});
		if (!repo) {
			console.log("打开仓库失败");
			return;
		} 

		const commit = commitId ? await repo.getCommit(commitId) : await repo.getHeadCommit();
		if (commit == null) return [];

		const revwalk = repo.createRevWalk();

		revwalk.push(commit.sha());

		const list = await revwalk.fileHistoryWalk(filename, maxCount);

		return list.map(entry => {
			const commit = entry.commit;
			return {
				committer: commit.author().name(),
				message: commit.message(),
				date: commit.date(),
				commitId: commit.sha(),
			}
		});
	}


	// 获取blob对象
	async getBlob({path, commitId}) {
		const {dir, base} = this.parsePath(path);
		if (!dir || !base) {
			console.log("文件路径不合法");
			return;
		};

		//const repodir = `${dir}.git`;
		const repodir = dir;
		const filename = base;

		// 打开仓库
		const repo = await this.openRepository({path: repodir});
		if (!repo) {
			console.log("打开仓库失败");
			return;
		} 

		// 获取commit
		const commit = commitId ? await repo.getCommit(commitId) : await repo.getHeadCommit();
		if (!commit) {
			console.log("无提交记录");
			return;
		};

		// 获取tree entry
		let treeEntry = null;
		try {
			treeEntry = await commit.getEntry(filename);
		} catch(e) {
			console.log("入口项不存在");
			return;
		}

		// 获取对象 blob
		const blob = await treeEntry.getBlob();
		
		return blob;

		//return {
			//content: blob.toString(),
			//rawcontent: blob.rawcontent(),
			//size: blob.rawsize(),
			//binary: blob.isBinary(),
			//id: blob.id(),
			//mode: blob.filemode(),
		//};
	}

	// 获取文件内容
	async getFileContent({path, commitId}) {
		const blob = await this.getBlob({path, commitId});

		return blob ? blob.content : "";
	}

	async getFile({path, commitId}) {
		const blob = await this.getBlob({path, commitId});

		return blob ? {
			content: blob.toString(),
			rawcontent: blob.rawcontent(),
			size: blob.rawsize(),
			binary: blob.isBinary(),
			id: blob.id().tostrS(),
			mode: blob.filemode(),
		} : undefined;
	}

	// 保存文件
	async saveFile({path = "", content = "", message, committer}) {
		const {dir, base} = this.parsePath(path);
		if (!dir || !base) return;

		//const repodir = `${dir}.git`;
		const repodir = dir;
		const filename = base;

		message = message || `save file ${filename}`;
		committer = committer || "anonymous";

		return await queue(repodir, async () => {
			// 打开仓库
			const repo = await this.openRepository({path: repodir});
			if (!repo) {
				console.log("打开仓库失败");
				return;
			} 

			const lockfd = this.lock(repodir);
			if (!lockfd) return console.log("this repository already lock!!!");

			// 获取缓存区
			const index = await repo.refreshIndex();

			// 获取最新提交
			const headCommit = await repo.getHeadCommit();

			// 外部修改需要此行 本程序自行处理可以不要
			if (headCommit) {
				await index.clear();
				await index.readTree(await headCommit.getTree());
			}	

			// 移除文件
			await index.removeByPath(filename);

			// 加文件到index
			const indexEntry = new Git.IndexEntry();
			const buf = Buffer.from(content);
			indexEntry.id = await Git.Blob.createFromBuffer(repo, buf, buf.length);
			indexEntry.path = filename;
			indexEntry.mode = 33188;
			indexEntry.fileSize = buf.length;
			indexEntry.flags = 0;
			indexEntry.flagsExtended = 0;
			await index.add(indexEntry);
			
			// 写index
			await index.write();

			const entries = index.entries();
			_.each(entries, entry => entry.flags = entry.flagsExtended = 0);

			// 生成tree
			const tree = await index.writeTree();
			
			// 签名
			const author = Git.Signature.now(committer, `example@mail.com`);
			const _committer = Git.Signature.now(committer, "example@mail.com");

			// 提交
			const commit = await repo.createCommit("HEAD", author, _committer, message, tree, headCommit == null ? null : [headCommit]);

			const blob = await repo.getBlob(indexEntry.id);
			this.unlock(lockfd, repodir);
			//console.log("---------------------save file finish-----------------------");
			//return commit;
			return {
				content: blob.toString(),
				rawcontent: blob.rawcontent(),
				size: blob.rawsize(),
				binary: blob.isBinary(),
				id: blob.id().tostrS(),
				mode: blob.filemode(),
			}
		});
	}

	// 删除文件
	async deleteFile({path = "", message, committer}) {
		const {dir, base} = this.parsePath(path);
		if (!dir || !base) return;

		//const repodir = `${dir}.git`;
		const repodir = dir;
		const filename = base;

		message = message || `delete file ${filename}`;
		committer = committer || "anonymous";

		return await queue(repodir, async () => {
			// 打开仓库
			const repo = await this.openRepository({path: repodir});
			if (!repo) {
				console.log("打开仓库失败");
				return;
			} 

			const lockfd = this.lock(repodir);
			if (!lockfd) return console.log("this repository already lock!!!");

			// 获取缓存区
			const index = await repo.refreshIndex();

			// 获取最新提交
			const headCommit = await repo.getHeadCommit();

			// 外部修改需要此行 本程序自行处理可以不要
			if (headCommit) {
				await index.clear();
				await index.readTree(await headCommit.getTree());
			}	

			// 移除文件
			await index.removeByPath(filename);

			// 写index
			await index.write();

			//const entries = index.entries();
			//_.each(entries, entry => entry.flags = entry.flagsExtended = 0);

			// 生成tree
			const tree = await index.writeTree();
			
			// 签名
			const author = Git.Signature.now(committer, `example@mail.com`);
			const _committer = Git.Signature.now(committer, "example@mail.com");

			// 提交
			const commit = await repo.createCommit("HEAD", author, _committer, message, tree, headCommit == null ? null : [headCommit]);

			this.unlock(lockfd, repodir);
			//console.log("---------------------delete file finish-----------------------");
			return commit;
		});
	}
}

module.exports = GitService;
