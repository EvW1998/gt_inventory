const cloud = require('wx-server-sdk')

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 *  para event(object): null
 *  return: the openid of the user
 * 
 *  Get the user's openid for the App
 */
exports.main = (event, context) => {
    // get wx Context
    const wxContext = cloud.getWXContext()

    return {
        openid: wxContext.OPENID
    }
}
