const Controller = require('egg').Controller;
const Git = require("nodegit");

class Index extends Controller {

	async test1() {
		const repo = await Git.Repository.openBare("/root/gitea-repositories/xiaoyao/1test.git");
		const treeBuilder = await Git.Treebuilder.create(repo);
		const commit = await repo.getMasterCommit();
		const tree = await commit.getTree();
		const walker = tree.walk();
		walker.on("entry", entry => {
			console.log(entry.filemode(), entry.path());
		});
		walker.start();
		const buf = Buffer.from("hello world");
		const oid = await Git.Blob.createFromBuffer(repo, buf, buf.length);
		const indexEntry = new Git.IndexEntry();
		indexEntry.id = oid;
		indexEntry.path = "nodegit3";
		indexEntry.mode = 33188;
		const index = await repo.refreshIndex();
		const headCommit = await repo.getHeadCommit();
		await index.readTree(await headCommit.getTree());
		await index.add(indexEntry);
		console.log(index.entries());
		await index.write();
		const treeId = await index.writeTree();
		const author = Git.Signature.now("Scott Chacon","schacon@gmail.com");
		const committer = Git.Signature.now("Scott A Chacon",  "scott@github.com");
		const commitId = await repo.createCommit("HEAD", author, committer, "message", treeId, headCommit == null ? null : [headCommit]);
	}

	async test() {
		const repo = await Git.Repository.openBare("/root/gitea-repositories/xiaoyao/1test.git");
		const headCommit = await repo.getHeadCommit();
		const treeBuilder = Git.Treebuilder.create(repo).then(tb => {console.log('------------')});
		console.log(treeBuilder);
		console.log(treeBuilder.entrycount());
	}

	async revwalk() {
		const repo = await Git.Repository.openBare("/root/gitea-repositories/xiaoyao/1test.git");
		const walker = repo.createRevWalk();
		const headCommit = await repo.getHeadCommit();
		walker.push(headCommit.sha());
		const list = await walker.fileHistoryWalk("nodegit", 100);
		console.log(list.length);
		for (let i = 0; i < list.length; i++) {
			const entry = list[i];
			let commit = entry.commit;
			commit = await repo.getCommit(commit.sha());
			console.log(commit);
			if (!commit) continue;
			const treeEntry = await commit.getEntry("nodegit");
			const blob = await treeEntry.getBlob();
			console.log(treeEntry, blob);
			console.log(blob.toString());
			console.log(blob.rawcontent());
			  console.log("commit " + commit.sha());
			  console.log("Author:", commit.author().name() +
				" <" + commit.author().email() + ">");
			  console.log("Date:", commit.date());
			  console.log("\n    " + commit.message());
		}
	}

	async git_index() {
		const repo = await Git.Repository.openBare("/root/gitea-repositories/xiaoyao/1test.git");
		const index = await repo.refreshIndex();
		console.log(index.entries());
	}

	async index() {
		await this.git_index();
		
		this.ctx.body = "hello world";
	}
}

module.exports = Index;
