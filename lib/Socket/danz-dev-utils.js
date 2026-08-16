import { downloadMediaMessage } from '../Utils/messages.js'
import { isJidGroup, isPnUser, isLidUser, isJidBroadcast, isJidNewsletter, isJidStatusBroadcast } from '../WABinary/jid-utils.js'

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Attaches convenience methods to the socket that wrap common patterns
 * (reply-with-quote, media download, JID classification, throttled broadcast).
 * None of these touch the protocol layer — they're thin wrappers around
 * existing sock methods, kept separate so they're easy to audit or opt out of.
 */
export function attachDanzDevUtils(sock) {
	/**
	 * Send a message quoting another one, without repeating the sendMessage
	 * boilerplate every time.
	 *   sock.reply(jid, 'hello')
	 *   sock.reply(jid, { image: buffer, caption: 'hi' }, m)
	 */
	sock.reply = async (jid, content, quoted) => {
		const message = typeof content === 'string' ? { text: content } : content
		return sock.sendMessage(jid, message, quoted ? { quoted } : undefined)
	}

	/**
	 * Downloads the media in a message and returns a Buffer.
	 * Handles the reupload-required retry path automatically.
	 *   const buffer = await sock.downloadMedia(m)
	 */
	sock.downloadMedia = async (message, type = 'buffer') => {
		return downloadMediaMessage(message, type, {}, {
			logger: sock.logger,
			reuploadRequest: sock.updateMediaMessage
		})
	}

	/**
	 * Boolean shortcut over onWhatsApp — just answers "is this number on WhatsApp".
	 *   if (await sock.isRegistered('628123456789@s.whatsapp.net')) { ... }
	 */
	sock.isRegistered = async (jid) => {
		const result = await sock.onWhatsApp(jid)
		return result?.[0]?.exists === true
	}

	/**
	 * Classifies a JID into a single readable type.
	 *   sock.getJidType(jid) -> 'group' | 'user' | 'broadcast' | 'newsletter' | 'status' | 'unknown'
	 */
	sock.getJidType = (jid) => {
		if (!jid) return 'unknown'
		if (isJidStatusBroadcast(jid)) return 'status'
		if (isJidNewsletter(jid)) return 'newsletter'
		if (isJidGroup(jid)) return 'group'
		if (isJidBroadcast(jid)) return 'broadcast'
		if (isPnUser(jid) || isLidUser(jid)) return 'user'
		return 'unknown'
	}

	/**
	 * Sends the same message to a list of JIDs with a delay between each
	 * send, to stay well clear of WhatsApp's anti-spam thresholds.
	 *   await sock.broadcastMessage(jids, { text: 'hi' }, { delayMs: 1500 })
	 */
	sock.broadcastMessage = async (jids, content, options = {}) => {
		const delayMs = options.delayMs ?? 1500
		const results = []

		for (const jid of jids) {
			try {
				const sent = await sock.sendMessage(jid, content)
				results.push({ jid, ok: true, id: sent?.key?.id })
			} catch (err) {
				results.push({ jid, ok: false, error: err?.message })
			}
			await delay(delayMs)
		}

		return results
	}

	return sock
}
