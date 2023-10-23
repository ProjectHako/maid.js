export class X19ClientError extends Error {
	readonly errorCode: X19ClientErrorCodeEnum
	readonly response: object | null
	constructor (message: string, errorCode: X19ClientErrorCodeEnum, response?: object) {
		super(message)
		this.message = message
		this.errorCode = errorCode
		if (response !== undefined) {
			this.response = response
		} else {
			this.response = null
		}
	}
}

export class X19ClientLoginError extends Error {
	readonly errorCode: X19ClientErrorCodeEnum
	readonly response: object | null
	constructor (message: string, errorCode: X19ClientErrorCodeEnum, response?: object) {
		super(message)
		this.message = `Unable to login x19: ${message}`
		this.errorCode = errorCode
		if (response !== undefined) {
			this.response = response
		} else {
			this.response = null
		}
	}
}

export class X19SessionError extends Error {
	readonly errorCode: X19SessionErrorCodeEnum
	readonly response: object | null
	constructor (message: string, errorCode: X19SessionErrorCodeEnum, response?: object) {
		super(message)
		this.message = `Unable to get session: ${message}`
		this.errorCode = errorCode
		if (response !== undefined) {
			this.response = response
		} else {
			this.response = null
		}
	}
}

/** Session错误码 */
export enum X19SessionErrorCodeEnum {
	ServerMaintenance = 'SERVER_MAINTENANCE',
	AuthServerOffline = 'AUTH_SERVER_OFFLINE',
	NetworkError = 'NETWORK_ERROR',
	DoNotInitAgain = 'DO_NOT_INIT_AGAIN'
}

/** 来自库定义的错误码（字符串） */
export enum X19ClientErrorCodeEnum {
	/** 参数为空 */
	ParamsEmpty = 'PARAMS_EMPTY',
	/** 参数不正确 */
	ParamsIncorrect = 'PARAMS_INCORRECT',
	/** 网易数据库错误（来源于网易本身） */
	X19DatabaseError = 'X19_DATABASE_ERROR',
	/** 登录状态过期（请先登录） */
	LoginExpired = 'LOGIN_EXPIRED',
	/** 已在其他设备登录 */
	AnotherDeviceLogged = 'ANOTHER_DEVICE_LOGGED',
	/** 账号被封禁 */
	AccountBanned = 'ACCOUNT_BANNED',
	/** 未实名 */
	NotRealname = 'NOT_REALNAME',
	/** 防沉迷 */
	AntiAddition = 'ANTI_ADDICTION',
	// client error - 来源于库本身的错误
	/** 未登录 */
	NotLogin = 'NOT_LOGIN',
	/** 不要重复登录 */
	DoNotLoginAgain = 'DO_NOT_LOGIN_AGAIN',
	/** 已登出 */
	LoggedOut = 'LOGGED_OUT',
	/** Login OTP 阶段异常 */
	LoginOTPError = 'LOGIN_OTP_ERROR',
	/** Auth OTP 阶段异常 */
	AuthOTPError = 'AUTH_OTP_ERROR',
	/** Http请求失败，一般是未定义的错误 */
	HttpRequestFailed = 'HTTP_REQUEST_FAILED',
	/** 网络异常 */
	NetworkError = 'NETWORK_ERROR'
}

export enum X19AuthOTPErrorCode {
	/** 参数为空 */
	PARAMS_EMPTY = 4,
	/** 登录状态过期（请先登录） */
	LOGIN_EXPIRED = 10,
	/** 参数不正确 */
	PARAMS_INCORRECT = 12,
	/** 网易数据库错误（来源于网易本身） */
	X19_DATABASE_ERROR = 18,
	/** 已在其他设备登录 */
	ANOTHER_DEVICE_LOGGED = 22,
	/** 被封禁 */
	BANNED = 29,
	/** 防沉迷 */
	ANTI_ADDICTION = 27002,
	/** 未实名 */
	NOT_REALNAME = 27003
}

export enum X19HttpRequestErrorCode {
	/** 参数为空 */
	PARAMS_EMPTY = 4,
	/** 参数不正确 */
	PARAMS_INCORRECT = 12,
	/** 网易数据库错误（来源于网易本身） */
	X19_DATABASE_ERROR = 18,
	/** 已在其他设备登录 */
	ANOTHER_DEVICE_LOGGED = 22
}
