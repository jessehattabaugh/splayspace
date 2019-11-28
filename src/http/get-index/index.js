const arc = require('@architect/functions');

exports.handler = rootHandler;

function static(path) {
	const prefix =
		process.env.NODE_ENV === 'testing' ? '' : '/' + process.env.NODE_ENV;
	return prefix + arc.http.helpers.static(path);
}

async function rootHandler(req) {
	return {
		headers: { 'content-type': 'text/html; charset=utf8' },
		body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SplaySpace</title>
  <link rel="stylesheet" href="${static('/index.css')}">
  <link rel="icon" href="${static('/favicon.ico')}" type="image/x-icon">
  <script>
		WS_URL = "${
			process.env.ARC_WSS_URL
				? 'wss://' + process.env.ARC_WSS_URL
				: 'ws://localhost:3333'
		}";
  </script>
</head>
<body>
	<h1>SplaySpace</h1>

	<section id="players">
		<h2>Players</h2>
		<ul></ul>
	</section>

	<section id="chat">
		<h2>Chat</h2>
		<ol></ol>
		<form>
			<textarea></textarea>
			<input type="submit">
		</form>
	</section>
	<script src="${static('/index.js')}"></script>
</body>
</html>
`,
	};
}
