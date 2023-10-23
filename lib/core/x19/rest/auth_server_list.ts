import axios from 'axios'
import { X19SessionError, X19SessionErrorCodeEnum } from '../errors'

export async function getX19AuthServerList (authServerListUrl: string): Promise<object[]> {
	try {
		const client = await axios({
			method: 'GET',
			url: authServerListUrl,
			headers: {
				'User-Agent': 'WPFLauncher/0.0.0.0'
			}
		})
		return client.data
	} catch (err) {
		throw new X19SessionError('Unable to get auth_server_list: network error', X19SessionErrorCodeEnum.NetworkError)
	}
}
