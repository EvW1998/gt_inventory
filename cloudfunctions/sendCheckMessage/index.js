// 云函数入口文件
const cloud = require('wx-server-sdk')
const check_template_id = 'LJqgpHGDBW5N1A_7A3goZytqjqN-AR5ldYjSRvjFSSU'

cloud.init({
    // API 调用都保持和云函数当前所在环境一致
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        const result = await cloud.openapi.subscribeMessage.send({
            touser: event.openid,
            page: 'inventory/inventoryUpdate/inventoryUpdate',
            data: {
                date1: {
                    value: event.time
                },
                name2: {
                    value: event.user
                },
                number3: {
                    value: event.normal_amount
                },
                number4: {
                    value: event.unfilled_amount
                },
                thing5: {
                    value: event.comment
                }
            },
            templateId: check_template_id
        })

        console.log(result)
        return result

    } catch (e) {
        console.log(e)
        return e
    }
}