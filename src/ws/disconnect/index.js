const arc = require('@architect/functions');

exports.handler = disconnectHandler;

async function disconnectHandler(req) {
	const id = req.requestContext.connectionId;
	const { connections } = await arc.tables();
	await connections.delete({ connectionId: id });
	console.log('disconnected', id);
	return { statusCode: 200 };
}
