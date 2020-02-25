/**
 * Util functions about user login and modification.
 */
const realTimeLog = require('log.js') // require the util of real time log

const db = wx.cloud.database() // the cloud database
const db_user = 'user' // the collection of users
const db_restaurant = 'restaurant' // the collection of restaurants


/**
 * Return whether the user gave the app authority to use his info.
 * 
 * @method getAuthority
 * @return{Promise} The state of the function. Resolve with user's authorization info
 */
function getAuthority() {
    return new Promise((resolve, reject) => {
        var result = {}
        // get the user's setting for the App
        wx.getSetting({
            success: res => {
                result['stat'] = true

                var authority = false
                if (res.authSetting['scope.userInfo']) {
                    authority = true
                }

                result['result'] = authority
                resolve(result)
            },
            fail: err => {
                result['stat'] = false

                realTimeLog.error('Failed to get the user wechat authorization of using the user info by using getSetting().', err)
                resolve(result)
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
        var result = {}
        // get the user's info from the wechat
        wx.getUserInfo({
            success: res => {
                result['stat'] = true
                result['result'] = res.userInfo
                resolve(result)
            },
            fail: err => {
                result['stat'] = false
                realTimeLog.error('Failed to get user wechat info by using getUserInfomation().', err)
                resolve(result)
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
        var result = {}
        // use cloud function getOpenId() to get user openid
        wx.cloud.callFunction({
            name: 'getOpenId',
            success: res => {
                result['stat'] = true
                result['result'] = res.result.openid
                resolve(result)
            },
            fail: err => {
                result['stat'] = false
                realTimeLog.error('Failed to get user openid by using getOpenId().', err)
                resolve(result)
            }
        })
    })
}


/**
 * Return the user's uid, permission level and real name, if the user registered in the app.
 * Return the user has not been registered, if not.
 * 
 * @method getUserRegistration
 * @param{String} openid The user's openid
 * @return{Promise} The state of the function. Resolve with user's uid, permission level and real name
 */
function getUserRegistration(openid) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        db.collection(db_user)
            .where({
                user_openid: openid
            })
            .get({
                success: res => {
                    result['stat'] = true
                    var registration = {}
                    registration['registered'] = false

                    if (res.data.length === 1) {
                        registration['registered'] = true
                        registration['registration'] = res.data[0]
                    }

                    result['result'] = registration
                    resolve(result)
                },
                fail: err => {
                    realTimeLog.error('Failed to get user registration info with the given openid in the database.', err)
                    resolve(result)
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
 * Return the system info.
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
                realTimeLog.error('Failed to system info by using getSystemInfo().', err)
                resolve()
            }
        })
    })
}


/**
 * Return the restaurant info with the given restaurant id.
 * 
 * @method getRestaurantInfo
 * @param{String} r_id The id of the restaurant
 * @return{Promise} The state of the function. Resolve with the restaurant info.
 */
function getRestaurantInfo(r_id) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        db.collection(db_restaurant)
            .where({
                _id: r_id
            })
            .get({
                success: res => {
                    result['stat'] = true
                    result['result'] = res.data[0]

                    resolve(result)
                },
                fail: err => {
                    realTimeLog.error('Failed to get the restaurant info with the given id in the database.', err)
                    resolve(result)
                }
            })
    })
}


/**
 * Get all restaurants info.
 * 
 * @method getAllRestaurant
 * @return{Promise} The state of the function. Resolve with the all restaurant info.
 */
function getAllRestaurant() {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbGet',
            data: {
                collection_name: db_restaurant,
                collection_limit: 100,
                collection_field: {},
                collection_where: {},
                collection_orderby_key: 'name',
                collection_orderby_order: 'desc'
            },
            success: res => {
                result['stat'] = true
                result['result'] = res.result

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to get all restaurants info by using dbGet().', err)
                resolve(result)
            }
        })
    })
}


module.exports = {
    getAuthority: getAuthority,
    getUserInfomation: getUserInfomation,
    getOpenId: getOpenId,
    getUserRegistration: getUserRegistration,
    addNewUser: addNewUser,
    getSystem: getSystem,
    getRestaurantInfo: getRestaurantInfo,
    getAllRestaurant: getAllRestaurant
}
