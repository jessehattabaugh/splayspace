exports.handler = defaultHandler;

async function defaultHandler(req) {
	console.log('defaultHandler', req.path);
	return { statusCode: 200 };
}
