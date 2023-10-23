import * as log4js from 'log4js'
import {
	MPayBaseClient,
	X19BaseClient,
	X19Session,
	type MPayDevice, type MPayClientUserDumpData, type X19DoRequestConfig
} from './core'
import { generateDevice } from './maid-tools'
import EventEmitter from 'events'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json')

/** 一个 Maid Client */
export class MaidClient extends EventEmitter {
	#isLogin: boolean = false

	/** 是否已登录 */
	isLogin (): boolean {
		return this.#isLogin
	}

	readonly #config: Required<Config>
	get config (): Config {
		return this.#config
	}

	#mpayClient: MPayBaseClient | null = null
	#x19Client: X19BaseClient | null = null
	#x19Session: X19Session | null = null
	/** X19Session，登录后才可获取 */
	get x19Session (): X19Session {
		if (!this.#isLogin) {
			throw Error('请登录后再操作')
		}
		return this.#x19Session as X19Session
	}

	/** 获取UID */
	get uid (): number {
		if (!this.#isLogin) {
			throw Error('请登录后再操作')
		}
		return Number(this.#x19Client?.dumpUserData().entityId)
	}

	/** 获取登录Token */
	get loginToken (): string {
		if (!this.#isLogin) {
			throw Error('请登录后再操作')
		}
		return this.#x19Client?.dumpUserData().token as string
	}

	/** 日志记录器 */
	logger: log4js.Logger

	/** 修改日志级别 */
	setLogLevel (level: LogLevel): void {
		(this.logger).level = level
		this.#config.logLevel = level
	}

	constructor (conf?: Config) {
		super()
		this.#config = {
			logLevel: 'info' as LogLevel,
			account: '',
			password: '',
			isPlainTextPassword: true,
			mpayDevice: null,
			mpayDumpData: null,
			x19Session: null,
			clientName: 'client-main',
			...conf
		}
		this.logger = log4js.getLogger(`[Maid-${this.#config.clientName}]`)
		this.setLogLevel(this.#config.logLevel)
		this.logger.mark('--------------------------')
		this.logger.mark(` Maid.js Version: ${pkg.version as string}`)
		this.logger.mark(' Releases: https://github.com/ProjectHako/maid.js/releases')
		this.logger.mark('--------------------------')
	}

	/** 登录到X19 */
	async login (): Promise<void> {
		if (this.#isLogin) {
			throw Error('请不要重复登录')
		}
		this.logger.mark('正在登录账号，请稍等...')
		// if mpay dump data exists
		if (this.#config.mpayDumpData !== null) {
			this.#mpayClient = new MPayBaseClient(this.#config.mpayDumpData.mpayDevice)
			const loginData = await this.#mpayClient.loginByToken(this.#config.mpayDumpData.token, this.#config.mpayDumpData.mpayUserId)
			this.logger.mark(`MPay-成功使用MPayClientUserDumpData快捷登录，账号类型：${loginData.login_type}`)
		} else {
			// else?
			if (this.#config.mpayDevice === null) {
				this.#config.mpayDevice = await generateDevice()
				this.logger.warn('MPay-已经生成了新的设备信息，不推荐一直在代码中保持该状态')
				this.logger.warn('MPay-如果条件允许，请在config中传入通过MaidTools获取的MPayDevice')
			}
			this.#mpayClient = new MPayBaseClient(this.#config.mpayDevice)
			await this.#mpayClient.login(this.#config.account, this.#config.password, this.#config.isPlainTextPassword)
			this.logger.mark('MPay-成功通过账密登录')
		}
		// if x19Session exists
		if (this.#config.x19Session !== null) {
			this.#x19Session = this.#config.x19Session
			this.logger.warn('X19-已使用config中传入的X19Session，请确保目前情况确实需要')
		} else {
			this.#x19Session = new X19Session()
			await this.#x19Session.initSession()
		}
		// login x19
		this.#x19Client = new X19BaseClient(
			this.#mpayClient?.getSAuthJSON('x19'),
			this.#x19Session.releaseInfo,
			this.#x19Session.latestPatchVersion,
			this.#x19Session.userAgent,
			this.#mpayClient?.dumpUserData().mpayDevice
		)
		await this.#x19Client?.login()
		this.#isLogin = true
		this.#x19Client.on('onRefreshToken', () => {
			this.logger.mark('X19-触发了刷新Token操作')
		})
		this.logger.info('成功登录到X19，enjoy it :)')
	}

	/** 退出登录 */
	logout (): void {
		if (!this.#isLogin) {
			throw Error('请登录后再操作')
		}
		this.#x19Client?.logout()
		this.logger.info('成功退出登录')
	}

	/** 构造X19的基本请求，只支持传object，剩下的会帮你处理好 */
	async doRequest (url: string, path: string, config: X19DoRequestConfig): Promise<object> {
		if (!this.#isLogin) {
			throw Error('请登录后再操作')
		}
		return await this.#x19Client?.doRequest(url, path, config) as object
	}
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'mark' | 'off'

/** Maid Client 配置 */
export interface Config {
	/** 日志等级，默认info，不需要的话可以直接off */
	logLevel?: LogLevel
	/** 账户 */
	account?: string
	/** 账户的密码 */
	password?: string
	/** 密码是否为明文 */
	isPlainTextPassword: boolean
	/** MPay Device，方便执行“同设备登录” */
	mpayDevice?: null | MPayDevice
	/** MPay Client dumpData，方便快捷登录 */
	mpayDumpData?: null | MPayClientUserDumpData
	/** X19Session，方便快捷登录 */
	x19Session?: null | X19Session
	/** 客户端名称，用于log中标记 */
	clientName?: string
}
