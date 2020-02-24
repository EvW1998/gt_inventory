/**
 * Util functions about user input.
 */
const app = getApp() // the app
const db = wx.cloud.database() // the database


/**
 * Return whether the string is a number.
 * 
 * @method isNumber
 * @param{String} str The string for testing
 * @return{Boolean} whether the string is a number
 */
function isNumber(str) {
    var reg = /^\-?\d+(\.\d+)?$/
    if (!reg.test(str)) {
        return false
    } else {
        return true
    }
}


/**
 * Return whether the string is all Chinese characters.
 * 
 * @method isChinese
 * @param{String} str The string for testing
 * @return{Boolean} whether the string is all Chinese characters
 */
function isChinese(str) {
    var reg = /^[\u4e00-\u9fa5]*$/
    if (!reg.test(str)) {
        return false
    } else {
        return true
    }
}


/**
 * Check the user input whether has a repetition item in the given collection.
 * 
 * @method isRepeated
 * @param{String} c The given collection
 * @param{Object} i The user input
 * @return{Promise} The state of the function. Resolve false when there is no repetition item in the collection.
 */
function isRepeated(c, i) {
    return new Promise((resolve, reject) => {
        db.collection(c)
            .where(i)
            .get({
                success: res => {
                    if (res.data.length === 0) {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                },
                fail: err => {
                    console.err('Failed to check whether the given item is repeated in the collection', err)
                    reject(true)
                }
            })
    })
}


module.exports = {
    isNumber: isNumber,
    isChinese: isChinese,
    isRepeated: isRepeated
}
