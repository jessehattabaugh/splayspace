const arc = require('@architect/functions');

exports.handler = connectHandler;

async function connectHandler(req) {
	const id = req.requestContext.connectionId;
	const { connections } = await arc.tables();
	const ret = await connections.put({ connectionId: id, foo: 'bar' });
	console.log('connected', id, ret);

	const conn = await connections.get({ connectionId: id });
	console.log('found', conn);
	// found { connectionId: 'eebe3f59-4de9-4ad1-9e37-735426648256', foo: 'bar' }

	return { statusCode: 200 };
}
