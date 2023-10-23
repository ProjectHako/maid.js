import { getRandomMPayDevice, MPayBaseClient, type MPayDevice, X19Session } from './core'

/** 生成一个新设备信息 */
export async function generateDevice (): Promise<MPayDevice> {
	return await getRandomMPayDevice()
}

/** 获取一个MPay Client */
export function getNewMPayClient (mpayDevice: MPayDevice): MPayBaseClient {
	return new MPayBaseClient(mpayDevice)
}

/** 获取一个X19Session */
export function getX19Session (): X19Session {
	return new X19Session()
}

/** async方式获取X19Session，会自动调用initSession() */
export async function getX19SessionAsync (): Promise<X19Session> {
	const session = new X19Session()
	await session.initSession()
	return session
}
