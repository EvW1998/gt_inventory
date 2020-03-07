/**
 * The page to add new item to the selected category.
 */
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items

var category_id = ''
var existed_item_amount = 0 // The amount of the existed cateogies in the collection


Page({
    /**
     * Data in the page
     */
    data: {
        category_name: '', // the name of the selected category
        error_happened: true, // whether there is error happened while loading
        name_filled: false, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        daily_filled: false, // whether the daily input is filled
        daily_warn_enable: false, // whether the warning icon for the daily should be enabled
        prepare_filled: false, // whether the prepare input is filled
        prepare_warn_enable: false, // whether the warning icon for the prepare should be enabled
        stock_filled: false, // whether the stock input is filled
        stock_warn_enable: false, // whether the warning icon for the stock should be enabled
        capacity_filled: false, // whether the capacity input is filled
        capacity_warn_enable: false, // whether the warning icon for the capacity should be enabled
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page gets loaded, get the amount of existing items.
     */
    onLoad: function(options) {
        wx.showLoading({
            title: '加载中'
        })

        category_id = options.category_id

        var categories = wx.getStorageSync('categories')

        this.setData({
            category_name: categories[category_id]
        })

        setItemAmount(this, options.category_id)
    },

    /**
     * Check the input, set the name_filled to be true if the length is greater than 0,
     * enable the warning icon if the length is 0.
     * If both the input is filled, enable the confirm button.
     * 
     * @method nameInput
     * @param{Object} event The event of the input
     */
    nameInput: function (event) {
        var name_filled = true
        var name_warn_enable = false
        var button_enable = true
        var new_name = event.detail.value

        if (new_name.length === 0) {
            name_filled = false
            name_warn_enable = true
            button_enable = false
        }

        this.setData({
            name_filled: name_filled
        })

        if(!isAllFilled(this)) {
            button_enable = false
        }

        this.setData({
            name_warn_enable: name_warn_enable,
            button_enable: button_enable
        })
    },

    dailyInput: function (event) {
        var daily_filled = true
        var daily_warn_enable = false
        var button_enable = true
        var new_daily = event.detail.value

        if (!uInput.isInteger(new_daily)) {
            daily_filled = false
            daily_warn_enable = true
            button_enable = false
        } else if (parseInt(new_daily) < 1) {
            daily_filled = false
            daily_warn_enable = true
            button_enable = false
        }

        this.setData({
            daily_filled: daily_filled
        })

        if (!isAllFilled(this)) {
            button_enable = false
        }

        this.setData({
            daily_warn_enable: daily_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * When the confirm button triggered
     * 
     * @method formSubmit
     * @param e The return val from the form submit
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '提交中',
            mask: true
        })

        addItem(this.data.category_selected, e.detail.value)
    },

    /**
     * When the user wants to share this miniapp
     */
    onShareAppMessage: function () {
        return {
            title: 'GT库存',
            desc: '国泰餐厅库存管理程序',
            path: 'pages/inventory/inventoryUpdate/inventoryUpdate'
        }
    }
})


/**
 * Set the selected category in the db to the page data.
 * 
 * @method setCategory
 * @param{Object} page The page
 * @param{String} category_id The collection id of the selected category
 */
function setCategory(page, category_id) {
    db.collection(db_category)
        .where({
            _id: category_id
        })
        .field({
            _id: true,
            category_name: true,
            item_amount: true
        })
        .get({
            success: res => {
                page.setData({
                    category_selected: res.data[0]
                })

                console.log('Get the selected category ', page.data.category_selected)

                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to get category info in the database', err)
                wx.hideLoading()
            }
        })
}


/**
 * Set the amount of items in the db to the page data.
 * 
 * @method setItemAmount
 * @param page The page
 */
function setItemAmount(page) {
    db.collection(db_category)
        .where({
            _id: category_id
        })
        .field({
            item_amount: true
        })
        .get({
            success: res => {
                if (res.data.length === 1) {
                    page.setData({
                        error_happened: false
                    })

                    existed_item_amount = res.data[0].item_amount

                    console.log('Get the amount of existed items in the current category.', res.data[0].item_amount)
                    wx.hideLoading()

                } else {
                    realTimeLog.warn('Failed to get item amount from the category database.', res)

                    wx.hideLoading()
                    wx.showToast({
                        title: '网络错误，请重试',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                realTimeLog.error('Failed to get item amount from the category database.', err)

                wx.hideLoading()
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                })
            }
        })
}


/**
 * Check all the input text state, if all input text get filled, return true,
 * if not, return false.
 * 
 * @method isAllFilled
 * @param{Object} page The page
 * @return{Boolean} Whether all the input text get filled
 */
function isAllFilled(page) {
    var pd = page.data

    if(pd.name_filled && pd.daily_filled && pd.prepare_filled && pd.stock_filled && pd.capacity_filled) {
        return true
    }

    return false
}


/**
 * Add the new item to the item collection.
 * Update the amount of the items inside this category in the category collection.
 * Then return to the previous page.
 * 
 * @method addItem
 * @param category_selected{Object} The selected category
 * @param item_info{Object} The info of the new item
 */
async function addItem(category_selected, item_info) {
    // use an object to hold the data that plans to add to db
    var base_number = parseInt(item_info.base)
    var scale_number = parseFloat(item_info.scale)
    var stock_value = parseFloat(item_info.stock)
    var max_capacity = parseInt(item_info.capacity)

    var legal_input = true
    if (isNaN(base_number) || isNaN(scale_number) || isNaN(stock_value) || isNaN(max_capacity)) {
        legal_input = false
    }
    if(base_number < 1 || scale_number < 1 || stock_value < 0 || max_capacity < base_number * scale_number) {
        legal_input = false
    }
    if(stock_value > max_capacity) {
        legal_input = false
    }

    if(legal_input) {
        var add_item_data = {
            category_id: category_selected._id,
            item_order: category_selected.item_amount,
            item_name: item_info.name,
            base_number: base_number,
            scale_number: scale_number,
            stock_value: stock_value,
            max_capacity: max_capacity,
            item_state: 0
        }

        // add the new item to the collection
        await addToDB(add_item_data)
        console.log('Add the new item to the collection: ', add_item_data)

        // use an object to hold the data that plans to update to db
        var update_category_data = {
            item_amount: category_selected.item_amount + 1
        }

        // update the total amount of the items inside this category
        await updateItemAmount(update_category_data, category_selected._id)
        console.log('Update the total amount of the items: ', update_category_data.item_amount)

        pAction.navigateBackUser('新增成功', 1)
    } else {
        console.log('User input illegal')
        wx.hideLoading()
        wx.showToast({
            title: '输入错误',
            icon: 'none'
        })
    }
}


/**
 * Add the new item to the selected category.
 * 
 * @method addToDB
 * @param add_item_data The data that plans to add to the db
 */
function addToDB(add_item_data) {

    return new Promise((resolve, reject) => {
        // call dbAdd() cloud function to add the category to collection
        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_item,
                add_data: add_item_data
            },
            success: res => {
                resolve()
            },
            fail: err => {
                // if get a failed result
                console.error('Failed to use cloud function dbAdd()', err)
                reject()
            }
        })
    })
}


/**
 * Update the amount of the items inside this category.
 * 
 * @method updateItemAmount
 * @param update_category_data The data that plans to update to db
 * @param category_id The id of the selected category
 */
function updateItemAmount(update_category_data, category_id) {

    return new Promise((resolve, reject) => {
        // call dbUpdate() cloud function to update the category amount
        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_category,
                update_data: update_category_data,
                uid: category_id
            },
            success: res => {
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
