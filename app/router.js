
module.exports = app => {
	const {router, controller} = app;

	const prefix = "/api/v0";

	router.get("/", controller.index.index);
	
	const file = controller.file;
	router.get(`${prefix}/file`, file.show);  // 获取文件
	router.post(`${prefix}/file`, file.save);  // 创建文件
	router.delete(`${prefix}/file`, file.destroy);  // 创建文件
	router.get(`${prefix}/file/history`, file.history);  // 创建文件
}
