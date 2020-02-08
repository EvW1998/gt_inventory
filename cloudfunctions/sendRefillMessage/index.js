/**
 * Cloud function to send a message to an user with the given openid that the refilling inventory is done.
 */
const cloud = require('wx-server-sdk') // require using wx-server-sdk for using database

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// the template id for the message
const refill_template_id = 'X9BoiE_piVjqKaKsAH1KcFhOX46FFps-bWoNBK-LnYQ'

/**
 * Send a message to an user with the given openid that the refilling inventory is done.
 * 
 * @method main
 * @param{Object} event An object has keys that contain the user's openid and the detail message info
 * @return{Object} The result of sending the message
 */
exports.main = async (event, context) => {
    try {
        const result = await cloud.openapi.subscribeMessage.send({
            touser: event.openid,
            page: 'inventory/inventoryUpdate/inventoryUpdate',
            data: {
                time1: {
                    value: event.time
                },
                name2: {
                    value: event.user
                },
                number3: {
                    value: event.normal_amount
                },
                number4: {
                    value: event.warning_amount
                },
                thing6: {
                    value: event.comment
                }
            },
            templateId: refill_template_id
        })

        console.log(result)
        return result
    } catch (e) {
        console.log(e)
        return e
    }
}