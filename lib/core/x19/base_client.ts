import { type X19ReleaseInfo } from './rest/release_info'
import crypto from 'crypto'
import * as schedule from 'node-schedule'
import { type MPayDevice } from '../mpay/devices'
import { X19EncryptHttpToken, X19HttpDecrypt, X19HttpEncrypt } from './cipher'
import { X19AuthOTPErrorCode, X19ClientError, X19ClientErrorCodeEnum, X19ClientLoginError } from './errors'
import EventEmitter from 'events'
import axios from 'axios'

/** X19 基础客户端 */
export class X19BaseClient extends EventEmitter {
	#_isLogin: boolean = false
	#_isLogout: boolean = false
	readonly #_SAuthJSON: string
	readonly #_releaseInfo: X19ReleaseInfo
	readonly #_userAgent: string
	readonly #_mpayDevice: MPayDevice
	readonly #_X19Version: string
	#refreshTokenSchedule: schedule.Job | null = null
	// x19 entity id & token
	#_userEntityId: string = ''
	#_userLoginToken: string = ''

	get uid (): string {
		return this.#_userEntityId
	}

	get token (): string {
		return this.#_userEntityId
	}

	/** 用于获取loginToken和entityId，进行自定义操作 */
	dumpUserData (): X19UserData {
		if (!this.#_isLogin) {
			throw new X19ClientError('please login x19 first', X19ClientErrorCodeEnum.NotLogin)
		}
		return {
			entityId: this.#_userEntityId,
			token: this.#_userLoginToken
		}
	}

	constructor (SAuthJSON: string, releaseInfo: X19ReleaseInfo, version: string, userAgent: string, mpayDevice: MPayDevice) {
		super()
		this.#_SAuthJSON = SAuthJSON
		this.#_releaseInfo = releaseInfo
		this.#_userAgent = userAgent
		this.#_mpayDevice = mpayDevice
		this.#_X19Version = version
	}

