const db_user = 'user' // the collection name for the user info

/**
 * Connect to the wx server, get user's setting.
 * Return whether the user gave the app authority to use his info.
 * 
 * @method getAuthority
 * @return{Promise} A promise with resolve that has user's authorization info
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
 * Get the user's info from the server
 * 
 * @method getUserInfomation
 * @return{Promise} A promise with resolve about userInfo
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
 * Use cloud function to get the user's openid.
 * 
 * @method getOpenId
 * @return{Promise} A promise with resolve about the user's openid
 */
function getOpenId() {

    return new Promise((resolve, reject) => {
        // use cloud function login() to get user openid
        wx.cloud.callFunction({
            name: 'getOpenId',
            data: {},
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
 * Check whether the user exists in the user collection in the database.
 * If the user has been registered, get the user's uid in, permission level and real name.
 * If not, return the user has not been registered.
 * 
 * @method checkUser
 * @param{String} openid The user's openid
 * @param{Object} db The database
 * @return{Promise} A promise with resolve about the user's uid, permission level and real name
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
 * Use cloud function, add the new user to the collection
 * 
 * @method addNewUser
 * @param{Object} user_data An Object includes user's openid, real name and permission level
 * @return{Promise} A promise with resolve about the returned result from the cloud function
 */
function addNewUser(user_data) {

    return new Promise((resolve, reject) => {
        // call dbAdd() cloud function to add the user to the user collection
        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_user,
                add_data: user_data
            },
            success: res => {
                // return the result if successed
                resolve(res)
            },
            fail: err => {
                // if failed to use cloud function dbAdd
                console.error('Failed to use cloud function dbAdd()', err)
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
    addNewUser: addNewUser
}