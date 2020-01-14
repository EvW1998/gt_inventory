/**
 * Update the selected category
 */
const app = getApp()
const db = wx.cloud.database()
const db_category = 'category' // the collection of categories

Page({

    /**
     * Data for the page
     */
    data: {
        category_id: '', // the uid of the selected user
        category_selected: {},
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
            navigateUser('更改成功', 1)
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

                    wx.cloud.callFunction({
                        name: 'dbRemove',
                        data: {
                            collection_name: db_category,
                            uid: this.data.category_id
                        },
                        success: res => {
                            console.log('Remove category success')
                            navigateUser('删除成功', 2)
                        },
                        fail: err => {
                            // if get a failed result
                            console.error('Failed to use cloud function dbRemove()', err)
                            navigateUser('删除失败', 2)
                        }
                    })
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
        name: 'dbChangeUser',
        data: {
            collection_name: db_category,
            update_data: update_category_data,
            uid: category_id
        },
        success: res => {
            console.log('Update category info success')
            navigateUser('更改成功', 1)
        },
        fail: err => {
            // if get a failed result
            console.error('Failed to use cloud function dbChangeUser()', err)
            navigateUser('更改失败', 1)
        }
    })
}


/**
 * Hide Loading and navigate the user back to the previous page.
 * 
 * @method navigateUser
 * @param{String} message The message to show in the toast.
 * @param{Number} level The level navigate back to.
 */
function navigateUser(message, level) {
    wx.hideLoading()

    wx.showToast({
        title: message,
        duration: 1500,
        complete: function (res) {
            setTimeout(function () {
                wx.navigateBack({
                    delta: level
                })
            }, 1500)
        }
    })
}
