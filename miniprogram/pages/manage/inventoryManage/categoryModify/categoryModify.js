/**
 * Update the selected category
 */
const pAction = require('../../../../utils/pageAction.js') // require the util of page actions
const delInventory = require('../../../../utils/deleteInventory.js') // require the util of deleting inventory

const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items


Page({

    /**
     * Data for the page
     */
    data: {
        category_id: '', // the id of the selected category
        category_selected: {}, // the selected category
        filled_name: true, // whether the name input is filled
        btn_state: "primary" // the state for the confirm button
    },

    /**
     * When the app loads the page
     * 
     * @param{Object} options The data passed to this page
     */
    onLoad: function (options) {
        wx.showLoading({
            title: '加载中',
            mask: true
        })

        this.setData({
            category_id: options.title
        })

        searchCategory(this, options.title)
    },

    /**
     * Check whether the real name val get filled
     * 
     * @method checkBlur_name
     * @param{Object} e The value returned from the input text
     */
    checkBlur_name: function (e) {
        if (e.detail.value != "") {
            // if the name input text get filled with something
            this.setData({
                filled_name: true,
                btn_state: "primary"
            })
        }
        else {
            // if the name input text get filled with nothing
            this.setData({
                filled_name: false,
                btn_state: "default"
            })
        }
    },

    /**
     * When the confirm button triggered, update the selected category info
     * 
     * @method formSubmit
     * @param{Object} e The return val from the form submit
     */
    formSubmit: function(e) {
        wx.showLoading({
            title: '提交中',
            mask: true
        })

        if(e.detail.value.name != this.data.category_selected.category_name) {
            var update_category_data = {} // the new user info needs to be updated
            update_category_data['category_name'] = e.detail.value.name

            updateCategory(update_category_data, this.data.category_id)

        } else {
            console.log('No category info changed')
            pAction.navigateBackUser('更改成功', 1)
        }
    },

    /**
     * Remove the selected category from the collection
     * 
     * @method removeCategory
     */
    removeCategory: function() {
        wx.showModal({
            title: '警告',
            content: '删除此品项，将会连带删除此品项下所有子品类及其补货记录！',
            showCancel: true,
            cancelText: '取消',
            confirmText: '确认删除',
            confirmColor: '#F25438',
            success: res => {
                if(res.confirm) {
                    wx.showLoading({
                        title: '删除中',
                        mask: true
                    })

                    delInventory.removeSelectedCategory(this.data.category_id)
                }
            },
        })

        
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
 * Search the category in the collection with the given id.
 * Then store the data in the page data.
 * 
 * @method searchCategory
 * @param{Object} page The page
 * @param{String} category_id The collection id of the selected category
 */
function searchCategory(page, category_id) {
    db.collection(db_category)
        .where({
            _id: category_id
        })
        .get({
            success: res => {
                page.setData({
                    category_selected: res.data[0]
                })

                console.log('Modify the category: ', res.data[0])
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to search the category', err)
                wx.hideLoading()
            }
        })
}


/**
 * Update the selected category in the collection.
 * 
 * @method updateCategory
 * @param{Object} update_category_data The data plans to update
 * @param{String} category_id The collection id of the category
 */
function updateCategory(update_category_data, category_id) {
    wx.cloud.callFunction({
        name: 'dbUpdate',
        data: {
            collection_name: db_category,
            update_data: update_category_data,
            uid: category_id
        },
        success: res => {
            console.log('Update category info success')
            pAction.navigateBackUser('更改成功', 1)
        },
        fail: err => {
            // if get a failed result
            console.error('Failed to use cloud function dbUpdate()', err)
            pAction.navigateBackUser('更改失败', 1)
        }
    })
}
