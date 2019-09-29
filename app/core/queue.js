
const _ = require("lodash");
const __queue__ = {};


module.exports = async (key = "", callback) => {
	const p = __queue__[key] || Promise.resolve(true);

	__queue__[key] = p.then(() => callback());

	return await __queue__[key];
}

//function test() {
	//const p1 = async () => {
		//return await new Promise((resolve, reject) => {
			//setTimeout(() => {
				//console.log("p1");
				//return resolve("p1");
			//}, 1000);
		//});
	//}

	//const p2 = async () => {
		//return await new Promise((resolve, reject) => {
			//setTimeout(() => {
				//console.log("p2");
				//return resolve("p2");
			//}, 2000);
		//});
	//}

	//const p3 = async () => {
		//return await new Promise((resolve, reject) => {
			//setTimeout(() => {
				//console.log("p3");
				//return resolve("p3");
			//}, 3000);
		//});
	//}

	//console.log(queue("", p1));
	//console.log(queue("", () => {console.log("p0")}));
	//console.log(await queue("", p2));
	//console.log(await queue("", p2));
	//console.log(await queue("", p3));
//}
