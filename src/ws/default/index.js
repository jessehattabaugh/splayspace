exports.handler = defaultHandler;

async function defaultHandler(req) {
	console.info('default message', req);
	return { statusCode: 200 };
}
