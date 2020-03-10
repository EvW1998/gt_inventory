/**
 * The page to add new sale to the miniapp
 */
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const date = require('../../../../utils/date.js'); //require the util of date
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_sale = 'sale' // the collection of sales


Page({
    /**
     * Data in the page
     */
    data: {
        today: '2020-01-01', // the date of today
        sale_filled: false, // whether the name input is filled
        sale_warn_enable: false, // whether the warning icon for the name should be enabled
        date: '', // the sale date
        date_filled: false, // whether the name input is filled
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page gets loaded
     */
    onLoad: function () {
        this.setData({
            today: date.dateInformat(date.dateInArray(new Date()))
        })
    },

    saleInput: function (event) {
        var sale_filled = true
        var sale_warn_enable = false
        var button_enable = false
        var new_sale = event.detail.value

        if (!uInput.isNumber(new_sale)) {
            sale_filled = false
            sale_warn_enable = true
        } else if (parseFloat(new_sale) <= 0) {
            sale_filled = false
            sale_warn_enable = true
        }

        if (sale_filled && this.data.date_filled) {
            button_enable = true
        }

        this.setData({
            sale_filled: sale_filled,
            sale_warn_enable: sale_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * When the selected date is changed, update the page data.
     * 
     * @method bindDateChange
     * @param{Object} e The return value from the date picker
     */
    bindDateChange: function(e) {
        var button_enable = false

        if (this.data.sale_filled) {
            button_enable = true
        }

        this.setData({
            date: e.detail.value,
            date_filled: true,
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
        var page = this

        if (parseFloat(e.detail.value.sale) < 10000 || parseFloat(e.detail.value.sale) > 40000) {
            wx.showModal({
                title: '警告',
                content: '新增营业额的数值异常，输入值为' + e.detail.value.sale + '元，是否继续？',
                success (res) {
                    if (res.confirm) {
                        wx.showLoading({
                            title: '上传中',
                            mask: true
                        })

                        addSaleProcess(page, e.detail.value)
                    }
                }
            })
        } else {
            wx.showLoading({
                title: '上传中',
                mask: true
            })

            addSaleProcess(page, e.detail.value)
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
 * Add the new sale data to the collection.
 * 
 * @method addSaleProcess
 * @param{Object} value The value from the form
 */
async function addSaleProcess(page, inputs) {
    var add_sale_data = {}

    page.setData({
        progress: 0,
        progress_text: '检查日期',
        progress_enable: true
    })

    var n_result = await isRepeated(page.data.date)

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
                content: '新增营业额的日期与此餐厅已有营业额的日期重复，请更改后重试。',
                showCancel: false
            })

            return
        } else {
            add_sale_data['restaurant_id'] = app.globalData.restaurant_id
            add_sale_data['date'] = page.data.date
            add_sale_data['value'] = parseFloat(inputs.sale)
           
            if (page.data.date > page.data.today) {
                add_sale_data['confirmed'] = false
            } else if (page.data.date < page.data.today) {
                add_sale_data['confirmed'] = true
            } else {
                var hour = date.dateInArray(new Date()).hour
                
                if (hour < 22) {
                    add_sale_data['confirmed'] = false
                } else {
                    add_sale_data['confirmed'] = true
                }
            }
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
        progress: 50,
        progress_text: '检查通过，正在上传新的营业额'
    })

    var add_result = await addSale(add_sale_data)

    if (add_result.stat) {
        page.setData({
            progress: 100,
            progress_text: '上传成功'
        })

        realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' add a new sale data ', add_sale_data, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

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


function isRepeated(date) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = true

        db.collection(db_sale)
            .where({
                restaurant_id: app.globalData.restaurant_id,
                date: date
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
                    realTimeLog.error('Failed to get the sale data with the same date as the new sale date in the same restaurant from the database.', err)

                    resolve(result)
                }
            })
    })
}


function addSale(add_sale_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_sale,
                add_data: add_sale_data
            },
            success: res => {
                if (res.result._id !== undefined) {
                    result['stat'] = true
                    result['result'] = res
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to add a new sale data into the database by using dbAdd().', err)
                resolve(result)
            }
        })
    })
}
