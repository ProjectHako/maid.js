import axios from 'axios'
import { X19SessionError, X19SessionErrorCodeEnum } from '../errors'

export async function getX19PatchList (): Promise<object> {
	try {
		const client = await axios({
			method: 'GET',
			url: 'https://x19.update.netease.com/pl/x19_java_patchlist',
			headers: {
				'User-Agent': 'WPFLauncher/0.0.0.0'
			}
		})
		return JSON.parse(`{${(client.data as string).slice(0, -2)}}`)
	} catch {
		throw new X19SessionError('Unable to get patch_list: network error', X19SessionErrorCodeEnum.NetworkError)
	}
}
