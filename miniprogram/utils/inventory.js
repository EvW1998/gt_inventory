/**
 * Util functions about setting the inventory data.
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items
const db_info = 'info' // the collection of the app info
const db_sale = 'sale' // the collection of sales


/**
 * Set all the categories and items data in the inventory to the given page data.
 * 
 * @method setInventory
 * @param{Page} page The page
 * @param{String} type The type, whether update, left or refill
 */
async function setInventory(page, type) {
    if (type == 'update') {
        // for the inventoryUpdate page
        // get the check_left value and update to the app and page data
        var cl = await getCheckLeft()
        page.setData({
            check_left: cl
        })
        app.globalData.check_left = cl
        console.log('Left has been checked: ', cl)
    }
    
    // get all categories and add a nav_order key for the switch navigation
    var categories = await getCategory()
    for (var c in categories) {
        categories[c]['nav_order'] = parseInt(c)
    }
    
    var category_amount = Object.keys(categories).length

    // update categories to the page data
    page.setData({
        category_amount: category_amount,
        category: categories
    })
    console.log('Get all the categories: ', page.data.category)

    // get all items and update items to the page data
    var items = await getItem(page, categories)

    var item_amount = Object.keys(items).length

    page.setData({
        item_amount: item_amount,
        item: items
    })

    if (type == 'update') {
        // for the inventoryUpdate page
        wx.stopPullDownRefresh()
    } else if(type == 'refill') {
        // for the inventoryRefill page, use cloud function getPrediction to predict the refill value
        wx.cloud.callFunction({
            name: 'getPrediction',
            data: {
                item: page.data.item
            },
            success: res => {
                // the prediction store inside items data with a key called prediction_value
                var new_item = res.result
                console.log('Finish prediction of today', new_item)

                // update the items to the page data
                page.setData({
                    item: new_item
                })
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to use cloud function getPrediction()', err)
            }
        })
    } 
    else {
        // for the inventoryLeft page
        wx.hideLoading()
    }
}


/**
 * Return the check_left value from the app info collection.
 * 
 * @method getCheckLeft
 * @return{Promise} The state of the function. Resolve with the check_left value.
 */
function getCheckLeft() {
    return new Promise((resolve, reject) => {
        db.collection(db_info)
            .field({
                check_left: true
            })
            .get({
                success: res => {
                    resolve(res.data[0].check_left)
                },
                fail: err => {
                    console.error('Failed to get check_left from database', err)
                    reject()
                }
            })
    })
}


/**
 * Return all the categories in the category collection.
 * 
 * @method getCategory
 * @return{Promise} The state of the function. Resolve with all the categories.
 */
function getCategory() {
    return new Promise((resolve, reject) => {
        db.collection(db_category)
            .field({
                _id: true,
                category_order: true,
                category_name: true,
                item_amount: true
            })
            .orderBy('category_order', 'asc')
            .get({
                success: res => {
                    resolve(res.data)
                },
                fail: err => {
                    console.error('Failed to get categories from database', err)
                    reject()
                }
            })
    })
}


/**
 * Return all the items in the item collection.
 * 
 * @method getItem
 * @param{Page} page The page
 * @param{Object} categories All the categories
 * @return{Promise} The state of the function. Resolve with all the items.
 */
function getItem(page, categories) {
    return new Promise((resolve, reject) => {
        var total_category = categories.length // the total amount of categories need to be searched
        var curr_category = 0 // the amount of categories have done searching
        var item = {} // the items

        if(total_category == 0) {
            // if no categories need to be searched
            resolve(item)
        }

        var height = 400 // the height of the switch page
        var sum = 0 // the largest amount of items in one page

        for (var i in categories) {
            // for each category
            db.collection(db_item)
                .where({
                    category_id: categories[i]._id
                })
                .orderBy('item_order', 'asc')
                .get({
                    success: res => {
                        curr_category = curr_category + 1
                        console.log('Get items ', curr_category, '/', total_category)

                        if (res.data.length != 0) {
                            // if there are items under this category
                            // find the assigned category of those items
                            var category_order = 0
                            for (var j in categories) {
                                if (categories[j]._id == res.data[0].category_id) {
                                    category_order = categories[j].category_order
                                }
                            }
                            // store the items
                            item[category_order] = res.data

                            if (res.data.length > sum) {
                                // if the amount of items in this category is the largest so far
                                sum = res.data.length
                            }
                        }

                        if (curr_category == total_category) {
                            // if all categories finished searching items
                            height = height + sum * 150
                            // calculate the suitable height

                            if (page.data.h < height) {
                                // if the height is larger than the default height
                                page.setData({
                                    h: height
                                })
                            }

                            console.log('Get all the items: ', item)
                            resolve(item)
                        }
                    },
                    fail: err => {
                        console.error('Failed to search items', err)
                        reject()
                    }
                })
        }
    })
}


/**
 * Update the check_left value in the info collection
 * 
 * @method updateCheckLeft
 * @param{Boolean} state The new state of check_left
 * @return{Promise} The state of the function. Resolve when finish updating check_left.
 */
function updateCheckLeft(state) {
    return new Promise((resolve, reject) => {
        var update_info_data = { 'check_left': state }

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_info,
                update_data: update_info_data,
                uid: app.globalData.info_id
            },
            success: res => {
                console.log('Update check left info success')
                resolve()
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbUpdate()', err)
                reject()
            }
        })
    })
}


module.exports = {
    setInventory: setInventory,
    getCheckLeft: getCheckLeft,
    updateCheckLeft: updateCheckLeft
}
