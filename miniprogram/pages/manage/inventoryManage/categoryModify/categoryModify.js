/**
 * Update the selected category
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories


Page({

    /**
     * Data for the page
     */
    data: {
        category_name: '', // the name of the selected category
        category_id: '', // the id of the selected category
        name_filled: true, // whether the name input is filled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        button_enable: true, // whether the sumbit button is enabled
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
        var categories = wx.getStorageSync('categories')

        this.setData({
            category_name: categories[options.category_id],
            category_id: options.category_id
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
    formSubmit: async function(e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        var inputs = e.detail.value

        this.setData({
            progress: 0,
            progress_text: '检查名称',
            progress_enable: true
        })

        if (inputs.name !== this.data.category_name) {
            var update_category_data = {}
            var n_result = await isRepeated(inputs.name)

            if (n_result.stat) {
                if (n_result.result) {
                    this.setData({
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
                    update_category_data['name'] = inputs.name
                }

            } else {
                this.setData({
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

            this.setData({
                progress: 50,
                progress_text: '检查通过，正在上传数据'
            })

            var update_result = await updateCategory(this.data.category_id, update_category_data)

            if (update_result.stat) {
                this.setData({
                    progress: 100,
                    progress_text: '上传成功'
                })

                var categories = wx.getStorageSync('categories')
                wx.removeStorageSync('categories')

                categories[this.data.category_id] = inputs.name

                wx.setStorageSync('categories', categories)

                realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modified a category ', update_category_data, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

                pAction.navigateBackUser('修改成功', 1)
            } else {
                this.setData({
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
            this.setData({
                progress: 100,
                progress_text: '上传成功'
            })

            pAction.navigateBackUser('修改成功', 1)
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
