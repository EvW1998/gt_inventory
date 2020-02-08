/**
 * Util functions about deleting inventory items and cateogries.
 */
const pAction = require('pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the database
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_usage = { 'daily': 'daily_usage', 'weekly': 'weekly_usage', 'monthly': 'monthly_usage' } // the collections of usage


/**
 * Remove an item and all usage record of this item.
 * Then navigate the user back to the previous page.
 * 
 * @method removeItem
 * @param{String} item_id The id of the item to remove
 */
async function removeItem(item_id) {
    console.log('Delete item: ', item_id)
    // get all usage record of this item
    var usage = await getUsage(item_id)
    // reformat the usage to make the key of the object become the usage id
    var formated_usage = {}
    for(var i in usage) {
        for(var j in usage[i]) {
            formated_usage[usage[i][j]._id] = usage[i][j]
        }
    }

    // remove all the usage record of this item
    await removeUsage(formated_usage)
    console.log('Finish remove all usage record under the item')
    
    // remove the item
    var message = await removeTheItem(item_id)
    // navigate the user back to the previous page with a message of successed or failed
    pAction.navigateBackUser(message, 1)
}


/**
 * Return all the usage record of the given item.
 * 
 * @method getUsage
 * @param{String} item_id The id of the item for searching usage records
 * @return{Promise} The state of the function. Return the usage record when resolve the function.
 */
function getUsage(item_id) {
    return new Promise((resolve, reject) => {
        var total_get = 3 // the total amount of collections that need to be searched
        var curr_get = 0 // the curr amount of collections that finished searching
        var usage = {} // the usage record

        for (var i in db_usage) {
            // for every usage collection, search the record with the given item id
            db.collection(db_usage[i])
                .where({
                    item_id: item_id
                })
                .get({
                    success: res => {
                        // if the search gets a success result, add the result to the usage record
                        usage[curr_get] = res.data
                        curr_get = curr_get + 1
                        console.log('Get usage ', curr_get, '/', total_get)

                        if(curr_get == total_get) { 
                            // if all collections finished searching, resolve the function
                            resolve(usage)
                        }                        
                    },
                    fail: err => {
                        // if the search gets a fail result, reject the function
                        console.error("Failed to get usage ", err)
                        reject(usage)
                    }
                })
        }
    })

}


/**
 * Remove all the given usage record.
 * 
 * @method removeUsage
 * @param{Object} usage Formated usage records need to be removed from collections
 * @return{Promise} The state of the function. Resolve the function when all usage records are removed
 */
function removeUsage(usage) {
    return new Promise((resolve, reject) => {
        var total_remove = Object.keys(usage).length // the total amount of usage records need to be removed
        var curr_remove = 0 // the amount of usage records are removed

        if(total_remove == 0) {
            // if there are no usage records need to be removed
            resolve()
        }

        for(var i in usage) {
            // for each of the usage record
            console.log('Try to romve ', i, ' from ', usage[i].usage_type)

            wx.cloud.callFunction({
                name: 'dbRemove',
                data: {
                    collection_name: usage[i].usage_type,
                    uid: i
                },
                success: res => {
                    curr_remove = curr_remove + 1
                    console.log('Remove usage ', curr_remove, '/', total_remove)

                    if(total_remove == curr_remove) {
                        // if all the usage record are removed
                        resolve()
                    }
                },
                fail: err => {
                    // if get a failed result
                    console.error('Failed to use cloud function dbRemove()', err)
                    reject()
                }
            })
        }
    })
}


/**
 * Remove the given item.
 * 
 * @method removeTheItem
 * @param{String} item_id The id of the item needs to be removed
 * @return{Promise} The state of the function. Resolve the function with successed message when the item is removed
 */
function removeTheItem(item_id) {
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'dbRemove',
            data: {
                collection_name: db_item,
                uid: item_id
            },
            success: res => {
                console.log('Remove item success')
                resolve('删除成功')
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbRemove()', err)
                reject('删除失败')
            }
        })
    })
}


/**
 * Remove the given category and all items under the cateogry and all usage records of all items.
 * Then navigate the user back to the category setting page.
 * 
 * @method removeSelectedCategory
 * @param{String} category_id The id of the category needs to be removed
 */
