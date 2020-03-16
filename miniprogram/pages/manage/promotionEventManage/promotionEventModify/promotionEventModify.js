/**
 * Modify a promotion event in the cloud database
 */
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const date = require('../../../../utils/date.js') // require the util of date

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_promotion_event = 'promotion_event' // the collection of promotion events


Page({

    /**
     * Data for the page
     */
    data: {
        error_happened: true, // whether error happened
        promotion_event_selected: {}, // the selected promotion event
        name_filled: true, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        products_key_name: {}, // the products
        products_key_id: {}, // the products that use the product id as the key
        product_index: 0, // the index of the product picker
        product_array: [], // the picker items of the product picker
        product_picker_enable: false, // whether the picker of products is enabled
        product_picked: {}, // the products for the promotion event
        product_filled: true, // whether the products is filled
        product_warn_enable: false, // whether the warning icon of the products shoud be enabled
        types_key_name: {}, // the promotion types
        types_key_id: {}, // the promotion types that use the promotion type id as the key
        type_index: 0, // the index of the promotion type picker
        type_array: [], // the picker items of the promotion type picker
        type_picker_enable: false, // whether the picker of promotion types is enabled
        type_picked: '', // the promotion type of the promotion event
        type_filled: true, // whether the promotion type is filled
        today: '', // the date of today
        start_date: '', // the start date of the promotion event
        start_date_filled: true, // whether the start date is filled
        end_date: '', // the end date of the promotion event
        end_date_filled: true, // whether the end date is filled
        button_enable: false, // whether the sumbit button is enabled
        pprogress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page is loaded
     */
    onLoad: function (options) {
        setPickerAndPromotionEvent(this, options.promotion_event_id)
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
        var new_name = event.detail.value

        if (new_name.length === 0) {
            name_filled = false
            name_warn_enable = true

            this.setData({
                button_enable: false
            })
        }

        this.setData({
            name_filled: name_filled,
            name_warn_enable: name_warn_enable
        })

        if (isAllFilled(this)) {
            this.setData({
                button_enable: true
            })
        }
    },

    /**
     * Add a product to the new promotion event.
     * 
     * @method addProduct
     * @param{Object} e The pick event
     */
    addProduct: function (e) {
        var product_name = this.data.product_array[e.detail.value]
        var product = this.data.products_key_name[product_name]
        var product_picked = this.data.product_picked

        console.log('Picked product ', product_name)

        if (product._id in product_picked) {
            wx.showToast({
                title: '请勿重复添加已选产品',
                icon: 'none'
            })
        } else {
            product_picked[product._id] = product._id

            this.setData({
                product_picked: product_picked,
                product_filled: true,
                product_warn_enable: false
            })

            if (isAllFilled(this)) {
                this.setData({
                    button_enable: true
                })
            }
        }
    },

    /**
     * Remove a picked product from the new promotion event.
     * 
     * @method removeProduct
     * @param{Object} e The remove event
     */
    removeProduct: function (e) {
        var product_id = e.currentTarget.id
        var product_picked = this.data.product_picked

        console.log('Remove product ', this.data.products_key_id[product_id].name)

        delete product_picked[product_id]

        var product_warn_enable = false
        var product_filled = true

        if (Object.keys(product_picked).length === 0) {
            product_warn_enable = true
            product_filled = false

            this.setData({
                button_enable: false
            })
        }

        this.setData({
            product_picked: product_picked,
            product_warn_enable: product_warn_enable,
            product_filled: product_filled
        })
    },

    /**
     * Change the promotion type of the new promotion event.
     * 
     * @method changeType
     * @param{Object} e The change event
     */
    changeType: function (e) {
        var type_name = this.data.type_array[e.detail.value]
        var type_picked = this.data.types_key_name[type_name]._id

        console.log('Pick promotion type ', type_name)

        this.setData({
            type_picked: type_picked,
            type_filled: true
        })

        if (isAllFilled(this)) {
            this.setData({
                button_enable: true
            })
        }
    },

    /**
     * Change the start date of the new promotion event.
     * 
     * @method changeStartDate
     * @param{Object} e The change event
     */
    changeStartDate: function (e) {
        var start_date = e.detail.value
        var end_date = this.data.end_date

        if (end_date < start_date) {
            end_date = start_date
        }

        console.log('Pick start date ', start_date)

        this.setData({
            start_date: start_date,
            start_date_filled: true,
            end_date: end_date
        })

        if (isAllFilled(this)) {
            this.setData({
                button_enable: true
            })
        }
    },

    /**
     * Change the end date of the new promotion event.
     * 
     * @method changeEndDate
     * @param{Object} e The change event
     */
    changeEndDate: function (e) {
        var end_date = e.detail.value

        console.log('Pick end date ', end_date)

        this.setData({
            end_date: end_date,
            end_date_filled: true
        })

        if (isAllFilled(this)) {
            this.setData({
                button_enable: true
            })
        }
    },

    /**
     * Add a new promotion event to the cloud database.
     * 
     * @method formSubmit
     * @param{Object} e The submit event
     */
    formSubmit: async function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        updatePromotionEventProcess(this, e.detail.value)
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
 * Set up all the pickers.
 * 
 * @method setPickerAndPromotionEvent
 * @param{Page} page The page
 */
function setPickerAndPromotionEvent(page, promotion_event_id) {
    var product_picker = []
    var promotion_type_picker = []
    var promotion_event_selected = {}

    try {
        product_picker = wx.getStorageSync('product_picker')
        promotion_type_picker = wx.getStorageSync('promotion_type_picker')
        var events = wx.getStorageSync('promotion_events')
        promotion_event_selected = events[promotion_event_id]
    } catch (err) {
        realTimeLog.error('Failed to get products and promtion types for the picker from the local stroage.', err)

        wx.showToast({
            title: '本地存储读取错误，请重试',
            icon: 'none'
        })

        return
    }

    var product_array = []
    var products_key_name = {}
    var products_key_id = {}
    for (var i in product_picker) {
        product_array.push(product_picker[i].name)
        products_key_name[product_picker[i].name] = product_picker[i]
        products_key_id[product_picker[i]._id] = product_picker[i]
    }

    var type_array = []
    var types_key_name = {}
    var types_key_id = {}
    for (var i in promotion_type_picker) {
        type_array.push(promotion_type_picker[i].name)
        types_key_name[promotion_type_picker[i].name] = promotion_type_picker[i]
        types_key_id[promotion_type_picker[i]._id] = promotion_type_picker[i]
    }

    var today = date.dateInformat(date.dateInArray(new Date()))

    page.setData({
        error_happened: false,
        promotion_event_selected: promotion_event_selected,
        products_key_name: products_key_name,
        products_key_id: products_key_id,
        product_array: product_array,
        product_picker_enable: true,
        types_key_name: types_key_name,
        types_key_id: types_key_id,
        type_array: type_array,
        type_picker_enable: true,
        today: today,
        start_date: promotion_event_selected.start_date,
        end_date: promotion_event_selected.end_date,
        product_picked: promotion_event_selected.products,
        type_picked: promotion_event_selected.promotion_type
    })
}


/**
 * Return whether all the items in the form is filled.
 * 
 * @method isAllFilled
 * @param{Page} page The page
 * @return{Boolean} whether all the items in the form is filled
 */
function isAllFilled(page) {
    var d = page.data
    if (d.name_filled && d.product_filled && d.type_filled && d.start_date_filled && d.end_date_filled) {
        return true
    }
    return false
}


async function updatePromotionEventProcess(page, inputs) {
    var update_promotion_event_data = {}
    var event_log = {}

    page.setData({
        progress: 0,
        progress_text: '检查修改后促销事件名称',
        progress_enable: true
    })

    if (inputs.name !== page.data.promotion_event_selected.name) {
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
                    content: '新增促销事件的名称与此餐厅已有促销事件的名称重复，请更改后重试。',
                    showCancel: false
                })

                return
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

    update_promotion_event_data['restaurant_id'] = app.globalData.restaurant_id
    update_promotion_event_data['name'] = inputs.name
    update_promotion_event_data['products'] = page.data.product_picked
    update_promotion_event_data['promotion_type'] = page.data.type_picked
    update_promotion_event_data['start_date'] = page.data.start_date
    update_promotion_event_data['end_date'] = page.data.end_date

    event_log['name'] = inputs.name
    event_log['start_date'] = page.data.start_date
    event_log['end_date'] = page.data.end_date
    event_log['promotion_type'] = page.data.types_key_id[page.data.type_picked].name

    event_log['products'] = []
    for (let i in page.data.product_picked) {
        event_log['products'].push(page.data.products_key_id[i].name)
    }

    page.setData({
        progress: 33,
        progress_text: '检查修改后促销事件的促销产品'
    })

    var p_result = await checkProductRepetition(page.data.promotion_event_selected._id, update_promotion_event_data)

    if (p_result.stat) {
        if (p_result.result.repetition) {
            page.setData({
                progress: 0,
                progress_text: '未开始',
                progress_enable: false
            })

            wx.hideLoading()
            var content = '已有事件 ' + p_result.result.repetition_name + ' 在同一日期，与新增事件的促销产品及促销类型重复，请修改后重试。'
            wx.showModal({
                title: '错误',
                content: content,
                showCancel: false
            })

            return
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
        progress: 67,
        progress_text: '检查通过，正在上传修改后的促销事件'
    })

    var update_result = await updatePromotionEvent(page.data.promotion_event_selected._id, update_promotion_event_data)

    if (update_result.stat) {
        page.setData({
            progress: 100,
            progress_text: '上传成功'
        })

        realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modified a promotion event ', event_log, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

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
}


function isRepeated(name) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = true

        db.collection(db_promotion_event)
            .where({
                restaurant_id: app.globalData.restaurant_id,
                name: name
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
                    realTimeLog.error('Failed to get the promotion event with the same date as the new promotion event in the same restaurant from the database.', err)

                    resolve(result)
                }
            })
    })
}


