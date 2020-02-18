/**
 * Modify a promotion type in the cloud database
 */
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
        promotion_type: {}, // the promotion type for modifying
        name_filled: true, // whether the name input is filled
        multiple_filled: true, // whether the multiple input is filled
        button_enable: false, // whether the sumbit button is enabled
        name_warn_enable: false, // whether the warning icon for the name should be enabled
        multiple_warn_enable: false // whether the warning icon for the multiple should be enabled
    },

    /**
     * When the page is loaded, search the given type id in the database and store it in the page data.
     */
    onLoad: function (options) {
        setPromotionType(this, options.promotion_type_id)
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

        var update_promotion_type_data = {}
        var is_repeated = false
        var new_name = e.detail.value.name
        var new_multiple = parseFloat(e.detail.value.multiple)

        if (this.data.promotion_type.promotion_type_name != new_name) {
            update_promotion_type_data['promotion_type_name'] = new_name
            is_repeated = await uInput.isRepeated(db_promotion_type, update_promotion_type_data)
            console.log('Check is the new promotion type is repeated: ', is_repeated)
        }

        if (!is_repeated) {
            if (this.data.promotion_type.promotion_type_multiple != new_multiple) {
                update_promotion_type_data['promotion_type_multiple'] = new_multiple
            }

            if (Object.keys(update_promotion_type_data).length != 0) {
                wx.cloud.callFunction({
                    name: 'dbUpdate',
                    data: {
                        collection_name: db_promotion_type,
                        update_data: update_promotion_type_data,
                        uid: this.data.promotion_type._id
                    },
                    success: res => {
                        console.log('Updated promotion type: ', res)
                        pAction.navigateBackUser('修改成功', 1)
                    },
                    fail: err => {
                        console.error('Failed to modify the promotion type', err)
                    }
                })
            } else {
                console.log('No promotion type data changed')
                pAction.navigateBackUser('修改成功', 1)
            }
        } else {
            wx.hideLoading()
            wx.showModal({
                title: '错误',
                content: '新修改的促销类型的名称与已有类型重复',
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


/**
 * Search the promotion type with the given id, then store it in the page data.
 * 
 * @method setPromotionType
 * @param{Page} page The page
 * @param{String} promotion_type_id The id of the given promotion type
 */
function setPromotionType(page, promotion_type_id) {
    db.collection(db_promotion_type)
        .where({
            _id: promotion_type_id
        })
        .get({
            success: res => {
                page.setData({
                    promotion_type: res.data[0],
                    button_enable: true
                })
                console.log('Modify the promotion type: ', res.data[0])
            },
            fail: err => {
                console.err('Failed to search the promotion type in the database', err)
            }
        })
}
