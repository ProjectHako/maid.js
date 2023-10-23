import { type MPayAppInfo, type MPayDevice } from './devices'
import * as crypto from 'crypto'
import axios, { type AxiosError } from 'axios'
import { randomUniqueId } from './utils'
import { MPayClientError, MPayClientLoginError, MPayErrorCodeEnum, MPayRequestErrorCodeEnum } from './errors'

/** MPay 基础客户端 */
export class MPayBaseClient {
	#isLogin: boolean = false
	readonly #mpayDevice: MPayDevice
	#username: string = ''
	#loginToken: string = ''
	#mpayUserId: string = ''
	#isRealname: boolean = false

	/** 是否已实名，登录后才可操作 */
	get isRealname (): boolean {
		if (!this.#isLogin) {
			throw new MPayClientError('Please login MPay first!', MPayErrorCodeEnum.NoMPayLogin)
		}
		return this.#isRealname
	}

	/** 获取该MPay 基础客户端的用户登录token、用户ID等信息 */
	dumpUserData (): MPayClientUserDumpData {
		if (!this.#isLogin) {
			throw new MPayClientError('Please login MPay first!', MPayErrorCodeEnum.NoMPayLogin)
		}
		return {
			token: this.#loginToken,
			mpayUserId: this.#mpayUserId,
			mpayDevice: this.#mpayDevice
		}
	}

	constructor (mpayDevice: MPayDevice) {
		this.#mpayDevice = mpayDevice
	}

	/** 账密登录 */
	async login (username: string, password: string, isPlainText: boolean): Promise<MPayBaseLoginUserInfo> {
		if (this.#isLogin) {
			throw new MPayClientError('do not login againnnn!', MPayErrorCodeEnum.DoNotLoginAgain)
		}
		const notEncryptParams = {
			username,
			password
			// unique_id: this.#mpayDevice.clientMPay.unique_id
		}
		if (isPlainText) {
			notEncryptParams.password = crypto.createHash('md5').update(password).digest('hex')
		}
		this.#username = notEncryptParams.username
		return await this.baseLogin(this.encryptParams(JSON.stringify(notEncryptParams)))
	}

	private async baseLogin (encryptedParams: string): Promise<MPayUserData> {
		let client
		try {
			client = await axios({
				method: 'POST',
				url: `https://service.mkey.163.com/mpay/${this.#mpayDevice.appMPay.app_type}/${this.#mpayDevice.appMPay.game_id}/devices/${this.#mpayDevice.deviceMPay.id}/users`,
				data: new URLSearchParams({
					params: encryptedParams,
					app_channel: 'netease'
				}).toString()
			})
		} catch (err) {
			const error = err as AxiosError<Error>
			if (error.response?.data !== undefined) {
				const failedResponse = error.response?.data as unknown as MPayErrorResponse
				if (failedResponse.code === MPayRequestErrorCodeEnum.INCORRECT_ACCOUNT_OR_PASSWORD) {
					throw new MPayClientLoginError(failedResponse.reason, MPayErrorCodeEnum.IncorrectAccountOrPassword)
				}
				if (failedResponse.code === MPayRequestErrorCodeEnum.ACCOUNT_FORMAT_INCORRECT) {
					throw new MPayClientLoginError(failedResponse.reason, MPayErrorCodeEnum.AccountFormatIncorrect)
				}
				if (failedResponse.code === MPayRequestErrorCodeEnum.ACCOUNT_AT_RISK) {
					throw new MPayClientLoginError(failedResponse.reason, MPayErrorCodeEnum.AccountAtRisk, failedResponse)
				}
				throw new MPayClientLoginError(failedResponse.reason, MPayErrorCodeEnum.OtherError, failedResponse)
			}
			throw new MPayClientLoginError('network error', MPayErrorCodeEnum.NetworkError)
		}
		if ((client.data as MPayBaseLoginResponse).user === undefined) {
			throw new MPayClientLoginError('cannot find user', MPayErrorCodeEnum.OtherError, client.data)
		}
		const baseLoginData = (client.data as MPayBaseLoginResponse).user
		const tokenLoginData = await this.loginByToken(baseLoginData.token, baseLoginData.id)
		this.#mpayUserId = baseLoginData.id
		this.#isRealname = tokenLoginData.realname_status !== 0
		return Object.assign(baseLoginData as object, tokenLoginData as object) as MPayUserData
	}

	/** 用token登录 */
	async loginByToken (token: string, mpayUserId: string): Promise<MPayTokenLoginUserInfo> {
		if (this.#isLogin) {
			throw new MPayClientError('do not login againnnn!', MPayErrorCodeEnum.DoNotLoginAgain)
		}
		this.#loginToken = token
		this.#mpayUserId = mpayUserId
		const getBody: MPayBaseClientTokenLoginRequestBody = {
			...this.#mpayDevice.appMPay,
			verify_status: '0',
			login_for: '1',
			app_channel: 'netease',
			token
		}
		if (this.#username !== '') {
			getBody.username = this.#username
		}
		const encodedBody = new URLSearchParams(getBody as unknown as Record<string, string>).toString()
		let client
		try {
			client = await axios({
				method: 'GET',
				url: `https://service.mkey.163.com/mpay/${this.#mpayDevice.appMPay.app_type}/${this.#mpayDevice.appMPay.game_id}/devices/${this.#mpayDevice.deviceMPay.id}/users/${mpayUserId}?${encodedBody}`
			})
		} catch (err) {
			const error = err as AxiosError<Error>
			if (error.response?.data !== undefined) {
				const failedResponse = error.response?.data as unknown as MPayErrorResponse
				throw new MPayClientLoginError(failedResponse.reason, MPayErrorCodeEnum.OtherError, failedResponse)
			}
			throw new MPayClientLoginError('network error', MPayErrorCodeEnum.NetworkError)
		}
		if (client.data.user === undefined) {
			throw new MPayClientLoginError('cannot find user', MPayErrorCodeEnum.OtherError)
		}
		this.#isLogin = true
		this.#isRealname = (client.data as MPayTokenLoginResponse).user.realname_status !== 0
		return (client.data as MPayTokenLoginResponse).user
	}

