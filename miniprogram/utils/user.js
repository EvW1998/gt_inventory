const db_user = 'user' // the collection name for the user info

/**
 *  Connect to the wx server, get user's setting.
 * Check whether the user gave the app authority to use his info.
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
                // if get a failed result
                console.error('Failed to use getSetting()', err)
                reject(err)
            }
        })
    })
}


/**
 *  Connect to the wx server, get user's info.
 */
function getUserInfomation() {

    return new Promise((resolve, reject) => {
        // get the user's info from the wechat
        wx.getUserInfo({
            success: res => {
                // if get a successed result
                resolve(res.userInfo)
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use getUserInfo()', err)
                reject(err)
            }
        })
    })
}


/**
 *  Use cloud function to get the user's openid.
 */
function getOpenId() {

    return new Promise((resolve, reject) => {
        // use cloud function login() to get user openid
        wx.cloud.callFunction({
            name: 'getOpenId',
            data: {},
            success: res => {
                // if get a successed result
                resolve(res.result.openid)
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function login()', err)
                reject(err)
            }
        })
    })
}


/**
 * Check whether the user exists in the user collection in the database.
 * If the user has been registered, get the user's uid in, permission level and real name.
 * If not, navigate to the register page.
 * 
 * @method checkUser
 * @param{String} openid The user's openid
 * @param{Object} db The database
 * @param{String} db_user The collection name of user in the database
 */
function checkUser(openid, db) {

    return new Promise((resolve, reject) => {
        db.collection(db_user)
            .where({
                // use the user's openid to search in db
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
                        // if the user hasn't registered
                        resolve({
                            registered: false
                        })

                    } else {
                        // if the user registered before
                        resolve({
                            registered: true,
                            uid: res.data[0]._id,
                            permission_level: res.data[0].permission_level,
                            true_name: res.data[0].true_name
                        })
                    }
                },
                fail: err => {
                    // if get a failed result
                    console.error('Failed to use cloud function login()', err)
                    reject(err)
                }
            })
    })
}


function addNewUser(user_data) {

    return new Promise((resolve, reject) => {
        // call dbAdd() cloud function to add the user to database user
        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_user,
                add_data: user_data
            },
            success: res => {
                // if get a successed result
                resolve(res)
            },
            fail: err => {
                // if get a failed result
                console.error('failed to use cloud function dbAdd()', err)
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