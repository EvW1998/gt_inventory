/**
 * The page to modify an item from the selected category.
 */
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_item = 'item' // the collection of items

var category_id = ''

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
        item_selected: {}, // the selected item for modifying
        name_filled: true, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        daily_filled: true, // whether the daily input is filled
        daily_warn_enable: false, // whether the warning icon for the daily should be enabled
        prepare_filled: true, // whether the prepare input is filled
        prepare_warn_enable: false, // whether the warning icon for the prepare should be enabled
        stock_filled: true, // whether the stock input is filled
        stock_warn_enable: false, // whether the warning icon for the stock should be enabled
        capacity_filled: true, // whether the capacity input is filled
        capacity_warn_enable: false, // whether the warning icon for the capacity should be enabled
        button_enable: true, // whether the sumbit button is enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page gets loaded, get the amount of existing items.
     */
    onLoad: function (options) {
        category_id = options.category_id

        var categories = wx.getStorageSync('categories')
        var items = wx.getStorageSync('items')

        this.setData({
            category_name: categories[category_id],
            item_selected: items[options.item_id]
        })

        stock_value = this.data.item_selected.stock
        daily_value = this.data.item_selected.daily_refill
        prepare_value = this.data.item_selected.prepare_day
        capacity_value = this.data.item_selected.capacity
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

        if (!isAllFilled(this)) {
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

        updateItemProcess(this, e.detail.value)
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
 * Check all the input text state, if all input text get filled, return true,
 * if not, return false.
 * 
 * @method isAllFilled
 * @param{Object} page The page
 * @return{Boolean} Whether all the input text get filled
 */
function isAllFilled(page) {
    var pd = page.data

    if (pd.name_filled && pd.daily_filled && pd.prepare_filled && pd.stock_filled && pd.capacity_filled) {
        return true
    }

    return false
}


/**
 * Add the new item to the item collection.
 * Update the amount of the items inside this category in the category collection.
 * Then return to the previous page.
 * 
 * @method updateItemProcess
 * @param page{Page} The page
 * @param inputs{Object} The info of the new item
 */
async function updateItemProcess(page, inputs) {
    var update_item_data = {}
    var item_original = page.data.item_selected

    page.setData({
        progress: 0,
        progress_text: '检查名称',
        progress_enable: true
    })

    if (inputs.name !== item_original.name) {
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
                update_item_data['name'] = inputs.name
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
    }

    if (parseInt(inputs.daily) !== item_original.daily_refill) {
        update_item_data['daily_refill'] = parseInt(inputs.daily)
    }

    if (parseFloat(inputs.prepare) !== item_original.prepare_day) {
        update_item_data['prepare_day'] = parseFloat(inputs.prepare)
    }

    if (parseFloat(inputs.stock) !== item_original.stock) {
        update_item_data['stock'] = parseFloat(inputs.stock)
    }

    if (parseInt(inputs.capacity) !== item_original.capacity) {
        update_item_data['capacity'] = parseInt(inputs.capacity)
    }

    page.setData({
        progress: 50,
        progress_text: '检查通过，正在上传补货品项到' + page.data.category_name
    })

    if (Object.keys(update_item_data).length !== 0) {
        var update_result = await updateItem(item_original._id, update_item_data)

        if (update_result.stat) {
            page.setData({
                progress: 100,
                progress_text: '上传成功'
            })

            realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modified an item ', item_original._id, update_item_data, 'into the category ', page.data.category_name, category_id, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

            pAction.navigateBackUser('修改成功', 1)
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
    } else {
        page.setData({
            progress: 100,
            progress_text: '上传成功'
        })

        pAction.navigateBackUser('修改成功', 1)
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


function updateItem(item_id, update_item_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_item,
                update_data: update_item_data,
                uid: item_id
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
