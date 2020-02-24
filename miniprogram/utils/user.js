/**
 * Util functions about user login and modification.
 */
const realTimeLog = require('log.js') // require the util of real time log
const db_user = 'user' // the collection of users


/**
 * Return whether the user gave the app authority to use his info.
 * 
 * @method getAuthority
 * @return{Promise} The state of the function. Resolve with user's authorization info
 */
function getAuthority() {
    return new Promise((resolve, reject) => {
        // get the user's setting for the App
        wx.getSetting({
            success: res => {
                if (res.authSetting['scope.userInfo']) {
                    // if get user authorization
                    resolve(true)
                }
                // if the user didn't give authorization before
                resolve(false)
            },
            fail: err => {
                // if failed to call getSetting
                console.error('Failed to use getSetting()', err)
                reject(err)
            }
        })
    })
}


/**
 * Return the user's wechat info.
 * 
 * @method getUserInfomation
 * @return{Promise} The state of the function. Resolve with user's userInfo
 */
function getUserInfomation() {
    return new Promise((resolve, reject) => {
        // get the user's info from the wechat
        wx.getUserInfo({
            success: res => {
                // return the userInfo if successed
                resolve(res.userInfo)
            },
            fail: err => {
                // if failed to use getUserInfo
                console.error('Failed to use getUserInfo()', err)
                reject(err)
            }
        })
    })
}


/**
 * Return the user's openid.
 * 
 * @method getOpenId
 * @return{Promise} The state of the function. Resolve with user's openid
 */
function getOpenId() {
    return new Promise((resolve, reject) => {
        // use cloud function getOpenId() to get user openid
        wx.cloud.callFunction({
            name: 'getOpenId',
            success: res => {
                // return the user's openid if successed
                resolve(res.result.openid)
            },
            fail: err => {
                // if failed to use cloud funtion getOpenId
                console.error('Failed to use cloud function getOpenId()', err)
                reject(err)
            }
        })
    })
}


/**
 * Return the user's uid, permission level and real name, if the user registered in the app.
 * Return the user has not been registered, if not.
 * 
 * @method checkUser
 * @param{String} openid The user's openid
 * @param{Object} db The cloud database
 * @return{Promise} The state of the function. Resolve with user's uid, permission level and real name
 */
function checkUser(openid, db) {
    return new Promise((resolve, reject) => {
        db.collection(db_user)
            .where({
                // use the user's openid to search in the collection
                user_openid: openid
            })
            .field({
                true_name: true,
                permission_level: true,
                user_openid: true
            })
            .get({
                success: res => {
                    if (res.data.length == 0) {
                        // if no user is found with the openid
                        resolve({
                            registered: false
                        })

                    } else {
                        // if found a user
                        resolve({
                            registered: true,
                            uid: res.data[0]._id,
                            permission_level: res.data[0].permission_level,
                            true_name: res.data[0].true_name
                        })
                    }
                },
                fail: err => {
                    // if failed to search in the collection
                    console.error('Failed to search the given openid in the user collection', err)
                    reject(err)
                }
            })
    })
}


/**
 * Add a new user into the user collection in the database, with given user data.
 * 
 * @method addNewUser
 * @param{Object} user_data An Object includes user's openid, real name and permission level
 * @return{Promise} The state of the function. Resolve with the returned result from the cloud function
 */
function addNewUser(user_data) {
    return new Promise((resolve, reject) => {
        var add_result = {}

        // call dbAdd() cloud function to add the user to the user collection
        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_user,
                add_data: user_data
            },
            success: res => {
                // return the result if successed
                add_result['stat'] = 'success'
                add_result['result'] = res
                resolve(add_result)
            },
            fail: err => {
                // if failed to use cloud function dbAdd
                add_result['stat'] = 'fail'
                realTimeLog.error('Failed to add a new user to the database by using dbAdd().', err)
                resolve(add_result)
            }
        })
    })
}


/**
 * Get the system info.
 * 
 * @method getSystem
 * @return{Promise} The state of the function. Resolve with the returned result from system info
 */
function getSystem() {
    return new Promise((resolve, reject) => {
        wx.getSystemInfo({
            success: res => {
                resolve(res)
            },
            fail: err => {
                realTimeLog.error('Failed to get system info.', err)
                reject(err)
            }
        })
    })
}


module.exports = {
    getAuthority: getAuthority,
    getUserInfomation: getUserInfomation,
    getOpenId: getOpenId,
    checkUser: checkUser,
    addNewUser: addNewUser,
    getSystem: getSystem
}