async function removeSelectedCategory(category_id) {
    console.log('Delete category: ', category_id)
    // get all items under the category
    var items = await getItems(category_id)
    // reformate the items to an object that keys are item ids
    var formated_items = {}
    for(var i in items) {
        formated_items[items[i]._id] = items[i]
    }

    // get all usage records of all items
    var usages = await getAllUsage(formated_items)
    // reformate the usage records to an object that keys are usage ids
    var formated_usages = {}
    for(var i in usages) {
        for(var j in usages[i]) {
            formated_usages[usages[i][j]._id] = usages[i][j]
        }
    }

    // remove all the usage records
    await removeUsage(formated_usages)
    console.log('Finish remove all usage record under items under the cateogry')

    // remove all the items
    await removeAllItems(formated_items)
    console.log('Finish remove all items under the cateogry')

    // remove the category
    var message = await removeTheCategory(category_id)
    console.log('Finish remove the cateogry')

    // navigate the user back to the category setting page with a successed or failed message
    pAction.navigateBackUser(message, 2)
}


/**
 * Return all items under the given category.
 * 
 * @method getItems
 * @param{String} category_id The id of the category for searching items
 * @return{Promise} The state of the function. Resolve the function with all the items under the category
 */
function getItems(category_id) {
    return new Promise((resolve, reject) => {
        db.collection(db_item)
            .where({
                category_id: category_id
            })
            .get({
                success: res => {
                    console.log('Get all items under ', category_id)
                    resolve(res.data)
                },
                fail: err => {
                    console.error("Failed to get items ", err)
                    reject()
                }
            })
    })
}


/**
 * Return all usage records with given items
 * 
 * @method getAllUsage
 * @param{Object} items The formated items for searching usage records
 * @return{Promise} The state of the function. Resolve the function with all usage reocrds of items
 */
function getAllUsage(items) {
    return new Promise((resolve, reject) => {
        var total_get = 3 * Object.keys(items).length // the total amount of collections need to be searched
        var curr_get = 0 // the amount of collections that have done searching
        var usage = {} // the usage records

        if(total_get == 0) {
            // if no items need to be searched
            resolve(usage)
        }

        for(var i in items) {
            // for each item
            for (var j in db_usage) {
                // for each usage collection
                db.collection(db_usage[j])
                    .where({
                        item_id: i
                    })
                    .get({
                        success: res => {
                            usage[curr_get] = res.data
                            curr_get = curr_get + 1
                            console.log('Get usage ', curr_get, '/', total_get)

                            if (curr_get == total_get) {
                                // if all the searching is done
                                resolve(usage)
                            }
                        },
                        fail: err => {
                            console.error("Failed to get usage ", err)
                            reject(usage)
                        }
                    })
            }
        }
    })
}

/**
 * Remove all items that are given
 * 
 * @method removeAllItems
 * @param{Object} items The formated items for removing
 * @return{Promise} The state of the function. Resolve the function when all items are removed
 */
function removeAllItems(items) {
    return new Promise((resolve, reject) => {
        var total_remove = Object.keys(items).length // the total amount of items need to be removed
        var curr_remove = 0 // the amount of items finished removing

        if(total_remove == 0) {
            // if no items need to be removed
            resolve()
        }

        for(var i in items) {
            // use cloud function dbRemove() to remove the item from database for each item
            wx.cloud.callFunction({
                name: 'dbRemove',
                data: {
                    collection_name: db_item,
                    uid: i
                },
                success: res => {
                    curr_remove = curr_remove + 1
                    console.log('Remove item ', curr_remove, '/', total_remove)

                    if(curr_remove == total_remove) {
                        // if all the items are removed
                        resolve()
                    }
                },
                fail: err => {
                    console.error('Failed to use cloud function dbRemove()', err)
                    reject()
                }
            })
        }
    })
}


/**
 * Remove the given category
 * 
 * @method removeTheCategory
 * @param{String} cateogry_id The id of the category
 * @return{Promise} The state of the function. Resolve the function when the category is removed with a successed message
 */
function removeTheCategory(cateogry_id) {
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'dbRemove',
            data: {
                collection_name: db_category,
                uid: cateogry_id
            },
            success: res => {
                console.log('Remove category success')
                resolve('删除成功')
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbRemove()', err)
                reject('删除失败')
            }
        })
    })
}


module.exports = {
    removeItem: removeItem,
    removeSelectedCategory: removeSelectedCategory
}
