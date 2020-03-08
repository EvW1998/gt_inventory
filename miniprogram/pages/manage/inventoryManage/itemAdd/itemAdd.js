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

var stock_value = undefined
var daily_value = undefined
var prepare_value = undefined
var capacity_value = undefined


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
        var capacity_filled = this.data.capacity_filled
        var capacity_warn_enable = this.data.capacity_warn_enable
        var button_enable = true
        var new_daily = event.detail.value

        if (!uInput.isInteger(new_daily)) {
            daily_filled = false
            daily_warn_enable = true
            daily_value = undefined
        } else if (parseInt(new_daily) < 1) {
            daily_filled = false
            daily_warn_enable = true
            daily_value = undefined
        } else {
            daily_value = parseInt(new_daily)

            if (this.data.prepare_filled && capacity_filled) {
                if (daily_value * prepare_value > capacity_value) {
                    capacity_filled = false
                    capacity_warn_enable = true
                }
            } else if (prepare_value !== undefined && capacity_value !== undefined) {
                if (daily_value * prepare_value <= capacity_value) {
                    capacity_filled = true
                    capacity_warn_enable = false
                }

                if (this.data.stock_filled) {
                    if (stock_value > capacity_value) {
                        capacity_filled = false
                        capacity_warn_enable = true
                    }
                }
            }
        }

        this.setData({
            daily_filled: daily_filled,
            capacity_filled: capacity_filled
        })

        if (!isAllFilled(this)) {
            button_enable = false
        }

        this.setData({
            daily_warn_enable: daily_warn_enable,
            capacity_warn_enable: capacity_warn_enable,
            button_enable: button_enable
        })
    },

    prepareInput: function (event) {
        var prepare_filled = true
        var prepare_warn_enable = false
        var capacity_filled = this.data.capacity_filled
        var capacity_warn_enable = this.data.capacity_warn_enable
        var button_enable = true
        var new_prepare = event.detail.value

        if (!uInput.isNumber(new_prepare)) {
            prepare_filled = false
            prepare_warn_enable = true
            prepare_value = undefined
        } else if (parseFloat(new_prepare) < 1) {
            prepare_filled = false
            prepare_warn_enable = true
            prepare_value = undefined
        } else {
            prepare_value = parseFloat(new_prepare)

            if (this.data.daily_filled && capacity_filled) {
                if (daily_value * prepare_value > capacity_value) {
                    capacity_filled = false
                    capacity_warn_enable = true
                }
            } else if (daily_value !== undefined && capacity_value !== undefined) {
                if (daily_value * prepare_value <= capacity_value) {
                    capacity_filled = true
                    capacity_warn_enable = false
                }

                if (this.data.stock_filled) {
                    if (stock_value > capacity_value) {
                        capacity_filled = false
                        capacity_warn_enable = true
                    }
                }
            }
        }

        this.setData({
            prepare_filled: prepare_filled,
            capacity_filled: capacity_filled
        })

        if (!isAllFilled(this)) {
            button_enable = false
        }

        this.setData({
            prepare_warn_enable: prepare_warn_enable,
            capacity_warn_enable: capacity_warn_enable,
            button_enable: button_enable
        })
    },

    stockInput: function (event) {
        var stock_filled = true
        var stock_warn_enable = false
        var capacity_filled = this.data.capacity_filled
        var capacity_warn_enable = this.data.capacity_warn_enable
        var button_enable = true
        var new_stock = event.detail.value

        if (!uInput.isNumber(new_stock)) {
            stock_filled = false
            stock_warn_enable = true
            stock_value = undefined
        } else if (parseFloat(new_stock) < 0) {
            stock_filled = false
            stock_warn_enable = true
            stock_value = undefined
        } else {
            stock_value = parseFloat(new_stock)

            if (capacity_filled) {
                if (stock_value > capacity_value) {
                    capacity_filled = false
                    capacity_warn_enable = true
                }
            } else if (capacity_value !== undefined) {
                if (stock_value <= capacity_value) {
                    capacity_filled = true
                    capacity_warn_enable = false
                }

                if (this.data.daily_filled && this.data.prepare_filled) {
                    if (daily_value * prepare_value > capacity_value) {
                        capacity_filled = false
                        capacity_warn_enable = true
                    }
                }
            }
        }

        this.setData({
            stock_filled: stock_filled,
            capacity_filled: capacity_filled
        })

        if (!isAllFilled(this)) {
            button_enable = false
        }

        this.setData({
            stock_warn_enable: stock_warn_enable,
            capacity_warn_enable: capacity_warn_enable,
            button_enable: button_enable
        })
    },

    capacityInput: function (event) {
        var capacity_filled = true
        var capacity_warn_enable = false
        var button_enable = true
        var new_capacity = event.detail.value

        if (!uInput.isInteger(new_capacity)) {
            capacity_filled = false
            capacity_warn_enable = true
            capacity_value = undefined
        } else if (parseInt(new_capacity) < 1) {
            capacity_filled = false
            capacity_warn_enable = true
            capacity_value = undefined
        } else {
            capacity_value = parseInt(new_capacity)

            if (this.data.daily_filled && this.data.prepare_filled) {
                if (daily_value * prepare_value > capacity_value) {
                    capacity_filled = false
                    capacity_warn_enable = true
                }
            }

            if (this.data.stock_filled) {
                if (stock_value > capacity_value) {
                    capacity_filled = false
                    capacity_warn_enable = true
                }
            }
        }

        this.setData({
            capacity_filled: capacity_filled
        })

        if (!isAllFilled(this)) {
            button_enable = false
        }

        this.setData({
            capacity_warn_enable: capacity_warn_enable,
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
            title: '上传中',
            mask: true
        })

        addItemProcess(this, e.detail.value)
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
 * @param page{Page} The page
 * @param inputs{Object} The info of the new item
 */
async function addItemProcess(page, inputs) {
    var add_item_data = {}
    var update_category_data = {}

    page.setData({
        progress: 0,
        progress_text: '检查名称',
        progress_enable: true
    })

    var n_result = await isRepeated(inputs.name)

    if (n_result.stat) {
        if (n_result.result) {
            page.setData({
                progress: 0,
                progress_text: '未开始',
                progress_enable: false
            })

            wx.hideLoading()
            wx.showModal({
                title: '错误',
                content: '输入的品项名称与此餐厅已有品项重复，请更改后重试。',
                showCancel: false
            })

            return
        } else {
            add_item_data['restaurant_id'] = app.globalData.restaurant_id
            add_item_data['category_id'] = category_id
            add_item_data['item_order'] = existed_item_amount
            add_item_data['name'] = inputs.name
            add_item_data['daily_refill'] = parseInt(inputs.daily)
            add_item_data['prepare_day'] = parseFloat(inputs.prepare)
            add_item_data['stock'] = parseFloat(inputs.stock)
            add_item_data['capacity'] = parseInt(inputs.capacity)

            update_category_data['item_amount'] = existed_item_amount + 1
        }

    } else {
        page.setData({
            progress: 0,
            progress_text: '未开始',
            progress_enable: false
        })

        wx.hideLoading()
        wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
        })

        return
    }

    page.setData({
        progress: 33,
        progress_text: '检查通过，正在上传品类数据'
    })

    var update_result = await updateCategory(update_category_data)

    if (!update_result.stat) {
        page.setData({
            progress: 0,
            progress_text: '未开始',
            progress_enable: false
        })

        wx.hideLoading()
        wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
        })

        return
    }

    page.setData({
        progress: 67,
        progress_text: '正在上传新的补货品项到' + page.data.category_name
    })
    
    var add_result = await addItem(add_item_data)

    if (add_result.stat) {
        page.setData({
            progress: 100,
            progress_text: '上传成功'
        })

        realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' add a new item ', add_item_data, 'into the category ', page.data.category_name, category_id, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

        pAction.navigateBackUser('新增成功', 1)
    } else {
        page.setData({
            progress: 0,
            progress_text: '未开始',
            progress_enable: false
        })

        wx.hideLoading()
        wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
        })

        return
    }
}


function isRepeated(item_name) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = true

        db.collection(db_item)
            .where({
                restaurant_id: app.globalData.restaurant_id,
                name: item_name
            })
            .field({
                _id: true
            })
            .get({
                success: res => {
                    result['stat'] = true
                    if (res.data.length === 0) {
                        result['result'] = false
                    }

                    resolve(result)
                },
                fail: err => {
                    realTimeLog.error('Failed to get the item with the same name as the new item in the same restaurant from the database.', err)

                    resolve(result)
                }
            })
    })
}


function updateCategory(update_category_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_category,
                update_data: update_category_data,
                uid: category_id
            },
            success: res => {
                if (res.result.stats.updated === 1) {
                    result['stat'] = true
                    result['result'] = res
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to update the category item amount by using dbUpdate().', err)
                resolve(result)
            }
        })
    })
}


function addItem(add_item_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_item,
                add_data: add_item_data
            },
            success: res => {
                if (res.result._id !== undefined) {
                    result['stat'] = true
                    result['result'] = res
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to add a new item into the database by using dbAdd().', err)
                resolve(result)
            }
        })
    })
}
