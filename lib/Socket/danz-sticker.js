import { exec } from 'child_process'
import { randomBytes } from 'crypto'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function toTempFile(buffer, ext) {
	const filePath = join(tmpdir(), `danz-sticker-${randomBytes(6).toString('hex')}.${ext}`)
	await writeFile(filePath, buffer)
	return filePath
}

async function cleanup(...paths) {
	await Promise.all(paths.map(p => unlink(p).catch(() => {})))
}

/**
 * Converts a static image buffer (jpg/png/etc) to a 512x512 WEBP sticker.
 * Uses `sharp` if available (fast path), falls back to ffmpeg otherwise.
 */
async function imageToWebp(buffer) {
	try {
		const sharpModule = await import('sharp')
		const sharp = sharpModule.default
		return await sharp(buffer)
			.resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.webp({ quality: 90 })
			.toBuffer()
	} catch {
		// sharp not installed — fall back to ffmpeg
	}

	const input = await toTempFile(buffer, 'png')
	const output = input.replace(/\.png$/, '.webp')
	try {
		await execAsync(
			`ffmpeg -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=#00000000" -vcodec libwebp -lossless 0 -qscale 80 -preset default -loop 0 -an -vsync 0 "${output}" -y`
		)
		return await readFile(output)
	} finally {
		await cleanup(input, output)
	}
}

/**
 * Converts an animated buffer (gif/mp4/webm) to an animated WEBP sticker.
 * Requires ffmpeg to be available on the system PATH.
 */
async function videoToWebp(buffer, seconds = 6) {
	const input = await toTempFile(buffer, 'mp4')
	const output = input.replace(/\.mp4$/, '.webp')
	try {
		await execAsync(
			`ffmpeg -i "${input}" -t ${seconds} -filter:v "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=#00000000" -vcodec libwebp -lossless 0 -qscale 70 -preset default -loop 0 -an -vsync 0 "${output}" -y`
		)
		return await readFile(output)
	} finally {
		await cleanup(input, output)
	}
}

function buildExifPayload({ packname, author, categories, id }) {
	const json = {
		'sticker-pack-id': id || randomBytes(16).toString('hex'),
		'sticker-pack-name': packname || 'DanzBails',
		'sticker-pack-publisher': author || '@danzzmy',
		'emojis': categories?.length ? categories : ['🔥']
	}
	const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8')

	const exifHeader = Buffer.from([
		0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
		0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
	])
	const exif = Buffer.concat([exifHeader, jsonBuffer])
	exif.writeUIntLE(jsonBuffer.length, 14, 4)
	return exif
}

/**
 * Parses a WEBP buffer into its RIFF chunks so a new one can be appended.
 */
function readWebpChunks(webpBuffer) {
	const chunks = []
	let offset = 12 // skip 'RIFF' + size(4) + 'WEBP'
	while (offset < webpBuffer.length) {
		const id = webpBuffer.toString('ascii', offset, offset + 4)
		const size = webpBuffer.readUInt32LE(offset + 4)
		const sizePadded = size + (size % 2)
		chunks.push(webpBuffer.subarray(offset, offset + 8 + sizePadded))
		offset += 8 + sizePadded
	}
	return chunks
}

function setVp8xExifFlag(chunks) {
	const vp8x = chunks.find(c => c.toString('ascii', 0, 4) === 'VP8X')
	if (!vp8x) return chunks
	const flagsOffset = 8 // right after 'VP8X' + size(4)
	vp8x[flagsOffset] = vp8x[flagsOffset] | 0x08 // set EXIF bit
	return chunks
}

function injectExifChunk(webpBuffer, exifBuffer) {
	const chunks = setVp8xExifFlag(readWebpChunks(webpBuffer))

	const size = exifBuffer.length
	const sizePadded = size + (size % 2)
	const chunkHeader = Buffer.alloc(8)
	chunkHeader.write('EXIF', 0, 'ascii')
	chunkHeader.writeUInt32LE(size, 4)
	const padding = sizePadded > size ? Buffer.from([0]) : Buffer.alloc(0)
	const exifChunk = Buffer.concat([chunkHeader, exifBuffer, padding])

	const body = Buffer.concat([...chunks, exifChunk])
	const header = Buffer.alloc(8)
	header.write('RIFF', 0, 'ascii')
	header.writeUInt32LE(4 + body.length, 4)

	return Buffer.concat([header, Buffer.from('WEBP', 'ascii'), body])
}

/**
 * Converts media (image or video/gif buffer) into a ready-to-send WhatsApp
 * sticker buffer, with pack name / author metadata baked in.
 *
 * @param {Buffer} media - raw image or video/gif buffer
 * @param {object} options
 * @param {boolean} [options.animated] - treat input as video/gif (animated webp output)
 * @param {string} [options.packname] - sticker pack name shown in WhatsApp
 * @param {string} [options.author] - sticker pack publisher shown in WhatsApp
 * @param {string[]} [options.categories] - emoji tags associated with the sticker
 * @param {number} [options.seconds] - max clip length for animated stickers (default 6s)
 * @returns {Promise<Buffer>} webp buffer — pass directly to sock.sendMessage(jid, { sticker: buffer })
 */
export async function makeDanzSticker(media, options = {}) {
	const webp = options.animated
		? await videoToWebp(media, options.seconds ?? 6)
		: await imageToWebp(media)

	const exif = buildExifPayload(options)
	return injectExifChunk(webp, exif)
}
