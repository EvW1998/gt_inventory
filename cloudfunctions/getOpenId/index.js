/**
 * Cloud function to get the openid of the user who called this function.
 */
const cloud = require('wx-server-sdk') // require using wx-server-sdk for using database

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * Return the user's openid for the App.
 * 
 * @method main
 * @return{Object} The user's openid
 */
exports.main = (event, context) => {
    // get wx Context
    const wxContext = cloud.getWXContext()

    return {
        openid: wxContext.OPENID
    }
}
