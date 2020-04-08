/**
 * Util functions about user input.
 */
const realTimeLog = require('log.js') // require the util of real time log

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
 * Return whether the string is a number.
 * 
 * @method isInteger
 * @param{String} str The string for testing
 * @return{Boolean} whether the string is a number
 */
function isInteger(str) {
    var reg = /^\-?\d+$/
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
 * Check the inputs whether has a repetition item in the given collection.
 * 
 * @method isRepeated
 * @param{String} collection The given collection
 * @param{Object} inputs The inputs
 * @return{Promise} The state of the function. Resolve the results of the searching.
 */
function isRepeated(collection, inputs) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = {}
        result['result']['repetition'] = true
        result['result']['repetition_name'] = undefined

        db.collection(collection)
            .field({
                _id: true,
                name: true
            })
            .where(inputs)
            .get({
                success: res => {
                    result['stat'] = true

                    if (res.data.length === 0) {
                        result['result']['repetition'] = false
                    } else {
                        result['result']['repetition_name'] = res.data[0].name
                    }

                    resolve(result)
                },
                fail: err => {
                    realTimeLog.error('Failed to use isRepeated function to check repeation ', inputs, ' from the database ', collection, err)
                    resolve(result)
                }
            })
    })
}


/**
 * Add an order key to the objects in the target array, with the total amount of the objects.
 * 
 * @method addOrder
 * @param{Object} target The array to add the order key in its objects
 * @param{Number} amount The amount of objects in the array
 */
function addOrder(target, amount) {
    var order = 1

    for (let i in target) {
        var new_order = order.toString()

        if (amount > 9 && order < 10) {
            new_order = '0' + new_order
        }

        if (amount > 99 && order < 100) {
            new_order = '0' + new_order
        }

        target[i]['order'] = new_order

        order++
    }

    return target
}


module.exports = {
    isNumber: isNumber,
    isInteger: isInteger,
    isChinese: isChinese,
    isRepeated: isRepeated,
    addOrder: addOrder
}
