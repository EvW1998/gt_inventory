/**
 * Add a new category to the current restaurant
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of real time log
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const uInput = require('../../../../utils/uInput.js') // require the util of user input

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
        name_filled: false, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When load the page
     */
    onLoad: function() {
        this.setData({
            error_happened: false
        })
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

        var input_name = event.detail.value

        if (input_name.length === 0) {
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
     * Add a new category into the current restaurant.
     * 
     * @method formSubmit
     * @param e The return val from the form submit
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        addCategoryProcess(this, e.detail.value)
    },

    /**
     * When share the mini app
     */
    onShareAppMessage: function () {
        return {
            title: '国泰耗材管理',
            desc: '国泰餐厅耗材管理程序',
            path: 'pages/inventory/inventoryUpdate/inventoryUpdate'
        }
    }
})


/**
 * The process to add a new category into the current restaurant.
 * 
 * @method addCategoryProcess
 * @param{Page} page The page
 * @param{Object} inputs The user inputs about the new category
 */
async function addCategoryProcess(page, inputs) {
    var add_category = {}
    var update_restaurant = {}

    page.setData({
        progress: 0,
        progress_text: '正在检查名称是否重复', 
        progress_enable: true
    })

    var name_check = {}
    name_check['name'] = inputs.name
    name_check['restaurant_id'] = app.globalData.restaurant_id

    var name_result = await uInput.isRepeated(db_category, name_check)

    if (name_result.stat) {
        if (!name_result.result.repetition) {
            add_category['restaurant_id'] = app.globalData.restaurant_id
            add_category['name'] = inputs.name
            add_category['item_amount'] = 0
        } else {
            page.setData({
                progress: 0,
                progress_text: '未开始',
                progress_enable: false
            })

            wx.hideLoading()

            var name_content = '新增的品类名称与已有品类 ' + name_result.result.repetition_name + ' 重复，请修改后重试。'
            wx.showModal({
                title: '名称重复',
                content: name_content,
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
        progress: 25,
        progress_text: '无名称重复，正在获取餐厅数据'
    })

    var get_result = await getCategoryAmount()

    if (get_result.stat) {
        add_category['category_order'] = get_result.result
        update_restaurant['category_amount'] = get_result.result + 1
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
        progress_text: '获取成功，正在修改餐厅数据'
    })

    var update_result = await updateRestaurant(update_restaurant)

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
        progress: 75,
        progress_text: '修改成功，正在上传新的补货品类'
    })

    var add_result = await addCategory(add_category)

    if (add_result.stat) {
        page.setData({
            progress: 100,
            progress_text: '上传成功'
        })

        realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' add a new category ', add_category, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

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


/**
 * Get the existed category amount in the current restaurant.
 * 
 * @method getCategoryAmount
 * @return{Promise} The state of the function. Resolve with the category amount.
 */
function getCategoryAmount() {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = 0

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
                        result['stat'] = true
                        result['result'] = res.data[0].category_amount

                        if (app.globalData.debug) {
                            console.log('Get the amount of existed categories in the current restaurant.', res.data[0].category_amount)
                        }
                        
                        resolve(result)
                    } else {
                        realTimeLog.error('Failed to get category amount from the restaurant database.', res)

                        resolve(result)
                    }
                },
                fail: err => {
                    realTimeLog.error('Failed to get category amount from the restaurant database.', err)

                    resolve(result)
                }
            })
    })
}


/**
 * Update the current restaurant with the given data.
 * 
 * @method updateRestaurant
 * @param{Object} update_restaurant_data The update data
 * @return{Promise} The state of the function. Resolve with the update result.
 */
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


/**
 * Add the new category to the database with the given data.
 * 
 * @method addCategory
 * @param{Object} add_category_data The new category data
 * @return{Promise} The state of the function. Resolve with the add result.
 */
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
