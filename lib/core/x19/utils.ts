import crypto from 'crypto'

export function randomString (len: number): string {
	const dict: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
	let result = ''
	for (let i = 0; i < len; i++) {
		result = result + dict[crypto.randomInt(0, 61)]
	}
	return result
}
