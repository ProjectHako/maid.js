import axios from 'axios'
import { X19SessionError, X19SessionErrorCodeEnum } from '../errors'

export async function getX19ReleaseInfoPE (): Promise<X19ReleaseInfoPE> {
	try {
		const client = await axios({
			method: 'GET',
			url: 'https://g79.update.netease.com/serverlist/adr_release.0.17.json',
			headers: {
				'User-Agent': 'Okhttp/3.1.25'
			}
		})
		return client.data as X19ReleaseInfoPE
	} catch {
		throw new X19SessionError('Unable to get release_info_pe: network error', X19SessionErrorCodeEnum.NetworkError)
	}
}

export interface X19ReleaseInfoPE {
	HostNum: number
	ServerHostNum: number
	TempServerStop: number
	CdnUrl: string
	H5VersionUrl: string
	SeadraUrl: string
	HomeServerUrl: string
	HomeServerGrayUrl: string
	WebServerUrl: string
	WebServerGrayUrl: string
	CoreServerUrl: string
	CoreServerGrayUrl: string
	TransferServerUrl: string
	TransferServerHttpUrl: string
	TransferServerNewHttpUrl: string
	MomentUrl: string
	ForumUrl: string
	AuthServerUrl: string
	ChatServerUrl: string
	PathNUrl: string
	PePathNUrl: string
	PathNIpv6Url: string
	PePathNIpv6Url: string
	LinkServerUrl: string
	ApiGatewayUrl: string
	ApiGatewayWeiXinUrl: string
	ApiGatewayGrayUrl: string
	communityHost: string
	WelfareUrl: string
	DCWebUrl: string
	RentalTransferUrl: string
	MgbSdkUrl: string
}
