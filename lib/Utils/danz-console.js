const C = {
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	bold: '\x1b[1m',
	cyan: '\x1b[36m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	magenta: '\x1b[35m',
	gray: '\x1b[90m',
	white: '\x1b[97m'
};

function paint(color, text) {
	return `${color}${text}${C.reset}`;
}

function timestamp() {
	return new Date().toTimeString().split(' ')[0];
}

function pad(text, width) {
	return text.length >= width ? text.slice(0, width) : text + ' '.repeat(width - text.length);
}

export function printStartupBanner(version) {
	const lines = [
		'DANZ BAILS',
		`build ${version}`,
		'maintained by @danzzmy'
	];
	const width = Math.max(...lines.map(l => l.length)) + 6;
	const top = '╭' + '─'.repeat(width) + '╮';
	const bot = '╰' + '─'.repeat(width) + '╯';

	console.log(paint(C.magenta, top));
	console.log(paint(C.magenta, '│') + paint(C.bold + C.cyan, pad('  ' + lines[0], width)) + paint(C.magenta, '│'));
	console.log(paint(C.magenta, '│') + paint(C.dim, pad('  ' + lines[1], width)) + paint(C.magenta, '│'));
	console.log(paint(C.magenta, '│') + paint(C.dim, pad('  ' + lines[2], width)) + paint(C.magenta, '│'));
	console.log(paint(C.magenta, bot));
}

export function printConnectionStatus(status, detail) {
	const map = {
		connecting: paint(C.yellow, '● connecting'),
		open: paint(C.green, '● connected'),
		close: paint(C.red, '● disconnected')
	};
	const line = `${paint(C.dim, timestamp())}  ${map[status] || status}`;
	console.log(detail ? `${line}  ${paint(C.dim, detail)}` : line);
}

export function printPairingCode(phoneNumber, code) {
	const formatted = code.match(/.{1,4}/g)?.join('-') ?? code;
	const label = 'PAIRING CODE';
	const width = Math.max(label.length, phoneNumber.length + 8, formatted.length + 8) + 6;
	const top = '╭' + '─'.repeat(width) + '╮';
	const bot = '╰' + '─'.repeat(width) + '╯';

	console.log(paint(C.cyan, top));
	console.log(paint(C.cyan, '│') + paint(C.bold + C.white, pad('  ' + label, width)) + paint(C.cyan, '│'));
	console.log(paint(C.cyan, '│') + pad('  nomor  ' + paint(C.dim, phoneNumber), width + 9) + paint(C.cyan, '│'));
	console.log(paint(C.cyan, '│') + pad('  kode   ' + paint(C.bold + C.green, formatted), width + 9) + paint(C.cyan, '│'));
	console.log(paint(C.cyan, bot));
	console.log(paint(C.dim, '  Buka WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon\n'));
}

export function printQrHint() {
	console.log(paint(C.cyan, '\n  Scan QR di atas dengan WhatsApp > Perangkat Tertaut\n'));
}

const NOISE_PATTERNS = [
	/closing stale open session/i,
	/removing old closed session/i,
	/failed to decrypt/i,
	/waiting for message/i
];

function shouldSkip(msg) {
	return NOISE_PATTERNS.some(p => p.test(msg));
}

function toText(objOrMsg, msg) {
	if (typeof objOrMsg === 'string') return objOrMsg;
	if (msg) return msg;
	if (objOrMsg && typeof objOrMsg === 'object') {
		try { return JSON.stringify(objOrMsg); } catch { return ''; }
	}
	return '';
}

function line(level, msg) {
	const badge = {
		info: paint(C.cyan, ' INFO '),
		warn: paint(C.yellow, ' WARN '),
		error: paint(C.red, ' FAIL '),
		debug: paint(C.gray, ' DBUG '),
		trace: paint(C.gray, ' TRCE ')
	}[level];
	console.log(`${paint(C.dim, timestamp())} ${badge} ${msg}`);
}

/**
 * Drop-in Pino-compatible logger with styled terminal output instead of raw JSON.
 * Pass this as `logger` in makeWASocket({ logger: createDanzLogger() }).
 */
export function createDanzLogger(minLevel = 'info') {
	const order = ['trace', 'debug', 'info', 'warn', 'error'];
	const threshold = order.indexOf(minLevel);

	const emit = (level, objOrMsg, msg) => {
		if (order.indexOf(level) < threshold) return;
		const text = toText(objOrMsg, msg);
		if (!text || shouldSkip(text)) return;
		line(level, text);
	};

	return {
		level: minLevel,
		info: (o, m) => emit('info', o, m),
		warn: (o, m) => emit('warn', o, m),
		error: (o, m) => emit('error', o, m),
		debug: (o, m) => emit('debug', o, m),
		trace: (o, m) => emit('trace', o, m),
		child: () => createDanzLogger(minLevel)
	};
}
