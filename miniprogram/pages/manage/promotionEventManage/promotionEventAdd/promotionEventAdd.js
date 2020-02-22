/**
 * Add a new promotion event to the cloud database
 */
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const date = require('../../../../utils/date.js') // require the util of date

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_promotion_event = 'promotion_event' // the collection of promotion events
const db_product = 'product' // the collection of products
const db_promotion_type = 'promotion_type' // the collection of promotion types


Page({

    /**
     * Data for the page
     */
    data: {
        name_filled: false, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        products: {}, // the products
        products_key_id: {}, // the products that use the product id as the key
        product_index: 0, // the index of the product picker
        product_array: [], // the picker items of the product picker
        product_picker_enable: false, // whether the picker of products is enabled
        product_picked: {}, // the products for the promotion event
        product_filled: false, // whether the products is filled
        product_warn_enable: false, // whether the warning icon of the products shoud be enabled
        types: {}, // the promotion types
        types_key_id: {}, // the promotion types that use the promotion type id as the key
        type_index: 0, // the index of the promotion type picker
        type_array: [], // the picker items of the promotion type picker
        type_picker_enable: false, // whether the picker of promotion types is enabled
        type_picked: '', // the promotion type of the promotion event
        type_filled: false, // whether the promotion type is filled
        today: '', // the date of today
        start_date: '', // the start date of the promotion event
        start_date_filled: false, // whether the start date is filled
        end_date: '', // the end date of the promotion event
        end_date_filled: false, // whether the end date is filled
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page is loaded
     */
    onLoad: function () {
        setPicker(this)
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

        if (new_name.length == 0) {
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
        var product = this.data.products[product_name]
        var product_picked = this.data.product_picked

        if (product._id in product_picked) {
            console.log('Picked product is already in the list.', product._id)
            wx.showToast({
                title: '无法添加已选产品',
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

            console.log('Add a new product ', product_name,' to the picked products list of the new promotion event.')
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

        delete product_picked[product_id]

        var product_warn_enable = false
        var product_filled = true

        if (Object.keys(product_picked).length == 0) {
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

        console.log('Remove the product ', this.data.products_key_id[product_id].product_name, ' from the picked products list of the new promotion event.')
    },

    /**
     * Change the promotion type of the new promotion event.
     * 
     * @method changeType
     * @param{Object} e The change event
     */
    changeType: function (e) {
        var type_name = this.data.type_array[e.detail.value]
        var type_picked = this.data.types[type_name]._id

        this.setData({
            type_picked: type_picked,
            type_filled: true
        })

        if (isAllFilled(this)) {
            this.setData({
                button_enable: true
            })
        }
        
        console.log('Change the promotion event to ', type_name, ' for the new promotion event.')
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

        console.log('Change to start date to ', start_date, ' for the new promotion event.')
    },

    /**
     * Change the end date of the new promotion event.
     * 
     * @method changeEndDate
     * @param{Object} e The change event
     */
    changeEndDate: function (e) {
        var end_date = e.detail.value

        this.setData({
            end_date: end_date,
            end_date_filled: true
        })

        if (isAllFilled(this)) {
            this.setData({
                button_enable: true
            })
        }

        console.log('Change to end date to ', end_date, ' for the new promotion event.')
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

        this.setData({
            progress_enable: true
        })

        var promotion_event = {}
        promotion_event['promotion_event_name'] = e.detail.value.name
        promotion_event['products'] = this.data.product_picked
        promotion_event['promotion_type'] = this.data.type_picked
        promotion_event['start_date'] = this.data.start_date
        promotion_event['end_date'] = this.data.end_date

        var event_log = {}
        event_log['promotion_event_name'] = e.detail.value.name
        event_log['start_date'] = this.data.start_date
        event_log['end_date'] = this.data.end_date
        event_log['promotion_type'] = this.data.types_key_id[this.data.type_picked].promotion_type_name

        event_log['products'] = []
        for (var i in this.data.product_picked) {
            event_log['products'].push(this.data.products_key_id[i].product_name)
        }

        var n_result = await checkNameRepetition(promotion_event)

        this.setData({
            progress: 33
        })

        if (n_result) {
            this.setData({
                progress: 0,
                progress_enable: false
            })

            wx.hideLoading()
            var content = '新增促销事件的名称与已有事件重复！'
            wx.showModal({
                title: '错误',
                content: content,
                showCancel: false
            })
        } else {
            // check whether the new promotion event is repeated compare to existed events
            var p_result = await checkProductRepetition(promotion_event)

            this.setData({
                progress: 66
            })

            if (p_result.repetition) {
                this.setData({
                    progress: 0,
                    progress_enable: false
                })

                wx.hideLoading()
                var content = '已有事件 ' + p_result.repetition_name + ' 在同一日期，与新增事件的促销产品及促销类型重复！'
                wx.showModal({
                    title: '错误',
                    content: content,
                    showCancel: false
                })
            } else {
                wx.cloud.callFunction({
                    name: 'dbAdd',
                    data: {
                        collection_name: db_promotion_event,
                        add_data: promotion_event
                    },
                    success: res => {
                        this.setData({
                            progress: 100
                        })

                        console.log('Add a new promotion event to the database.', event_log)
                        realTimeLog.info('User ', app.globalData.true_name, ' add a new promotion event to the database.', event_log)
                        pAction.navigateBackUser('新增成功', 1)
                    },
                    fail: err => {
                        realTimeLog.error('Failed to add a new promotion event to the database.', err)
                        wx.hideLoading()
                    }
                })
            }
        }
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
 * @method setPicker
 * @param{Page} page The page
 */
function setPicker(page) {
    // set up the product picker
    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_product,
            collection_limit: 100,
            collection_field: {},
            collection_where: {},
            collection_orderby_key: 'product_name',
            collection_orderby_order: 'asc'
        },
        success: res => {
            var product_array = []
            var products = {}
            var products_key_id = {}
            for (var i in res.result) {
                product_array.push(res.result[i].product_name)
                products[res.result[i].product_name] = res.result[i]
                products_key_id[res.result[i]._id] = res.result[i]
            }

            page.setData({
                products: products,
                products_key_id: products_key_id,
                product_array: product_array,
                product_picker_enable: true
            })
            console.log('Get products for the picker.', product_array)
        },
        fail: err => {
            realTimeLog.error('Failed to get products for adding a promotion event.', err)
        }
    })

    // set up the promotion type picker
    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_promotion_type,
            collection_limit: 100,
            collection_field: {},
            collection_where: {},
            collection_orderby_key: 'promotion_type_name',
            collection_orderby_order: 'asc'
        },
        success: res => {
            var type_array = []
            var types = {}
            var types_key_id = {}
            for (var i in res.result) {
                type_array.push(res.result[i].promotion_type_name)
                types[res.result[i].promotion_type_name] = res.result[i]
                types_key_id[res.result[i]._id] = res.result[i]
            }

            page.setData({
                types: types,
                types_key_id: types_key_id,
                type_array: type_array,
                type_picker_enable: true
            })
            console.log('Get promotion types for the picker.', type_array)
        },
        fail: err => {
            realTimeLog.error('Failed to get promotion types for adding a promotion event.', err)
        }
    })

    // set up the start date picker and the end date picker
    var today = date.dateInformat(date.dateInArray(new Date()))
    page.setData({
        today: today,
        start_date: today,
        end_date: today
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


/**
 * Return whether the new promotion event name is same as other promotion events in the database.
 * 
 * @method checkNameRepetition
 * @param{Object} event The new promotion event
 * @return{Promise} The state of the function. Resolve with whether the new promotion event name is same as other promotion events in the database.
 */
function checkNameRepetition(event) {
    return new Promise((resolve, reject) => {
        db.collection(db_promotion_event)
            .where({
                promotion_event_name: event.promotion_event_name
            })
            .get({
                success: res => {
                    if (res.data.length === 0) {
                        resolve(false)
                    } else {
                        console.log('Found a promotion event with the same name of the new promotion event.')
                        resolve(true)
                    }
                },
                fail: err => {
                    realTimeLog.error('Failed to get the promotion event with the same name of the new promotion event.', err)
                    reject(true)
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
function checkProductRepetition(event) {
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'getPromotionEvent',
            data: {
                start_date: event.start_date,
                end_date: event.end_date
            },
            success: res => {
                var repetition = false
                var repetition_name = ''

                for (var i in res.result) {
                    for (var j in event.products) {
                        if (j in res.result[i].products && event.promotion_type == res.result[i].promotion_type) {
                            repetition_name = res.result[i].promotion_event_name
                            repetition = true

                            console.log('Found a repeated promotion event ', repetition_name, ' that contains the same product with the same promotion type and date, compared to the new promotion event.')

                            break
                        }
                    }

                    if (repetition) {
                        break
                    }
                }

                resolve({
                    repetition: repetition,
                    repetition_name: repetition_name
                })
            },
            fail: err => {
                realTimeLog.error('Failed to get promotion events which contains the same date, compared to the start and end date of the new promotion event.', err)
                reject({
                    repetition: true
                })
            }
        })
    })
}
