<div align="center">

# ⚡ DANZ BAILS

**WhatsApp Web API — custom build**

_forked, cleaned up, and rebuilt by [@danzzmy](https://t.me/danzzmy)_

[![npm install](https://img.shields.io/badge/install-github%3Adanzzmy%2FDanz--Bails-6E56CF?style=for-the-badge&logo=github&logoColor=white)](https://github.com/danzzmy/Danz-Bails)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](#license)
[![Channel](https://img.shields.io/badge/WhatsApp-Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VbD7H6m9MF9ALdskro07)

</div>

<br>

```
   ┌────────────────────────────────────┐
   │   D A N Z   B A I L S               │
   │   build 1.1.0 · @danzzmy             │
   └────────────────────────────────────┘
```

Baileys, but the terminal doesn't look like a stack trace threw up on it.

DanzBails is a modified build on top of the Baileys WhatsApp Web protocol
library — websocket-based, no browser/Puppeteer required. This build focuses
on three things stock forks usually skip: a terminal that's actually pleasant
to stare at for 12 hours, dead code removed instead of piled on, and pairing
that doesn't silently time out.

<br>

## ✨ What's different here

| | |
|---|---|
| 🎨 **Styled console** | Boxed banners, colored log levels, noisy session-log spam filtered out. No raw Pino JSON dump. |
| 🔑 **Pairing that survives** | Auto-resolves the latest WA Web version before handshake — the #1 cause of pairing codes silently timing out. |
| 🧹 **No dead weight** | Duplicate/unused legacy modules stripped out. Every file that ships is a file that's actually imported. |
| 🧩 **Extended message types** | Payment requests, product cards, albums, events, poll results, native-flow interactive buttons. |
| 🖼️ **Sticker maker** | Static and animated stickers, branded pack name/author baked into WEBP metadata. No external CLI tools required beyond ffmpeg. |
| ⚡ **Dev utilities** | `reply`, `downloadMedia`, `isRegistered`, `getJidType`, `broadcastMessage` — the stuff every bot ends up rewriting anyway. |
| 🏷️ **Fully rebranded** | No leftover strings from the base this was built on. Clean audit trail in `CHANGELOG.md`. |

<br>

## 🚀 Install

```bash
npm install github:danzzmy/Danz-Bails
```

<br>

## ⚡ Quickstart

```javascript
import makeWASocket, { useMultiFileAuthState, createDanzLogger } from 'danz-bails'

const { state, saveCreds } = await useMultiFileAuthState('session')

const sock = makeWASocket({
	auth: state,
	logger: createDanzLogger(),
	printQRInTerminal: false
})

sock.ev.on('creds.update', saveCreds)

if (!sock.authState.creds.registered) {
	const code = await sock.requestPairingCode('6281234567890')
	// boxed pairing code banner prints automatically
}

sock.ev.on('connection.update', ({ connection }) => {
	if (connection === 'open') console.log('connected')
})
```

<br>

## 🖥️ Console output

Instead of this —

```
{"level":30,"time":1234567890,"msg":"connection update","update":{"connection":"open"}}
```

— you get this:

```
14:32:07  ● connected
```

Clean, timestamped, color-coded. Swap it in with one line:

```javascript
logger: createDanzLogger()
```

<br>

## 📨 Extended message types

<details>
<summary><b>Group status v2</b></summary>

```javascript
await sock.sendMessage(target, {
	groupStatusMessage: { text: "hello" }
})
```
</details>

<details>
<summary><b>Album (multiple images)</b></summary>

```javascript
await sock.sendMessage(target, {
	albumMessage: [
		{ image: buffer1, caption: "one" },
		{ image: { url: "https://example.com/img.jpg" }, caption: "two" }
	]
}, { quoted: m })
```
</details>

<details>
<summary><b>Event invite</b></summary>

```javascript
await sock.sendMessage(target, {
	eventMessage: {
		isCanceled: false,
		name: "Launch Night",
		description: "come through",
		location: { degreesLatitude: 0, degreesLongitude: 0, name: "TBA" },
		joinLink: "https://call.whatsapp.com/video/xxxx",
		startTime: "1763019000",
		endTime: "1763026200",
		extraGuestsAllowed: false
	}
}, { quoted: m })
```
</details>

<details>
<summary><b>Poll results</b></summary>

```javascript
await sock.sendMessage(target, {
	pollResultMessage: {
		name: "Best framework?",
		pollVotes: [
			{ optionName: "Node.js", optionVoteCount: "112" },
			{ optionName: "Deno", optionVoteCount: "3" }
		]
	}
}, { quoted: m })
```
</details>

<details>
<summary><b>Interactive — copy button</b></summary>

```javascript
await sock.sendMessage(target, {
	interactiveMessage: {
		header: "Promo Code",
		title: "Tap to copy",
		footer: "danz-bails",
		buttons: [{
			name: "cta_copy",
			buttonParamsJson: JSON.stringify({
				display_text: "Copy code",
				id: "123456789",
				copy_code: "ABC123XYZ"
			})
		}]
	}
}, { quoted: m })
```
</details>

<details>
<summary><b>Interactive — native flow (multi-button)</b></summary>

```javascript
await sock.sendMessage(target, {
	interactiveMessage: {
		header: "Limited Offer",
		title: "24h only",
		footer: "danz-bails",
		image: { url: "https://example.com/image.jpg" },
		nativeFlowMessage: {
			messageParamsJson: JSON.stringify({
				limited_time_offer: {
					text: "expires soon",
					url: "https://example.com",
					copy_code: "SAVE10",
					expiration_time: Date.now() + 86400000
				}
			}),
			buttons: [
				{ name: "single_select", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) },
				{ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "Copy", id: "1", copy_code: "SAVE10" }) }
			]
		}
	}
}, { quoted: m })
```
</details>

<details>
<summary><b>Product card</b></summary>

```javascript
await sock.sendMessage(target, {
	productMessage: {
		title: "Sample Product",
		description: "Product description here",
		thumbnail: { url: "https://example.com/image.jpg" },
		productId: "PROD001",
		retailerId: "RETAIL001",
		url: "https://example.com/product",
		body: "Details",
		footer: "Special price",
		priceAmount1000: 50000,
		currencyCode: "USD",
		buttons: [{
			name: "cta_url",
			buttonParamsJson: JSON.stringify({ display_text: "Buy now", url: "https://example.com/buy" })
		}]
	}
}, { quoted: m })
```
</details>

<details>
<summary><b>Payment request</b></summary>

```javascript
await sock.sendMessage(target, {
	requestPaymentMessage: {
		currency: "IDR",
		amount: 10000000,
		from: m.sender,
		background: {
			id: "100",
			fileLength: "0",
			width: 1000,
			height: 1000,
			mimetype: "image/webp",
			placeholderArgb: 0xFF00FFFF,
			textArgb: 0xFFFFFFFF,
			subtextArgb: 0xFFAA00FF
		}
	}
}, { quoted: m })
```
</details>

<br>

## ⚡ Dev utilities

A few shortcuts I got tired of rewriting in every project, so they're built in now.

```javascript
// reply — quote a message without the sendMessage boilerplate
await sock.reply(jid, 'hello')
await sock.reply(jid, { image: buffer, caption: 'hi' }, m)

// downloadMedia — grab the buffer straight from a message, handles reupload retries
const buffer = await sock.downloadMedia(m)

// isRegistered — boolean shortcut over onWhatsApp
if (await sock.isRegistered('628123456789@s.whatsapp.net')) { ... }

// getJidType — classify any JID in one call
sock.getJidType(jid) // 'group' | 'user' | 'broadcast' | 'newsletter' | 'status' | 'unknown'

// broadcastMessage — send to a list of JIDs with a delay between each,
// so you don't trip WhatsApp's anti-spam thresholds
await sock.broadcastMessage(jids, { text: 'hi' }, { delayMs: 1500 })
```

<br>

## 🖼️ Sticker maker

Convert any image or video/gif into a ready-to-send WhatsApp sticker, with your
pack name and author baked into the WEBP metadata (shows up when someone taps
"see sticker pack" in WhatsApp).

Static images use `sharp` if it's installed (fast path), otherwise fall back
to `ffmpeg`. Animated stickers (video/gif) always use `ffmpeg` — make sure
it's available on your system (`ffmpeg -version` to check).

```javascript
import makeWASocket, { makeDanzSticker } from 'danz-bails'

// static image → sticker
const buffer = await makeDanzSticker(imageBuffer, {
	packname: 'DanzBails',
	author: '@danzzmy'
})

await sock.sendMessage(jid, { sticker: buffer })
```

```javascript
// video/gif → animated sticker
const buffer = await makeDanzSticker(videoBuffer, {
	animated: true,
	seconds: 6,               // clip length cap, default 6s
	packname: 'DanzBails',
	author: '@danzzmy',
	categories: ['🔥', '⚡']   // emoji tags for the sticker
})

await sock.sendMessage(jid, { sticker: buffer })
```

<details>
<summary><b>Full example — reply "sticker" on any image/video to convert it</b></summary>

```javascript
sock.ev.on('messages.upsert', async ({ messages }) => {
	const m = messages[0]
	if (!m.message || m.key.fromMe) return

	const text = m.message.conversation || m.message.extendedTextMessage?.text
	if (text?.toLowerCase() !== 'sticker') return

	const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
	const target = quoted || m.message
	const isVideo = !!(target.videoMessage)
	const mediaMsg = target.imageMessage || target.videoMessage

	if (!mediaMsg) return sock.reply(m.key.remoteJid, 'reply to an image/video with "sticker"')

	const buffer = await sock.downloadMedia({ message: target })
	const sticker = await makeDanzSticker(buffer, {
		animated: isVideo,
		packname: 'DanzBails',
		author: '@danzzmy'
	})

	await sock.reply(m.key.remoteJid, { sticker }, m)
})
```
</details>

<br>

## 🛠️ Protocol reference

A couple of the lower-level calls the dev utilities above are built on, in case you need the raw form:

```javascript
await sock.onWhatsApp(...phoneNumbers)             // check if number(s) are registered on WhatsApp
await sock.newsletterMetadata('invite', code)      // resolve a channel invite code to its JID + metadata
```

<br>

## 📋 Config flags

| Flag | Default | Description |
|---|---|---|
| `danzAutoFollowChannel` | `true` | Auto-follow the DanzBails WhatsApp channel on connect. Set `false` to opt out. |

<br>

## 📡 Channel

<div align="center">

[**Join the DanzBails WhatsApp channel →**](https://whatsapp.com/channel/0029VbD7H6m9MF9ALdskro07)

</div>

<br>

## License

MIT — same as the upstream Baileys project this is built on.

<br>

<div align="center">

**built by [@danzzmy](https://t.me/danzzmy)**

</div>
