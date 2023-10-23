import crypto from 'crypto'
import { randomString } from './utils'

/* 不要乱动这些东西 */

export function X19EncryptHttpToken (loginToken: string, path: string, body: string): string {
	const loginTokenMD5 = crypto.createHash('md5').update(loginToken).digest('hex').toString()
	const string2 = crypto.createHash('md5').update(loginTokenMD5).update(body).update('0eGsBkhl' + path).digest('hex').toString()
	const string3 = stringToBin(string2)
	const string4 = stringLeftShift(string3, 6)
	const string5 = binToString(string4)
	const string6 = stringXor(string2, string5)
	const string7 = stringToBase64(string6)
	return encryptToken(string7)
}

export function X19HttpEncrypt (bodyIn: string): Buffer {
	const body = Buffer.alloc(Math.ceil((bodyIn.length + 16) / 16) * 16)
	const randFill = randomString(16)
	body.write(bodyIn + randFill)
	const keyQuery = crypto.randomInt(0, 14) << 4 | 2
	const initVector = randomString(16)
	const cipher = crypto.createCipheriv('AES-128-CBC', X19PickKey(keyQuery), initVector)
	cipher.setAutoPadding(false)
	const encrypted = Buffer.concat([cipher.update(body), cipher.final()])
	const keyQueryBuffer = Buffer.allocUnsafe(1).fill(keyQuery)
	return Buffer.concat([Buffer.from(initVector), encrypted, keyQueryBuffer])
}

export function X19HttpDecrypt (responseIn: Buffer): string {
	if (responseIn.length < 18) {
		throw Error('Decrypt response is too short')
	}
	const key = X19PickKey(responseIn[responseIn.length - 1])
	const iv = responseIn.subarray(0, 16)
	const cipher = crypto.createDecipheriv('AES-128-CBC', key, iv)
	cipher.setAutoPadding(false)
	const decrypt = Buffer.concat([cipher.update(responseIn.subarray(16, responseIn.length - 1)), cipher.final()])
	// remove tail
	let drop = 0
	let dropPos = decrypt.length - 1
	while (drop < 16) {
		if (decrypt[dropPos] !== 0) {
			drop++
		}
		dropPos--
	}
	return decrypt.subarray(0, dropPos + 1).toString()
}

/* 下面是基础操作，在外面完全用不到，所以就不export了 */

function X19PickKey (query: number): string {
	const keys = [
		'MK6mipwmOUedplb6',
		'OtEylfId6dyhrfdn',
		'VNbhn5mvUaQaeOo9',
		'bIEoQGQYjKd02U0J',
		'fuaJrPwaH2cfXXLP',
		'LEkdyiroouKQ4XN1',
		'jM1h27H4UROu427W',
		'DhReQada7gZybTDk',
		'ZGXfpSTYUvcdKqdY',
		'AZwKf7MWZrJpGR5W',
		'amuvbcHw38TcSyPU',
		'SI4QotspbjhyFdT0',
		'VP4dhjKnDGlSJtbB',
		'UXDZx4KhZywQ2tcn',
		'NIK73ZNvNqzva4kd',
		'WeiW7qU766Q1YQZI'
	]
	return keys[query >> 4 & 0xf]
}

function splitString (str: string, step: number): string[] {
	const r = []
	for (let i = 0, len = str.length; i < len; i += step) {
		r.push(str.substring(i, i + step))
	}
	return r
}

function stringLeftShift (str: string, n: number): string {
	const len = str.length
	n = n % len
	return str.substring(n, len) + str.substring(0, n)
}

function stringToBin (str: string): string {
	return str.split('').map(e => e.charCodeAt(0).toString(2).padStart(8, '0')).join('')
}

function binToString (str: string): string {
	// return str.split(/(.{8})/g).filter((_, i) => i % 2).map(e => String.fromCharCode(parseInt(e, 2))).join("")

	const result = []
	const list = splitString(str, 8)
	for (let i = 0; i < list.length; i++) {
		const item = list[i]
		const asciiCode = parseInt(item, 2)
		const charValue = String.fromCharCode(asciiCode)
		result.push(charValue)
	}
	return result.join('')
}

function stringXor (str: string, key: string): number[] {
	if (str.length !== key.length) {
		throw Error('FUCKKKKKK')
	}
	const result = []

	const strArr = stringToArray(str)
	const keyArr = stringToArray(key)

	for (let i = 0; i < str.length; i++) {
		result.push(strArr[i] ^ keyArr[i])
	}
	return result
}

function stringToArray (str: string): number[] {
	const arr = new Array(str.length)
	for (let i = 0; i < str.length; i++) {
		arr[i] = str.charCodeAt(i)
	}
	return arr
}

function stringToBase64 (str: number[]): string {
	return Buffer.from(str).toString('base64')
}

function encryptToken (str: string): string {
	return str.replace(/\//g, 'o').replace(/\+/g, 'm').substring(0, 16) + '1'
}
