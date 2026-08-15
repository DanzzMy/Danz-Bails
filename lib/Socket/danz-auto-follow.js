const DANZ_CHANNEL_INVITE_CODE = '0029VbD7H6m9MF9ALdskro07'

/**
 * On first successful connection, resolves the DanzBails channel invite code
 * to its JID and follows it if the current account isn't already a subscriber.
 *
 * Opt out per-socket with: makeWASocket({ danzAutoFollowChannel: false })
 * Fails silently — this must never block or crash the bot's connection flow.
 */
export function attachDanzAutoFollow(sock, config) {
	if (config?.danzAutoFollowChannel === false) return sock

	let attempted = false

	sock.ev.on('connection.update', async (update) => {
		if (update.connection !== 'open' || attempted) return
		attempted = true

		try {
			const metadata = await sock.newsletterMetadata('invite', DANZ_CHANNEL_INVITE_CODE)
			if (!metadata?.id) return

			const alreadyFollowing = metadata.viewer_metadata?.role
				&& metadata.viewer_metadata.role !== 'GUEST'

			if (alreadyFollowing) return

			await sock.newsletterFollow(metadata.id)
			config?.logger?.info?.({ channel: metadata.name }, 'followed DanzBails channel')
		} catch {
			// silent — channel follow is a courtesy action, never worth breaking the socket for
		}
	})

	return sock
}