	/** 获取用于游戏的SAuth信息 */
	getSAuthJSON (gameid: string): string {
		if (!this.#isLogin) {
			throw Error('Please mpay login first')
		}
		const SAuthObj = {
			gameid,
			login_channel: 'netease',
			app_channel: 'netease',
			platform: 'pc',
			sdkuid: this.#mpayUserId,
			sessionid: this.#loginToken,
			sdk_version: '3.4.0',
			udid: this.#mpayDevice.clientMPay.udid,
			deviceid: this.#mpayDevice.deviceMPay.id,
			aim_info: '{"aim":"","country":"CN","tz":"+0800","tzid":""}',
			client_login_sn: randomUniqueId(),
			gas_token: '',
			source_platform: 'pc',
			ip: ''
		}
		return JSON.stringify(SAuthObj)
	}

	private encryptParams (params: string): string {
		const cipher = crypto.createCipheriv('AES-128-ECB', Buffer.from(this.#mpayDevice.deviceMPay.key, 'hex'), null)
		return Buffer.concat([cipher.update(params), cipher.final()]).toString('hex')
	}
}

/** MPay Token登录的返回数据 */
export interface MPayBaseClientTokenLoginRequestBody extends MPayAppInfo {
	/** 实名信息 */
	verify_status: string
	/** 登录为 */
	login_for: string
	/** Token */
	token: string
	/** 用户名 */
	username?: string
	/** 登录的channel */
	app_channel: string
}

/** MPay 账密/游客登录的Http返回数据 */
interface MPayBaseLoginResponse {
	user: MPayBaseLoginUserInfo
}

/** MPay 基础登录后的用户数据 */
export interface MPayBaseLoginUserInfo {
	/** 是否为新用户 */
	is_new_user?: boolean
	/** 附加的访问Token */
	ext_access_token?: string
	/** 登录的channel */
	login_channel: string
	/** 客户端用户名 */
	client_username: string
	/** 显示的用户名 */
	display_username: string
	/** token */
	token: string
	/** 暂时不清楚这是什么 */
	need_mask: boolean
	/** 登录类型，账密=1，游客=2 */
	login_type: number
	/** MPay 用户ID */
	id: string
}

// 其实这个就是把数据混一起返回
/** 完全的用户信息 */
export interface MPayUserData extends MPayBaseLoginUserInfo, MPayTokenLoginUserInfo {}

export interface MPayTokenLoginUserInfo {
	/** 用户名，游客没有 */
	username?: string
	/** 账号名，游客没有 */
	account?: string
	/** 实名类型，貌似是实名后才有 */
	realname_verify_status?: number
	/** 显示的用户名 */
	display_username: string
	/** 暂时不清楚 */
	need_mask: boolean
	/** 登录的channel */
	login_channel: string
	/** 绑定手机号状态 */
	mobile_bind_status: number
	/** PC端的附加信息 */
	pc_ext_info?: {
		/** 游戏ID */
		src_jf_game_id: string
		/** 登录的channel */
		src_app_channel: string
		/** 游戏ID（可能） */
		from_game_id: string
		/** 客户端类型 */
		src_client_type: number
		/** UDID */
		src_udid: string
		/** SDK版本 */
		src_sdk_version: string
		/** 支付时的channel（貌似和app_channel一样） */
		src_pay_channel: string
		/** 客户端IP */
		src_client_ip: string
		/** 附加的SDK信息 */
		extra_unisdk_data: string
	}
	/** 客户端用户名 */
	client_username: string
	/** 移动设备尝试退出游戏时的弹窗云控 */
	exit_popup_info?: object
	/** 实名状态 */
	realname_status: number
	/** 头像链接 */
	avatar: string
	/** 暂时不清楚 */
	need_aas: boolean
	/** 登录类型 */
	login_type: number
	/** 昵称（不是游戏里的） */
	nickname: string
	/** 登录时间戳 */
	login_time: number
}

/** Token登录时的Http返回信息 */
interface MPayTokenLoginResponse {
	user: MPayTokenLoginUserInfo
}

/** 执行dumpBaseLoginInfo()后给出的客户端、用户信息 */
export interface MPayClientUserDumpData {
	/** 用户名（游客没有） */
	username?: string
	/** MD5加密的密码（游客没有） */
	password?: string
	/** MPay Device信息 */
	mpayDevice: MPayDevice
	/** MPay 登录Token */
	token: string
	/** MPay 用户ID */
	mpayUserId: string
}

/** 登录的账号类型 */
export enum MPayLoginType {
	UNKNOWN = 0,
	ACCOUNT = 1,
	GUEST = 2
}

/** MPay 请求异常的返回信息 */
export interface MPayErrorResponse {
	code: number
	reason: string
	/** 账号风险验证的链接 */
	verify?: string
}
