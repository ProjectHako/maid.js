import { getX19ReleaseInfo, type X19ReleaseInfo } from './rest/release_info'
import { getX19ReleaseInfoPE, type X19ReleaseInfoPE } from './rest/release_info_pe'
import { getX19AuthServerList } from './rest/auth_server_list'
import { getX19PatchList } from './rest/patch_list'
import { X19SessionError, X19SessionErrorCodeEnum } from './errors'

export class X19Session {
	#_isInit: boolean = false
	#_authServerList: object[] | undefined
	#_patchList: object | undefined
	#_releaseInfo: X19ReleaseInfo | undefined
	#_releaseInfoPE: X19ReleaseInfoPE | undefined
	#_latestPatchVersion: string = '1.0.0.0'
	#_userAgent: string = 'WPFLauncher/0.0.0.0'
	isInit (): boolean {
		return this.#_isInit
	}

	/** PC端验证服务器列表 */
	get authServerList (): object[] {
		if (!this.#_isInit) {
			throw Error('Please init session first!')
		}
		return (this.#_authServerList as object[])
	}

	/** PC端补丁列表 */
	get patchList (): object {
		if (!this.#_isInit) {
			throw Error('Please init session first!')
		}
		return (this.#_patchList as object)
	}

	/** PC端基本服务器URL信息 */
	get releaseInfo (): X19ReleaseInfo {
		if (!this.#_isInit) {
			throw Error('Please init session first!')
		}
		return (this.#_releaseInfo as X19ReleaseInfo)
	}

	/** 手机端基本服务器URL信息 */
	get releaseInfoPE (): X19ReleaseInfoPE {
		if (!this.#_isInit) {
			throw Error('Please init session first!')
		}
		return (this.#_releaseInfoPE as X19ReleaseInfoPE)
	}

	/** PC端最新的补丁版本号 */
	get latestPatchVersion (): string {
		if (!this.#_isInit) {
			throw Error('Please init session first!')
		}
		return this.#_latestPatchVersion
	}

	/** 用于请求的userAgent */
	get userAgent (): string {
		if (!this.#_isInit) {
			throw Error('Please init session first!')
		}
		return this.#_userAgent
	}

	/** 需要先调用此方法初始化，然后才可以使用Session。
	 * 为什么不在constructor进行？因为在js中constructor不支持promise
	*/
	async initSession (): Promise<void> {
		if (this.#_isInit) {
			throw new X19SessionError('do not init again!', X19SessionErrorCodeEnum.DoNotInitAgain)
		}
		// release info
		this.#_releaseInfo = await getX19ReleaseInfo()
		this.#_releaseInfoPE = await getX19ReleaseInfoPE()
		// patch list
		this.#_patchList = await getX19PatchList()
		// 检查是否处于维护状态
		if ((this.#_releaseInfo.ServerStop !== undefined && this.#_releaseInfo.ServerStop === '1') || (this.#_releaseInfo.TempServerStop === 1)) {
			throw new X19SessionError('服务器维护中，请留意官方公告。', X19SessionErrorCodeEnum.ServerMaintenance)
		}
		// auth server
		this.#_authServerList = await getX19AuthServerList(this.#_releaseInfo.AuthServerUrl)
		if (this.#_authServerList.length === 0) {
			throw new X19SessionError('验证服务器离线。', X19SessionErrorCodeEnum.ServerMaintenance)
		}
		// update patch
		this.updateLatestPatch()
		this.#_isInit = true
	}

	private updateLatestPatch (): void {
		const patchVersionList = Object.keys(this.#_patchList as object)
		this.#_latestPatchVersion = patchVersionList[patchVersionList.length - 1]
		this.#_userAgent = `WPFLauncher/${patchVersionList[patchVersionList.length - 1]}`
	}
}
