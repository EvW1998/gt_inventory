const pAction = require('pageAction.js')

const app = getApp()
const db = wx.cloud.database()
const db_category = 'category'
const db_item = 'item' // the collection of items
const db_useage = { 'daily': 'daily_useage', 'weekly': 'weekly_useage', 'monthly': 'monthly_useage' } // the collections of useage

async function removeItem(item_id) {
    console.log('Delete item: ', item_id)
    var useage = await getUseage(item_id)
    var formated_useage = {}

    for(var i in useage) {
        for(var j in useage[i]) {
            formated_useage[useage[i][j]._id] = useage[i][j]
        }
    }

    await removeUseage(formated_useage)
    console.log('Finish remove all useage record under the item')
    
    var message = await removeTheItem(item_id)
    pAction.navigateBackUser(message, 1)
}

function getUseage(item_id) {
    return new Promise((resolve, reject) => {
        var total_get = 3
        var curr_get = 0
        var useage = {}

        for (var i in db_useage) {
            db.collection(db_useage[i])
                .where({
                    item_id: item_id
                })
                .get({
                    success: res => {
                        useage[curr_get] = res.data
                        curr_get = curr_get + 1
                        console.log('Get useage ', curr_get, '/', total_get)

                        if(curr_get == total_get) {
                            resolve(useage)
                        }                        
                    },
                    fail: err => {
                        console.error("Failed to get useage ", err)
                        reject(useage)
                    }
                })
        }
    })

}

function removeUseage(useage) {
    return new Promise((resolve, reject) => {
        var total_remove = Object.keys(useage).length
        var curr_remove = 0

        if(total_remove == 0) {
            resolve()
        }

        for(var i in useage) {
            console.log('Try to romve ', i, ' from ', useage[i].useage_type)

            wx.cloud.callFunction({
                name: 'dbRemove',
                data: {
                    collection_name: useage[i].useage_type,
                    uid: i
                },
                success: res => {
                    curr_remove = curr_remove + 1
                    console.log('Remove useage ', curr_remove, '/', total_remove)

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

    var useages = await getAllUseage(formated_items)
    var formated_useages = {}
    for(var i in useages) {
        for(var j in useages[i]) {
            formated_useages[useages[i][j]._id] = useages[i][j]
        }
    }

    await removeUseage(formated_useages)
    console.log('Finish remove all useage record under items under the cateogry')

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

function getAllUseage(items) {
    return new Promise((resolve, reject) => {
        var total_get = 3 * Object.keys(items).length
        var curr_get = 0
        var useage = {}

        if(total_get == 0) {
            resolve(useage)
        }

        for(var i in items) {
            for (var j in db_useage) {
                db.collection(db_useage[j])
                    .where({
                        item_id: i
                    })
                    .get({
                        success: res => {
                            useage[curr_get] = res.data
                            curr_get = curr_get + 1
                            console.log('Get useage ', curr_get, '/', total_get)

                            if (curr_get == total_get) {
                                resolve(useage)
                            }
                        },
                        fail: err => {
                            console.error("Failed to get useage ", err)
                            reject(useage)
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
