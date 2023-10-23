# Maid.js

[![npm version](https://img.shields.io/npm/v/maid-js/latest.svg)](https://www.npmjs.com/package/maid-js)
[![dm](https://shields.io/npm/dm/maid-js)](https://www.npmjs.com/package/maid-js)
[![node engine](https://img.shields.io/node/v/maid-js/latest.svg)](https://nodejs.org)  
本项目是对 [mccheatz/Maid](https://github.com/mccheatz/Maid) 的重写，不包含proxy相关内容。  
**not compiled**

## 提醒

[![Channel](https://img.shields.io/badge/Follow-Telegram-blue.svg?logo=telegram)](https://t.me/ProjectHako)  

因特殊原因而公开，但是mpay删除了一部分功能，例如游客登录。  
不主动维护，若对我们后续的动作感兴趣可以加入我们的Telegram频道。   
如果此时阅读这段文字的您是网易工作人员，请务必和谐 《我的世界》中国版 PC登录协议。

## 一切开发旨在学习，请勿用于非法用途
* maid.js 是完全免费且开放源代码的软件，仅供学习和娱乐用途使用
* maid.js 不会通过任何方式强制收取费用，或对使用者提出物质条件  

鉴于项目的特殊性，该项目可能在任何时间**停止更新或删除**。
## 协议
`maid.js`采用`AGPLv3`协议开源。为了保证良性发展，我们**强烈建议**您做到以下几点：
* **使用任何手段（包括间接）接触到`maid.js`的软件/服务采用`AGPLv3`协议开源**
* **不鼓励，不支持任何商业使用**

# 开始
### 安装
```shell
> npm install maid-js
```
### 使用
```javascript
const maid = require('maid-js')

const client = new maid.MaidClient({
    account: 'account',
    password: 'password'
})
async function init() {
    await client.login()
    // get pe user detail
    console.log(await client.doRequest(
        client.x19Session.releaseInfoPE.CoreServerUrl,
        '/pe-user-detail/get', {
            body: {}
        }
    ))
}
init()
```