/**
 * Return whether the new promotion event is repeated compare to existed events
 * 
 * @method checkProductRepetition
 * @param{Object} event The new promotion event
 * @return{Promise} The state of the function. Resolve with whether the new promotion event is repeated compare to existed events.
 */
function checkProductRepetition(promotion_event_id, event) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = {}

        wx.cloud.callFunction({
            name: 'getPromotionEvent',
            data: {
                start_date: event.start_date,
                end_date: event.end_date
            },
            success: res => {
                result['stat'] = true

                var repetition = false
                var repetition_name = ''

                for (var i in res.result) {
                    if (res.result[i]._id === promotion_event_id) {
                        continue
                    }

                    for (var j in event.products) {
                        if (j in res.result[i].products && event.promotion_type === res.result[i].promotion_type) {
                            repetition_name = res.result[i].name
                            repetition = true

                            console.log('Found a repeated promotion event ', repetition_name, ' that contains the same product with the same promotion type and date, compared to the new promotion event.')

                            break
                        }
                    }

                    if (repetition) {
                        break
                    }
                }

                result['result']['repetition'] = repetition
                result['result']['repetition_name'] = repetition_name
                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to get promotion events which contains the same date, compared to the start and end date of the new promotion event.', err)
                resolve(result)
            }
        })
    })
}


function updatePromotionEvent(promotion_event_id, update_promotion_event_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbSet',
            data: {
                collection_name: db_promotion_event,
                set_data: update_promotion_event_data,
                uid: promotion_event_id
            },
            success: res => {
                if (res.result.stats.updated === 1) {
                    result['stat'] = true
                }
                resolve(result)
            },
            fail: err => {
                resolve(result)
            }
        })
    })
}
