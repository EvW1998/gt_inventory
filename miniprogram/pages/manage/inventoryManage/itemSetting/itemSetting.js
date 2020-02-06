/**
 * Update the selected item or delete it
 */
const pAction = require('../../../../utils/pageAction.js')
const delInventory = require('../../../../utils/deleteInventory.js')


const app = getApp()
const db = wx.cloud.database()
const db_item = 'item' // the collection of items


Page({

    /**
     * Data for the page
     */
    data: {
        item_id: '', // the id of the selected item
        item_selected: {},
        filled_name: true,
        filled_base: true,
        filled_scale: true,
        filled_stock: true,
        filled_capacity: true,
        filled: true,  // whether the input box of the category name gets filled
        btn_state: "primary" // the state for the confirm button
    },

    /**
     * When the app loads the page
     * 
     * @param{Object} options The data passed to this page
     */
    onLoad: function(options) {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        this.setData({
            item_id: options.title
        })

        searchItem(this, options.title)
    },

    /**
     * Check whether the new item's name gets filled
     * 
     * @method checkBlur_name
     * @param e The value returned from the input text
     */
    checkBlur_name: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_name: true
            })

            if (isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_name: false,
                filled: false,
                btn_state: "default"
            })
        }
    },

    /**
     * Check whether the new item's base gets filled
     * 
     * @method checkBlur_base
     * @param e The value returned from the input text
     */
    checkBlur_base: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_base: true
            })

            if (isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_base: false,
                filled: false,
                btn_state: "default"
            })
        }
    },


    /**
     * Check whether the new item's scale gets filled
     * 
     * @method checkBlur_scale
     * @param e The value returned from the input text
     */
    checkBlur_scale: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_scale: true
            })

            if (isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_scale: false,
                filled: false,
                btn_state: "default"
            })
        }
    },


    /**
     * Check whether the new item's stock gets filled
     * 
     * @method checkBlur_stock
     * @param e The value returned from the input text
     */
    checkBlur_stock: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_stock: true
            })

            if (isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_stock: false,
                filled: false,
                btn_state: "default"
            })
        }
    },


    /**
     * Check whether the new item's stock gets filled
     * 
     * @method checkBlur_capacity
     * @param e The value returned from the input text
     */
    checkBlur_capacity: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_capacity: true
            })

            if (isAllFilled(this)) {
                this.setData({
                    filled: true,
                    btn_state: "primary"
                })
            }
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_capacity: false,
                filled: false,
                btn_state: "default"
            })
        }
    },

    /**
     * When the confirm button triggered, update the selected item info
     * 
     * @method formSubmit
     * @param{Object} e The return val from the form submit
     */
    formSubmit: function (e) {
        wx.showLoading({
            title: '提交中',
            mask: true
        })

        var new_data = e.detail.value
        var old_data = this.data.item_selected
        var update_item_data = {}
        var data_changed = false

        if (new_data.name != old_data.item_name) {
            update_item_data['item_name'] = new_data.name
            data_changed = true
        }

        var new_base = parseInt(new_data.base)
        if (new_base != old_data.base_number) {
            update_item_data['base_number'] = new_base
            data_changed = true
        }

        var new_scale = parseFloat(new_data.scale)
        if (new_scale != old_data.scale_number) {
            update_item_data['scale_number'] = new_scale
            data_changed = true
        }

        var new_stock = parseInt(new_data.stock)
        if (new_stock != old_data.stock_value) {
            update_item_data['stock_value'] = new_stock
            data_changed = true
        }

        var new_capacity = parseInt(new_data.capacity)
        if (new_capacity != old_data.max_capacity) {
            update_item_data['max_capacity'] = new_capacity
            data_changed = true
        }

        if(data_changed) {
            updateItem(update_item_data, this.data.item_id)
        } else {
            console.log('No item info changed')
            pAction.navigateBackUser('更改成功', 1)
        }
    },

    /**
     * Remove the selected category from the collection
     * 
     * @method removeCategory
     */
    removeCategory: function () {
        wx.showModal({
            title: '警告',
            content: '删除此子品项，将会连带删除此子品项的补货记录！',
            showCancel: true,
            cancelText: '取消',
            confirmText: '确认删除',
            confirmColor: '#F25438',
            success: res => {
                if (res.confirm) {
                    wx.showLoading({
                        title: '删除中',
                        mask: true
                    })

                    delInventory.removeItem(this.data.item_id)
                }
            },
        })


    },

    /***
     *  When the user wants to share this miniapp
     */
    onShareAppMessage: function () {
        return {
            title: 'GT库存',
            desc: '国泰餐厅库存管理程序',
            path: '/usersetting/usersetting'
        }
    }
})


/**
 * Search the item in the collection with the given id.
 * Then store the data in the page data.
 * 
 * @method searchItem
 * @param{Object} page The page
 * @param{String} item_id The collection id of the selected item
 */
function searchItem(page, item_id) {
    db.collection(db_item)
        .where({
            _id: item_id
        })
        .get({
            success: res => {
                page.setData({
                    item_selected: res.data[0]
                })

                console.log('Modify the item: ', res.data[0])
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to search the item', err)
                wx.hideLoading()
            }
        })
}


/**
 * Check all the input text state, if all input text get filled, return true,
 * if not, return false.
 * 
 * @method isAllFilled
 * @param{Object} page The page
 * @return{Boolean} Whether all the input text get filled
 */
function isAllFilled(page) {
    var pd = page.data

    if (pd.filled_name && pd.filled_base && pd.filled_scale && pd.filled_stock) {
        return true
    }

    return false
}


/**
 * Update the selected item in the collection.
 * 
 * @method updateItem
 * @param{Object} update_item_data The data plans to update
 * @param{String} item_id The collection id of the item
 */
function updateItem(update_item_data, item_id) {
    wx.cloud.callFunction({
        name: 'dbUpdate',
        data: {
            collection_name: db_item,
            update_data: update_item_data,
            uid: item_id
        },
        success: res => {
            console.log('Update item info success')
            pAction.navigateBackUser('更改成功', 1)
        },
        fail: err => {
            // if get a failed result
            console.error('Failed to use cloud function dbUpdate()', err)
            pAction.navigateBackUser('更改失败', 1)
        }
    })
}
