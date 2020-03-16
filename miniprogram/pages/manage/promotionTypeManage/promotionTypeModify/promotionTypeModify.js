/**
 * Modify a promotion type in the cloud database
 */
const realTimeLog = require('../../../../utils/log.js') // require the util of user inputs
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_promotion_type = 'promotion_type' // the collection of promotion types


Page({

    /**
     * Data for the page
     */
    data: {
        error_happened: true, // whether error happened
        promotion_type_selected: {}, // the promotion type for modifying
        name_filled: true, // whether the name input is filled
        multiple_filled: true, // whether the multiple input is filled
        button_enable: false, // whether the sumbit button is enabled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        multiple_warn_enable: false, // whether the warning icon for the multiple should be enabled
        progress: 0, // the process to add a new promotion event in percentage
        progress_text: '未开始', // the process to register a new user in text
        progress_enable: false // whether the progress bar is enabled
    },

    /**
     * When the page is loaded, search the given type id in the database and store it in the page data.
     */
    onLoad: function (options) {
        try {
            var promotion_types = wx.getStorageSync('promotion_types')
            
            this.setData({
                error_happened: false,
                promotion_type_selected: promotion_types[options.promotion_type_id]
            })
        } catch (err) {
            realTimeLog.error('Failed to get the selected promotion type data from the local storage.', err)

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
        var button_enable = false
        var name_warn_enable = false
        var new_name = event.detail.value

        if (new_name.length === 0) {
            name_filled = false
            name_warn_enable = true
        }

        if (name_filled && this.data.multiple_filled) {
            button_enable = true
        }

        this.setData({
            name_filled: name_filled,
            button_enable: button_enable,
            name_warn_enable: name_warn_enable
        })
    },

    /**
     * Check the input, set the multiple_filled to be true if the input is a number,
     * otherwise enable the warning icon.
     * If both the input is filled, enable the confirm button.
     * 
     * @method multipleInput
     * @param{Object} event The event of the input
     */
    multipleInput: function (event) {
        var multiple_filled = true
        var button_enable = false
        var multiple_warn_enable = false
        var new_multiple = event.detail.value

        if (!uInput.isNumber(new_multiple)) {
            multiple_filled = false
            multiple_warn_enable = true
        } else if (parseFloat(new_multiple) <= 1) {
            multiple_filled = false
            multiple_warn_enable = true
        }

        if (multiple_filled && this.data.name_filled) {
            button_enable = true
        }

        this.setData({
            multiple_filled: multiple_filled,
            button_enable: button_enable,
            multiple_warn_enable: multiple_warn_enable
        })
    },

    /**
     * Add a new product to the cloud database, with its name and items that the product requires
     * 
     * @method formSubmit
     * @param{Object} e The submit event
     */
    formSubmit: async function (e) {
        wx.showLoading({
            title: '上传中',
            mask: true
        })

        updatePromotionTypetProcess(this, e.detail.value)
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


async function updatePromotionTypetProcess(page, inputs) {
    var update_promotion_type_data = {}

    page.setData({
        progress: 0,
        progress_text: '检查名称',
        progress_enable: true
    })

    if (inputs.name !== page.data.promotion_type_selected.name) {
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
                    content: '修改后的促销类型的名称与此餐厅已有促销类型的名称重复，请更改后重试。',
                    showCancel: false
                })

                return
            } else {
                update_promotion_type_data['name'] = inputs.name
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

    if (parseFloat(inputs.multiple) !== page.data.promotion_type_selected.multiple) {
        update_promotion_type_data['multiple'] = parseFloat(inputs.multiple)
    }

    page.setData({
        progress: 50,
        progress_text: '检查通过，正在上传修改后的在售产品'
    })

    if (Object.keys(update_promotion_type_data).length !== 0) {
        var update_result = await updatePromotionType(page.data.promotion_type_selected._id, update_promotion_type_data)

        if (update_result.stat) {
            page.setData({
                progress: 100,
                progress_text: '上传成功'
            })

            realTimeLog.info('User ', app.globalData.user_name, app.globalData.uid, ' modified a promotion type ', page.data.promotion_type_selected._id, update_promotion_type_data, ' into the restaurant ', app.globalData.restaurant_name, app.globalData.restaurant_id)

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


function isRepeated(name) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false
        result['result'] = true

        db.collection(db_promotion_type)
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
                    realTimeLog.error('Failed to get the promotion event with the same date as the promotion event in the same restaurant from the database.', err)

                    resolve(result)
                }
            })
    })
}


function updatePromotionType(promotion_type_id, update_promotion_type_data) {
    return new Promise((resolve, reject) => {
        var result = {}
        result['stat'] = false

        wx.cloud.callFunction({
            name: 'dbUpdate',
            data: {
                collection_name: db_promotion_type,
                update_data: update_promotion_type_data,
                uid: promotion_type_id
            },
            success: res => {
                if (res.result.stats.updated === 1) {
                    result['stat'] = true
                    result['result'] = res
                } else {
                    realTimeLog.warn('The return value of the dbUpdate() is not correct while updateing the promotion type.', res)
                }

                resolve(result)
            },
            fail: err => {
                realTimeLog.error('Failed to update the promotion type by using dbUpdate().', err)
                resolve(result)
            }
        })
    })
}
