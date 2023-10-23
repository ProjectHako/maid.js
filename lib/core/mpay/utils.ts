import * as crypto from 'crypto'
import { randomUUID } from 'crypto'

export function randomDesktopName (): string {
	const dict: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
	let result = 'DESKTOP-'
	for (let i = 0; i < 7; i++) {
		result = result + dict[crypto.randomInt(0, 35)]
	}
	return result
}

export function randomMacAddress (): string {
	const macAddress: string[] = []
	for (let i = 0; i < 6; i++) {
		macAddress.push(crypto.randomBytes(1).toString('hex'))
	}
	return macAddress.join(':')
}

export function randomUniqueId (): string {
	return randomUUID().replace(/-/g, '').toUpperCase()
}

export const randomUdid = randomUniqueId

export function randomTransactionId (): string {
	return `${randomUUID()}-2`
}

export function randomProcessId (): string {
	return crypto.randomInt(1001, 10000).toString()
}
