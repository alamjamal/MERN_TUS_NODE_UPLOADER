const express = require("express");
const router = express.Router();

const { Server, EVENTS } = require("@tus/server");
const { FileStore } = require("@tus/file-store");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs").promises;


// Helper function to parse metadata
const parseMetadata = (metadataString) => {
	const metadata = {};
	metadataString.split(',').forEach((item) => {
		const [key, base64Value] = item.split(' ');
		metadata[key] = Buffer.from(base64Value, 'base64').toString('ascii');
	});
	return metadata;
};

const searchForJavaScriptInPDF = async (filePath) => {
	const content = await fs.readFile(filePath);

	const jsPatterns = [/\/JS/, /\/JavaScript/, /\/S\s*\/JavaScript/];

	for (const pattern of jsPatterns) {
		if (pattern.test(content)) {
			return true;
		}
	}
	return false;
};




const tusServer = new Server({
	path: '/tus/files',
	datastore: new FileStore({
		directory: path.join(__dirname, 'files'),

	}),
	redirectToHTTPS: true,

	namingFunction: (req) => {
		const metadata = parseMetadata(req.headers['upload-metadata']);
		const fileType = metadata.filetype.split('/')[1]; // Get the extension from filetype
		return `${crypto.randomBytes(16).toString('hex')}.${fileType}`;
	},

	onUploadFinish: async (req, res, file) => {
		const filePath = path.join(__dirname, "files", file.id)


		try {
			const buffer = await fs.readFile(filePath);
			// const type = await FileType.fromBuffer(buffer);

			// if (!type || type.mime !== 'application/pdf') {
			//     await fs.unlink(filePath);

			//     return;
			// }

			const fileType = file.metadata.filetype
			if(!fileType || fileType !== "application/pdf"){
				await fs.unlink(filePath);
				throw {status_code: 401, body: 'Invalid File Type'}
			}

			const containsJavaScript = await searchForJavaScriptInPDF(filePath);
			if (containsJavaScript) {
				await fs.unlink(filePath);
				throw {status_code: 401, body: 'Invalid File'}
				
			}

		} catch (err) {
			throw {status_code: 401, body: err.body}
		}
	},


});






router.all("/*", (req, res) => {
	tusServer.handle(req, res);
});




module.exports = router;
