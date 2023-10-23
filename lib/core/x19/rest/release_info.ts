import axios from 'axios'
import { X19SessionError, X19SessionErrorCodeEnum } from '../errors'

export async function getX19ReleaseInfo (): Promise<X19ReleaseInfo> {
	try {
		const client = await axios({
			method: 'GET',
			url: 'https://x19.update.netease.com/serverlist/release.json',
			headers: {
				'User-Agent': 'WPFLauncher/0.0.0.0'
			}
		})
		return client.data as X19ReleaseInfo
	} catch {
		throw new X19SessionError('Unable to get release_info: network error', X19SessionErrorCodeEnum.NetworkError)
	}
}

export interface X19ReleaseInfo {
	HostNum: number
	ServerHostNum: number
	TempServerStop: number
	ServerStop?: string
	CdnUrl: string
	StaticWebVersionUrl: string
	SeadraUrl: string
	EmbedWebPageUrl: string
	NewsVideo: string
	GameCenter: string
	VideoPrefix: string
	ComponentCenter: string
	GameDetail: string
	CompDetail: string
	LiveUrl: string
	ForumUrl: string
	WebServerUrl: string
	WebServerGrayUrl: string
	CoreServerUrl: string
	TransferServerUrl: string
	PeTransferServerUrl: string
	PeTransferServerHttpUrl: string
	TransferServerHttpUrl: string
	PeTransferServerNewHttpUrl: string
	AuthServerUrl: string
	AuthServerCppUrl: string
	AuthorityUrl: string
	CustomerServiceUrl: string
	ChatServerUrl: string
	PathNUrl: string
	PePathNUrl: string
	MgbSdkUrl: string
	DCWebUrl: string
	ApiGatewayUrl: string
	ApiGatewayGrayUrl: string
	PlatformUrl: string
	RentalTransferUrl: string
}
