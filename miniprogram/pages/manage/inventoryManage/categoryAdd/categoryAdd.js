/**
 * The page to add new category to database
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories
const db_restaurant = 'restaurant' // the collection of restaurants


Page({

    /**
     * Data in the page
     */
    data: {
        error_happened: true, // whether there is error happened while loading
        existed_category_amount: 0, // The amount of the existed cateogies in the collection
        name_filled: false, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page gets loaded, get the amount of existing categories.
     */
    onLoad: function() {
        wx.showLoading({
            title: '加载中'
        })

        // set the amount of categories to the page data
        setCategoryAmount(this)
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
            name_filled: name_filled,
            name_warn_enable: name_warn_enable,
            button_enable: button_enable
        })
    },

    /**
     * When the confirm button tapped
     * 
     * @method formSubmit
     * @param e The return val from the form submit
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        addCategoryProcess(this, this.data.existed_category_amount, e.detail.value.name)
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
 * Set the amount of categoies in the db to the page data.
 * 
 * @method setCategoryAmount
 * @param page The page
 */
function setCategoryAmount(page) {
    db.collection(db_restaurant)
        .where({
            _id: app.globalData.restaurant_id
        })
        .field({
            category_amount: true
        })
        .get({
            success: res => {
                if (res.data.length === 1) {
                    page.setData({
                        error_happened: false,
                        existed_category_amount: res.data[0].category_amount
                    })

                    console.log('Get the amount of existed categories in the current restaurant.', res.data[0].category_amount)
                    wx.hideLoading()

                } else {
                    realTimeLog.error('Failed to get category amount from the restaurant database.', res)

                    wx.hideLoading()
                    wx.showToast({
                        title: '网络错误，请重试',
                        icon: 'none'
                    })
                }
            },
            fail: err => {
                realTimeLog.error('Failed to get category amount from the restaurant database.', err)

                wx.hideLoading()
                wx.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                })
            }
        })
}


async function addCategoryProcess(page, category_order, category_name) {
    var add_category_data = {}
    var update_restaurant_data = {}

    page.setData({
        progress: 0,
        progress_text: '检查名称',
        progress_enable: true
    })

    var n_result = await isRepeated(category_name)

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
                content: '输入的品类名称与此餐厅已有品类重复，请更改后重试。',
                showCancel: false
            })

            return
        } else {
            add_category_data['restaurant_id'] = app.globalData.restaurant_id
            add_category_data['name'] = category_name
            add_category_data['category_order'] = category_order
            add_category_data['item_amount'] = 0
            
            update_restaurant_data['category_amount'] = category_order + 1
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
        progress_text: '检查通过，正在上传餐厅数据'
    })

    var update_result = await updateRestaurant(update_restaurant_data)

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
        progress_text: '正在上传新的补货品类'
    })

    var add_result = await addCategory(add_category_data)

    if (add_result.stat) {
        page.setData({
            progress: 100,
            progress_text: '上传成功'
        })

        realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' add a new category ', add_category_data, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

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


function isRepeated(category_name) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = true

        db.collection(db_category)
            .where({
                restaurant_id: app.globalData.restaurant_id,
                name: category_name
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
                    realTimeLog.error('Failed to get the cateogry with the same name as the new category in the same restaurant from the database.', err)

                    resolve(result)
                }
            })
    })
}


function updateRestaurant(update_restaurant_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_restaurant,
                update_data: update_restaurant_data,
                uid: app.globalData.restaurant_id
            },
            success: res => {
                if (res.result.stats.updated === 1) {
                    result['stat'] = true
                    result['result'] = res
                }
                
                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to update the restaurant category amount by using dbUpdate().', err)
                resolve(result)
            }
        })
    })
}


function addCategory(add_category_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbAdd',
            data: {
                collection_name: db_category,
                add_data: add_category_data
            },
            success: res => {
                if (res.result._id !== undefined) {
                    result['stat'] = true
                    result['result'] = res
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to add a new category into the database by using dbAdd().', err)
                resolve(result)
            }
        })
    })
}
