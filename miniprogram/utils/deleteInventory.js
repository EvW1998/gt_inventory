const pAction = require('pageAction.js')

const app = getApp()
const db = wx.cloud.database()
const db_category = 'category'
const db_item = 'item' // the collection of items
const db_usage = { 'daily': 'daily_usage', 'weekly': 'weekly_usage', 'monthly': 'monthly_usage' } // the collections of usage

async function removeItem(item_id) {
    console.log('Delete item: ', item_id)
    var usage = await getUsage(item_id)
    var formated_usage = {}

    for(var i in usage) {
        for(var j in usage[i]) {
            formated_usage[usage[i][j]._id] = usage[i][j]
        }
    }

    await removeUsage(formated_usage)
    console.log('Finish remove all usage record under the item')
    
    var message = await removeTheItem(item_id)
    pAction.navigateBackUser(message, 1)
}

function getUsage(item_id) {
    return new Promise((resolve, reject) => {
        var total_get = 3
        var curr_get = 0
        var usage = {}

        for (var i in db_usage) {
            db.collection(db_usage[i])
                .where({
                    item_id: item_id
                })
                .get({
                    success: res => {
                        usage[curr_get] = res.data
                        curr_get = curr_get + 1
                        console.log('Get usage ', curr_get, '/', total_get)

                        if(curr_get == total_get) {
                            resolve(usage)
                        }                        
                    },
                    fail: err => {
                        console.error("Failed to get usage ", err)
                        reject(usage)
                    }
                })
        }
    })

}

function removeUsage(usage) {
    return new Promise((resolve, reject) => {
        var total_remove = Object.keys(usage).length
        var curr_remove = 0

        if(total_remove == 0) {
            resolve()
        }

        for(var i in usage) {
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

async function removeSelectedCategory(category_id) {
    console.log('Delete category: ', category_id)
    var items = await getItems(category_id)
    var formated_items = {}
    for(var i in items) {
        formated_items[items[i]._id] = items[i]
    }

    var usages = await getAllUsage(formated_items)
    var formated_usages = {}
    for(var i in usages) {
        for(var j in usages[i]) {
            formated_usages[usages[i][j]._id] = usages[i][j]
        }
    }

    await removeUsage(formated_usages)
    console.log('Finish remove all usage record under items under the cateogry')

    await removeAllItems(formated_items)
    console.log('Finish remove all items under the cateogry')

    var message = await removeTheCategory(category_id)
    console.log('Finish remove the cateogry')

    pAction.navigateBackUser(message, 2)
}

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

function getAllUsage(items) {
    return new Promise((resolve, reject) => {
        var total_get = 3 * Object.keys(items).length
        var curr_get = 0
        var usage = {}

        if(total_get == 0) {
            resolve(usage)
        }

        for(var i in items) {
            for (var j in db_usage) {
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

function removeAllItems(items) {
    return new Promise((resolve, reject) => {
        var total_remove = Object.keys(items).length
        var curr_remove = 0

        if(total_remove == 0) {
            resolve()
        }

        for(var i in items) {
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
