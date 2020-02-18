/**
 * Add a new promotion event to the cloud database
 */
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const uInput = require('../../../../utils/uInput.js') // require the util of user inputs

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_promotion_event = 'promotion_event' // the collection of promotion events


Page({

    /**
     * Data for the page
     */
    data: {
        name_filled: false, // whether the name input is filled
        multiple_filled: false, // whether the multiple input is filled
        button_enable: false, // whether the sumbit button is enabled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        multiple_warn_enable: false // whether the warning icon for the multiple should be enabled
    },

    /**
     * When the page is loaded
     */
    onLoad: function () {

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

        if (new_name.length == 0) {
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

        var add_promotion_event_data = {
            promotion_event_name: e.detail.value.name
        }

        var is_repeated = await uInput.isRepeated(db_promotion_event, add_promotion_event_data)
        console.log('Check is the new promotion event is repeated: ', is_repeated)

        if (!is_repeated) {
            add_promotion_event_data['promotion_event_multiple'] = parseFloat(e.detail.value.multiple)

            wx.cloud.callFunction({
                name: 'dbAdd',
                data: {
                    collection_name: db_promotion_event,
                    add_data: add_promotion_event_data
                },
                success: res => {
                    console.log('Add a new promotion event to the database: ', add_promotion_event_data)
                    pAction.navigateBackUser('新增成功', 1)
                },
                fail: err => {
                    console.error('Failed to add a new promotion event to the database', err)
                    wx.hideLoading()
                }
            })
        } else {
            wx.hideLoading()
            wx.showModal({
                title: '错误',
                content: '新促销类型的名称与已有类型重复',
                showCancel: false
            })
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
