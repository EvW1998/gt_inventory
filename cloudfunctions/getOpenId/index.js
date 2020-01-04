const cloud = require('wx-server-sdk')

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * Return the user's openid for the App.
 * 
 * @return{Object} The user's openid
 */
exports.main = (event, context) => {
    // get wx Context
    const wxContext = cloud.getWXContext()

    return {
        openid: wxContext.OPENID
    }
}
