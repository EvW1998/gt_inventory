// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: event.openid,
      page: 'inventory',
      data: {
        time1: {
          value: event.time
        },
        thing2: {
          value: event.detail
        }
      },
      templateId: 'hAMmX4ZyrxIGCPc8dMJM07irJrM0zNwyDu-3YdGci4I'
    })

    console.log(result)
    return result

  } catch(e) {
    console.log(e)
    return e
  }
}