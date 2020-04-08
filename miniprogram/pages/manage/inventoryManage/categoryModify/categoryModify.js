/**
 * Modify the selected category setting
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of real time log
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const uInput = require('../../../../utils/uInput.js') // require the util of user input

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories


Page({

    /**
     * Data for the page
     */
    data: {
        error_happened: true, // whether there is error happened while loading
        category_name: '', // the name of the selected category
        category_id: '', // the id of the selected category
        name_filled: true, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        button_enable: false, // whether the sumbit button is enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the app loads the page
     * 
     * @param{Object} options The data passed to this page
     */
    onLoad: function (options) {
        try {
            var categories = wx.getStorageSync('categories')

            this.setData({
                error_happened: false,
                category_name: categories[options.category_id],
                category_id: options.category_id
            })
        } catch (err){
            realTimeLog.error('Failed to get the selected category data from the local storage.', err)

            wx.showToast({
                title: '存储错误，请重试',
                icon: 'none'
            })
        }
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
     * When the confirm button triggered, update the selected category info
     * 
     * @method formSubmit
     * @param{Object} e The return val from the form submit
     */
    formSubmit: function(e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        updateCategoryProcess(this, e.detail.value)
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
 * The process to update the category setting.
 * 
 * @method updateCategoryProcess
 * @param{Page} page The page
 * @param{Object} inputs The user inputs
 */
async function updateCategoryProcess(page, inputs) {
    page.setData({
        progress: 0,
        progress_text: '正在检查名称是否重复',
        progress_enable: true
    })

    if (inputs.name !== page.data.category_name) {
        var update_category = {}

        var name_check = {}
        name_check['name'] = inputs.name
        name_check['restaurant_id'] = app.globalData.restaurant_id

        var name_result = await uInput.isRepeated(db_category, name_check)

        if (name_result.stat) {
            if (!name_result.result.repetition) {
                update_category['name'] = inputs.name
            } else {
                page.setData({
                    progress: 0,
                    progress_text: '未开始',
                    progress_enable: false
                })

                wx.hideLoading()

                var name_content = '修改后的的品类名称与已有品类 ' + name_result.result.repetition_name + ' 重复，请修改后重试。'
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
            progress: 50,
            progress_text: '检查通过，正在上传修改后的补货品类'
        })

        var update_result = await updateCategory(page.data.category_id, update_category)

        if (update_result.stat) {
            page.setData({
                progress: 100,
                progress_text: '上传成功'
            })

            try {
                var categories = wx.getStorageSync('categories')
                categories[page.data.category_id] = inputs.name

                wx.setStorageSync('categories', categories)
            } catch (err) {
                page.setData({
                    progress: 0,
                    progress_text: '未开始',
                    progress_enable: false
                })

                wx.hideLoading()
                wx.showToast({
                    title: '存储错误，请重试',
                    icon: 'none'
                })

                return
            }

            realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modified a category ', update_category, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

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
            progress_text: '无修改内容'
        })

        pAction.navigateBackUser('补货品类设置无修改', 1, 'none')
    }
}


/**
 * Update the selected category in the collection.
 * 
 * @method updateCategory
 * @param{String} category_id The collection id of the category
 * @param{Object} update_category_data The data plans to update
 */
function updateCategory(category_id, update_category_data) {
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
                } else {
                    realTimeLog.warn('The return value of the dbUpdate() is not correct while updateing category name.', res)
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to update the category name by using dbUpdate().', err)
                resolve(result)
            }
        })
    })
}
