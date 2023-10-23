import { randomDesktopName, randomMacAddress, randomProcessId, randomTransactionId, randomUniqueId } from './utils'
import axios, { type AxiosError } from 'axios'
import { randomString } from '../x19/utils'
import { MPayErrorCodeEnum, MPayGetDeviceError, MPayRequestErrorCodeEnum } from './errors'

/** 获取一个随机的MPay Device */
export async function getRandomMPayDevice (): Promise<MPayDevice> {
	const clientMPay = generateAndroidMobile()
	const appMPay = generateForX19PC()
	const deviceMPay = await getMPayDeviceBase(clientMPay, appMPay)
	return {
		clientMPay,
		appMPay,
		deviceMPay
	}
}

/** 如果你有信息照样是可以自己去传入 */
async function getMPayDeviceBase (clientMPay: MPayClientInfo, appMPay: MPayAppInfo): Promise<MPayDeviceInfo> {
	const bind = Object.assign(clientMPay, appMPay) as unknown as Record<string, string>
	const bodyData = new URLSearchParams(bind).toString()
	let client
	try {
		client = await axios({
			method: 'POST',
			url: `https://service.mkey.163.com/mpay/${appMPay.app_type}/${appMPay.game_id}/devices`,
			data: bodyData
		})
	} catch (err) {
		const error = err as AxiosError<Error>
		if (error.response !== undefined) {
			const errorObject = error.response.data as unknown as MPayDeviceErrorResponse
			if (errorObject.code === MPayRequestErrorCodeEnum.ACCOUNT_AT_RISK) {
				throw new MPayGetDeviceError(errorObject.reason, MPayErrorCodeEnum.AccountAtRisk, errorObject)
			}
			throw new MPayGetDeviceError('other error', MPayErrorCodeEnum.OtherError, errorObject)
		}
		throw new MPayGetDeviceError('network error', MPayErrorCodeEnum.NetworkError)
	}
	return (client.data as MPayDeviceResponse).device
}

/** 生成PC的系统信息 */
export function generatePC (): MPayClientInfo {
	return {
		brand: 'Microsoft',
		device_model: 'pc_mode',
		device_name: randomDesktopName(),
		device_type: 'Computer',
		mac: randomMacAddress(),
		resolution: '1920*1080',
		system_name: 'windows',
		system_version: '11',
		udid: randomString(10),
		unique_id: randomUniqueId()
	}
}

/** 生成一个安卓设备的系统信息 */
export function generateAndroidMobile (): MPayClientInfo {
	return {
		brand: 'Xiaomi',
		device_model: '2210132C', // 谁能送我一台 Xiaomi 13 Pro ，谢谢喵
		device_name: '2210132C',
		device_type: 'mobile',
		mac: randomMacAddress(),
		resolution: '3200*1440',
		system_name: 'Android',
		system_version: '13',
		udid: randomString(10),
		unique_id: randomUniqueId()
	}
}

/** 生成一个PC的SDK信息 */
export function generateForX19PC (version: string = '0.0.0.0'): MPayAppInfo {
	return {
		app_mode: '2',
		app_type: 'games',
		arch: 'win_x32',
		cv: 'c3.1.2',
		game_id: 'aecfrxodyqaaaajp-g-x19',
		gv: version, // latest patch version
		mcount_app_key: 'EEkEEXLymcNjM42yLY3Bn6AO15aGy4yq',
		mcount_app_transaction_id: randomTransactionId(),
		opt_fields: 'nickname,avatar,realname_status,mobile_bind_status',
		process_id: randomProcessId(),
		sv: '10',
		updater_cv: 'c1.0.0'
	}
}

/** 生成一个安卓设备的SDK信息 */
export function generateForX19Mobile (): MPayAppInfo {
	return {
		app_mode: '2',
		app_type: 'games',
		cv: 'a3.32.1',
		game_id: 'aecfrxodyqaaaajp-g-x19',
		gv: '840217492', // version code, not version name
		mcount_app_key: 'EEkEEXLymcNjM42yLY3Bn6AO15aGy4yq',
		mcount_app_transaction_id: randomTransactionId(),
		opt_fields: 'nickname,avatar,realname_status,mobile_bind_status,exit_popup_info',
		sv: '31',
		gvn: '2.5.5.217492',
		_cloud_extra_base64: 'eyJleHRyYSI6e319'
	}
}

/** MPay Device 系统信息 */
export interface MPayClientInfo {
	/** 品牌 */
	brand: string
	/** 设备型号 */
	device_model: string
	/** 设备名 */
	device_name: string
	/** 设备类型 */
	device_type: string
	/** MAC地址 */
	mac: string
	/** 分辨率信息，例如1920*1080 */
	resolution: string
	/** 系统名称 */
	system_name: string
	/** 系统版本号 */
	system_version: string
	/** UDID */
	udid: string
	/** Unique ID */
	unique_id: string
}

/** MPay Device SDK信息 */
export interface MPayAppInfo {
	/** SDK工作模式 */
	app_mode: string
	/** SDK所服务的类型 */
	app_type: string
	/** 当前系统的架构，仅PC包含 */
	arch?: string
	/** SDK 版本号 */
	cv: string
	/** 游戏在SDK中的ID */
	game_id: string
	/** 游戏的版本号，在安卓是叫versionCode */
	gv: string
	/** 游戏在SDK的key */
	mcount_app_key: string
	/** 当前SDK的事务ID（我只能这样理解） */
	mcount_app_transaction_id: string
	/** 附加参数，可参考生成SDK信息时的内容 */
	opt_fields: string
	/** 当前游戏的PID，仅PC拥有此选项 */
	process_id?: string
	/** 服务版本号 */
	sv: string
	/** 升级程序的版本号（暂时这么理解） */
	updater_cv?: string
	/** 游戏给用户看的版本号，在安卓是叫versionName，仅移动设备拥有此选项 */
	gvn?: string
	/** 云端附加的JSON信息（编码成base64），仅移动设备拥有此选项 */
	_cloud_extra_base64?: string
}

/** MPay Device 返回信息 */
export interface MPayDeviceResponse {
	device: MPayDeviceInfo
}

/** MPay Device 请求失败信息 */
export interface MPayDeviceErrorResponse {
	code: number
	reason: string
	/** 账号风险验证的链接 */
	verify?: string
}

/** MPay Device 信息 */
export interface MPayDeviceInfo {
	/** 暂时不知道是什么 */
	urs_device_id: string
	/** 设备在云端标记的ID */
	id: string
	/** 用于后续AES加解密的key */
	key: string
}

/** 完整的MPay Device信息 */
export interface MPayDevice {
	clientMPay: MPayClientInfo
	appMPay: MPayAppInfo
	deviceMPay: MPayDeviceInfo
}
