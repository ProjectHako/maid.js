export class MPayGetDeviceError extends Error {
	readonly errorCode: MPayErrorCodeEnum
	readonly response: object | null
	constructor (message: string, errorCode: MPayErrorCodeEnum, response?: object) {
		super(message)
		this.message = `Unable to get mpay device: ${message}`
		this.errorCode = errorCode
		if (response !== undefined) {
			this.response = response
		} else {
			this.response = null
		}
	}
}

export class MPayClientLoginError extends Error {
	readonly errorCode: MPayErrorCodeEnum
	readonly response: object | null
	constructor (message: string, errorCode: MPayErrorCodeEnum, response?: object) {
		super(message)
		this.message = `Unable to login mpay: ${message}`
		this.errorCode = errorCode
		if (response !== undefined) {
			this.response = response
		} else {
			this.response = null
		}
	}
}

export class MPayClientError extends Error {
	readonly errorCode: MPayErrorCodeEnum
	readonly response: object | null
	constructor (message: string, errorCode: MPayErrorCodeEnum, response?: object) {
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

/** MPay 请求错误码 */
export enum MPayRequestErrorCodeEnum {
	/** 参数不正确 */
	PARAMS_INCORRECT = 1003,
	/** 用户名格式不正确 */
	ACCOUNT_FORMAT_INCORRECT = 1300,
	/** 用户名或密码不正确 */
	INCORRECT_ACCOUNT_OR_PASSWORD = 1301,
	/** 风险验证 */
	ACCOUNT_AT_RISK = 1351,
}

/** 来自库定义的错误码（字符串） */
export enum MPayErrorCodeEnum {
	/** 参数不正确 */
	ParamsIncorrect = 'PARAMS_INCORRECT',
	/** 用户名格式不正确 */
	AccountFormatIncorrect = 'ACCOUNT_FORMAT_INCORRECT',
	/** 用户名或密码不正确 */
	IncorrectAccountOrPassword = 'INCORRECT_ACCOUNT_OR_PASSWORD',
	/** 风险验证 */
	AccountAtRisk = 'ACCOUNT_AT_RISK',
	// client errors
	/** 未登录 */
	NoMPayLogin = 'NO_MPAY_LOGIN',
	/** 不要重复登录 */
	DoNotLoginAgain = 'DO_NOT_LOGIN_AGAIN',
	/** 网络错误 */
	NetworkError = 'NETWORK_ERROR',
	/** 其他错误（遇到了请提交issues） */
	OtherError = 'OTHER_ERROR',
}
