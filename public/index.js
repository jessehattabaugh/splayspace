const ws = new WebSocket('ws://localhost:3333');
ws.onopen = () => {
	console.debug('ws opened');
};
ws.onclose = close;
ws.onmessage = message;
ws.onerror = console.log;

function open() {
	console.debug('❤', 'opened');
}

function close() {
	console.debug('💔', 'close');
}

function message(event) {
	console.debug('💌', 'message', event);
}

document.getElementById('input').addEventListener('keyup', (event) => {
	console.debug('🔑', 'keyup', event);
	if (event.key == 'Enter') {
		console.debug('👩‍🎤');
		const text = event.target.value;
		ws.send(JSON.stringify({text}));
		event.target.value = '';
	}
});

console.debug('index.js evaled');
