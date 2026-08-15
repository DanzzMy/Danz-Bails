<div align="center">

# 🥷 DanzBails

### A hardened, styled fork of the Baileys WhatsApp Web API

<sub>WebSocket-native · Multi-device ready · Zero browser dependency</sub>

<br/>

[![npm](https://img.shields.io/badge/npm-danz--bails-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/danz-bails)
[![license](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![maintained](https://img.shields.io/badge/maintained-yes-blue?style=for-the-badge)](https://github.com/danzzmy/Danz-Bails)

<br/>

**[Quick Start](#-quick-start)** · **[Console Logger](#-console-logger)** · **[Message Recipes](#-message-recipes)** · **[Why This Fork](#-why-this-fork)** · **[Credits](#-credits)**

</div>

---

## ✨ What is DanzBails?

DanzBails is a custom-hardened build on top of the Baileys protocol implementation — a library that talks to WhatsApp's multi-device WebSocket directly, with **no headless browser required**. It keeps everything that makes Baileys fast and lightweight, then layers on top of it:

- a **rewritten pairing/auth pipeline** aimed at fewer silent disconnects,
- a **styled console logger** so your terminal stops looking like a JSON dump,
- and a batch of **extra message types** (albums, events, polls, product cards, native-flow interactives) ready to send out of the box.

> Everything that changed from the upstream base this fork was built on is tracked in [`CHANGELOG.md`](./CHANGELOG.md).

---

## 🚀 Quick Start

```javascript
import makeWASocket, { createDanzLogger } from 'danz-bails'

const sock = makeWASocket({
    auth: state,
    logger: createDanzLogger() // styled INFO / WARN / FAIL lines + startup banner
})
```

---

## 🖥️ Console Logger

Out of the box, DanzBails ships a themed terminal logger — no more raw Pino JSON scrolling past.

| Before (vanilla Pino) | After (`createDanzLogger()`) |
|---|---|
| Unformatted JSON lines | Colorized `INFO` / `WARN` / `FAIL` tags |
| No visual hierarchy | Boxed startup banner |
| Plain pairing code text | Auto-boxed pairing code output |

Pairing codes returned from `sock.requestPairingCode(...)` are automatically framed in a box — no extra setup needed.

---

## 🧩 Core Utilities

<table>
<tr><td width="50%">

**Resolve a channel/newsletter ID**
```javascript
await sock.newsletterId(url)
```

</td><td width="50%">

**Check if a number is banned**
```javascript
await sock.checkWhatsApp(target)
```

</td></tr>
</table>

---

## 📨 Message Recipes

<details>
<summary><b>Group status (v2)</b></summary>

```javascript
await sock.sendMessage(target, {
    groupStatusMessage: { text: "#DANZBAILS" }
});
```
</details>

<details>
<summary><b>Album — multiple images in one message</b></summary>

```javascript
await sock.sendMessage(target, {
    albumMessage: [
        { image: cihuy, caption: "#DANZBAILS" },
        { image: { url: "URL_IMAGE" }, caption: "#DANZBAILS" }
    ]
}, { quoted: m });
```
</details>

<details>
<summary><b>Event invitation</b></summary>

```javascript
await sock.sendMessage(target, {
    eventMessage: {
        isCanceled: false,
        name: "#DANZBAILS",
        description: "#DANZBAILS",
        location: {
            degreesLatitude: 0,
            degreesLongitude: 0,
            name: "#DANZBAILS"
        },
        joinLink: "https://call.whatsapp.com/video/xxxxxxxx",
        startTime: "1763019000",
        endTime: "1763026200",
        extraGuestsAllowed: false
    }
}, { quoted: m });
```
</details>

<details>
<summary><b>Poll results</b></summary>

```javascript
await sock.sendMessage(target, {
    pollResultMessage: {
        name: "#DANZBAILS",
        pollVotes: [
            { optionName: "Option A", optionVoteCount: "112233" },
            { optionName: "Option B", optionVoteCount: "1" }
        ]
    }
}, { quoted: m });
```
</details>

<details>
<summary><b>Interactive message — copy button</b></summary>

```javascript
await sock.sendMessage(target, {
    interactiveMessage: {
        header: "#DANZBAILS",
        title: "#DANZBAILS",
        footer: "t.me/yourhandle",
        buttons: [{
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
                display_text: "Copy code",
                id: "123456789",
                copy_code: "ABC123XYZ"
            })
        }]
    }
}, { quoted: m });
```
</details>

<details>
<summary><b>Interactive message — native flow (buttons + list + copy)</b></summary>

```javascript
await sock.sendMessage(target, {
    interactiveMessage: {
        header: "#DANZBAILS",
        title: "#DANZBAILS",
        footer: "t.me/yourhandle",
        image: { url: "https://example.com/image.jpg" },
        nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
                limited_time_offer: {
                    text: "Limited time",
                    url: "https://t.me/yourhandle",
                    copy_code: "#DANZBAILS",
                    expiration_time: Date.now() * 999
                },
                bottom_sheet: {
                    in_thread_buttons_limit: 2,
                    divider_indices: [1, 2, 3, 4, 5, 999],
                    list_title: "#DANZBAILS",
                    button_title: "#DANZBAILS"
                },
                tap_target_configuration: {
                    title: "Details",
                    description: "Tap for more",
                    canonical_url: "https://t.me/yourhandle",
                    domain: "shop.example.com",
                    button_index: 0
                }
            }),
            buttons: [
                { name: "single_select", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) },
                { name: "call_permission_request", buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }) },
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "#DANZBAILS",
                        sections: [{
                            title: "title",
                            highlight_label: "label",
                            rows: [{ title: "Row title", description: "Row description", id: "row_2" }]
                        }],
                        has_multiple_buttons: true
                    })
                },
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "copy code",
                        id: "123456789",
                        copy_code: "ABC123XYZ"
                    })
                }
            ]
        }
    }
}, { quoted: m });
```
</details>

<details>
<summary><b>Interactive message — thumbnail + copy button</b></summary>

```javascript
await sock.sendMessage(target, {
    interactiveMessage: {
        header: "#DANZBAILS",
        title: "#DANZBAILS",
        footer: "t.me/yourhandle",
        image: { url: "https://example.com/image.jpg" },
        buttons: [{
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
                display_text: "copy code",
                id: "123456789",
                copy_code: "ABC123XYZ"
            })
        }]
    }
}, { quoted: m });
```
</details>

<details>
<summary><b>Product / catalog message</b></summary>

```javascript
await sock.sendMessage(target, {
    productMessage: {
        title: "Sample Product",
        description: "Product description goes here",
        thumbnail: { url: "https://example.com/image.jpg" },
        productId: "PROD001",
        retailerId: "RETAIL001",
        url: "https://example.com/product",
        body: "Product details",
        footer: "Special price",
        priceAmount1000: 50000,
        currencyCode: "USD",
        buttons: [{
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: "Buy Now",
                url: "https://example.com/buy"
            })
        }]
    }
}, { quoted: m });
```
</details>

<details>
<summary><b>Interactive message with document buffer (full)</b></summary>

> Documents in `interactiveMessage` only support **buffer** input.

```javascript
await sock.sendMessage(target, {
    interactiveMessage: {
        header: "#DANZBAILS",
        title: "#DANZBAILS",
        footer: "t.me/yourhandle",
        document: fs.readFileSync("./package.json"),
        mimetype: "application/pdf",
        fileName: "document.pdf",
        jpegThumbnail: fs.readFileSync("./document.jpeg"),
        contextInfo: {
            mentionedJid: [target],
            forwardingScore: 777,
            isForwarded: false
        },
        externalAdReply: {
            title: "#DANZBAILS",
            body: "#DANZBAILS",
            mediaType: 3,
            thumbnailUrl: "https://example.com/image.jpg",
            mediaUrl: "https://example.com",
            sourceUrl: "https://t.me/yourhandle",
            showAdAttribution: true,
            renderLargerThumbnail: false
        },
        buttons: [{
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: "Telegram",
                url: "https://t.me/yourhandle",
                merchant_url: "https://t.me/yourhandle"
            })
        }]
    }
}, { quoted: m });
```
</details>

<details>
<summary><b>Interactive message with document buffer (simple)</b></summary>

```javascript
await sock.sendMessage(target, {
    interactiveMessage: {
        header: "#DANZBAILS",
        title: "#DANZBAILS",
        footer: "t.me/yourhandle",
        document: fs.readFileSync("./package.json"),
        mimetype: "application/pdf",
        fileName: "document.pdf",
        jpegThumbnail: fs.readFileSync("./document.jpeg"),
        buttons: [{
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: "Telegram",
                url: "https://t.me/yourhandle",
                merchant_url: "https://t.me/yourhandle"
            })
        }]
    }
}, { quoted: m });
```
</details>

<details>
<summary><b>Payment request</b></summary>

```javascript
let quotedType = m.quoted?.mtype || '';
let quotedContent = JSON.stringify({ [quotedType]: m.quoted }, null, 2);

await sock.sendMessage(target, {
    requestPaymentMessage: {
        currency: "IDR",
        amount: 10000000,
        from: m.sender,
        sticker: JSON.parse(quotedContent),
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
}, { quoted: m });
```
</details>

---

## 🔍 Why This Fork?

| | Vanilla Baileys | DanzBails |
|---|:---:|:---:|
| WebSocket-based, no browser | ✅ | ✅ |
| Multi-device support | ✅ | ✅ |
| Custom pairing-code stability fixes | — | ✅ |
| Styled console logger + boxed pairing output | — | ✅ |
| Extended message types (album, event, poll result, product, native-flow) | — | ✅ |
| Change log tracked against upstream base | — | ✅ |

---

## 📄 License

Released under the [MIT License](./LICENSE).

## 🙌 Credits

Built and maintained by **[@danzzmy](https://github.com/danzzmy)**.
Repo: [github.com/danzzmy/Danz-Bails](https://github.com/danzzmy/Danz-Bails)

<div align="center">
<sub>DanzBails — built for stability, styled for readability.</sub>
</div>