	/** 登录 */
	async login (): Promise<boolean> {
		if (this.#_isLogin) {
			throw new X19ClientError('do not login again!', X19ClientErrorCodeEnum.DoNotLoginAgain)
		}
		if (this.#_isLogout) {
			throw new X19ClientError('logged out!', X19ClientErrorCodeEnum.LoggedOut)
		}
		// otp login
		let otpClient
		try {
			otpClient = await axios({
				method: 'POST',
				url: `${this.#_releaseInfo.CoreServerUrl}/login-otp`,
				data: {
					sauth_json: this.#_SAuthJSON
				}
			})
		} catch (err) {
			throw new X19ClientLoginError('LoginOTP: network error', X19ClientErrorCodeEnum.NetworkError)
		}
		const otpResponse = otpClient.data as X19LoginOTPResponse
		if (otpResponse.code !== 0) {
			throw new X19ClientLoginError(`LoginOTP: ${otpResponse.message}`, X19ClientErrorCodeEnum.LoginOTPError, otpResponse)
		}
		// authentication
		const saData = {
			os_name: 'windows',
			os_ver: 'Microsoft Windows 11',
			mac_addr: crypto.randomBytes(6).toString('hex').toUpperCase(),
			udid: this.#_mpayDevice.clientMPay.udid,
			app_ver: '0.0.0.0',
			sdk_ver: '',
			network: '',
			disk: crypto.randomBytes(4).toString('hex'),
			is64bit: '1',
			video_card1: 'Nvidia RTX 4090',
			video_card2: '',
			video_card3: '',
			video_card4: '',
			launcher_type: 'PC_java',
			pay_channel: 'netease'
		}
		const authBody = {
			sa_data: JSON.stringify(saData),
			sauth_json: this.#_SAuthJSON,
			version: {
				version: this.#_X19Version,
				launcher_md5: '',
				updater_md5: ''
			},
			sdkuid: null,
			aid: otpResponse.entity.aid.toString(),
			hasMessage: false,
			hasGmail: false,
			otp_token: otpResponse.entity.otp_token,
			otp_pwd: null,
			lock_time: 0,
			env: null,
			min_engine_version: null,
			min_patch_version: null,
			verify_status: 0,
			unisdk_login_json: null,
			entity_id: null
		}
		await this.authOTPBase(authBody, false)
		this.#_isLogin = true
		// refresh token
		this.#refreshTokenSchedule = schedule.scheduleJob('0 0/15 * * * ? ', async () => {
			this.emit('onRefreshToken')
			await this.refreshToken()
		})
		return true
	}

	logout (): void {
		if (!this.#_isLogin) {
			throw new X19ClientError('please login x19 first', X19ClientErrorCodeEnum.NotLogin)
		}
		this.#refreshTokenSchedule?.cancel()
	}

	/** Auth OTP 阶段，包括刷新loginToken的操作 */
	private async authOTPBase (body: object, isRefreshToken: boolean): Promise<void> {
		let path, token, client
		const authData = JSON.stringify(body)
		const encryptedAuthData = X19HttpEncrypt(authData)

		if (isRefreshToken) {
			path = '/authentication/update'
			token = X19EncryptHttpToken(this.#_userLoginToken, '/authentication/update', authData)
		} else {
			path = '/authentication-otp'
			token = X19EncryptHttpToken(this.#_userLoginToken, '/authentication-otp', authData)
		}

		try {
			client = await axios({
				method: 'POST',
				url: `${this.#_releaseInfo.CoreServerUrl}${path}`,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'User-Agent': this.#_userAgent,
					'user-id': this.#_userEntityId,
					'user-token': token
				},
				data: encryptedAuthData,
				responseType: 'arraybuffer'
			})
		} catch (err) {
			throw new X19ClientLoginError('AuthOTP: network error', X19ClientErrorCodeEnum.NetworkError)
		}
		const authResponseObject = JSON.parse(X19HttpDecrypt(client.data)) as X19AuthOTPResponse
		if (authResponseObject.code !== 0) {
			if (authResponseObject.code === X19AuthOTPErrorCode.BANNED) {
				throw new X19ClientLoginError(authResponseObject.message, X19ClientErrorCodeEnum.AccountBanned, authResponseObject)
			}
			if (authResponseObject.code === X19AuthOTPErrorCode.NOT_REALNAME) {
				throw new X19ClientLoginError(authResponseObject.message, X19ClientErrorCodeEnum.NotRealname)
			}
			if (authResponseObject.code === X19AuthOTPErrorCode.ANTI_ADDICTION) {
				throw new X19ClientLoginError(authResponseObject.message, X19ClientErrorCodeEnum.AntiAddition)
			}
			// 那我也不知道发生什么了，你自己帮我看看吧，记得提issues
			throw new X19ClientLoginError(authResponseObject.message, X19ClientErrorCodeEnum.AuthOTPError, authResponseObject)
		}
		this.#_userEntityId = authResponseObject.entity.entity_id
		this.#_userLoginToken = authResponseObject.entity.token
	}

	/** 刷新loginToken */
	private async refreshToken (): Promise<void> {
		await this.authOTPBase({ entity_id: this.#_userEntityId }, true)
	}

	/** 构造一个普通请求，只支持传object。转换字符串的事情，maid.js会帮你做好 */
	async doRequest (url: string, path: string, config: X19DoRequestConfig): Promise<object> {
		if (!this.#_isLogin) {
			throw new X19ClientError('please login!', X19ClientErrorCodeEnum.NotLogin)
		}

		const conf: X19DoRequestConfig = {
			headers: {},
			body: {},
			...config
		}

		const bodyStr = JSON.stringify(conf.body)

		const header = {
			'Content-Type': 'application/json; charset=utf-8',
			'User-Agent': this.#_userAgent,
			'user-id': this.#_userEntityId,
			'user-token': X19EncryptHttpToken(this.#_userLoginToken, path, bodyStr),
			...conf.headers
		}

		let client
		try {
			client = await axios({
				method: 'POST',
				url: url + path,
				data: conf.body,
				headers: header,
				// axios自动加引号的行为就是个几把
				transformRequest: [
					function (data, headers) {
						return data.replace(/"/g, '')
					}
				]
			})
		} catch (e) {
			throw new X19ClientError('network error', X19ClientErrorCodeEnum.NetworkError)
		}
		const httpResponse = client.data as X19HttpResponse
		if (httpResponse.code !== 0) {
			if (httpResponse.code === X19AuthOTPErrorCode.BANNED) {
				throw new X19ClientError(httpResponse.message, X19ClientErrorCodeEnum.AccountBanned, httpResponse)
			}
			if (httpResponse.code === X19AuthOTPErrorCode.ANTI_ADDICTION) {
				throw new X19ClientError(httpResponse.message, X19ClientErrorCodeEnum.AntiAddition)
			}
			// 那我也不知道发生什么了，你自己帮我看看吧，记得提issues
			throw new X19ClientError(httpResponse.message, X19ClientErrorCodeEnum.HttpRequestFailed, httpResponse)
		}
		return httpResponse
	}
}

/** Login OTP 阶段的返回信息 */
interface X19LoginOTPResponse {
	code: number
	message: string
	details: string
	entity: {
		otp: number
		otp_token: string
		aid: number
		lock_time: number
		open_otp: number
	}
}

/** Auth OTP 阶段的返回信息 */
interface X19AuthOTPResponse {
	code: number
	message: string
	details: string
	entity: {
		entity_id: string
		account: string
		token: string
		sead: string
		hasMessage: boolean
		aid: string
		sdkuid: string
		access_token: string
		unisdk_login_json: string
		verify_status: number
		hasGmail: false
		is_register: false
		autopatch: object[]
		env: string
		last_server_up_time: number
		min_engine_version: string
		min_patch_version: string
	}
}

/** 导出的entityId和loginToken */
interface X19UserData {
	entityId: string
	token: string
}

/** 普通构造请求的返回信息 */
interface X19HttpResponse {
	code: number
	message: string
	details: string
	entity?: object | null
	/** 返回内容比较多就会有这个 */
	entities?: any[]
}

/** 构建请求时的配置 */
export interface X19DoRequestConfig {
	/** 追加的请求头 */
	headers?: object
	/** 请求的body */
	body?: any
}
