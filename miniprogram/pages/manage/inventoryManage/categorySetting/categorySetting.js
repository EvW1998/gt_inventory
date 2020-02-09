/**
 * Modify the category name or delete it.
 * Also show items under this category.
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_category = 'category' // the collection of categories
const db_item = 'item' // the collection of items

const page_modify = '../categoryModify/categoryModify' // the page url of modifying the category
const page_new_item = '../itemAdd/itemAdd' // the page url of adding a new item
const page_item_setting = '../itemSetting/itemSetting' // the page url of modifying the item


Page({

    /**
     * Data for the page
     */
    data: {
        category_id: '', // the uid of the selected category
        category_selected: {}, // the selected category
        items: {}, // items under this category
        page_modify: page_modify, // the page url of modifying the category
        page_new_item: page_new_item, // the page url of adding a new item
        page_item_setting: page_item_setting, // the page url of modifying the item
        first_load: true // whether it is first time load this page
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

        // search and set the selected category
        searchCategory(this, this.data.category_id)
        // search and set items under this category
        searchItem(this, this.data.category_id)
    },

    /**
     * When the app shows the page
     */
    onShow: function() {
        if(this.data.first_load) {
            this.setData({
                first_load: false
            })
        } else {
            // update the category and item info
            searchCategory(this, this.data.category_id)
            searchItem(this, this.data.category_id)
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

                console.log('Show the category: ', res.data[0])
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to search the category', err)
                wx.hideLoading()
            }
        })
}


/**
 * Search all the items under this category.
 * Then store the data in the page data.
 * 
 * @method searchItem
 * @param{Object} page The page
 * @param{String} category_id The collection id of the selected category
 */
function searchItem(page, category_id) {
    db.collection(db_item)
        .where({
            category_id: category_id
        })
        .orderBy('item_order', 'asc')
        .get({
            success: res => {
                page.setData({
                    items: res.data
                })

                console.log('Get all items under this category: ', res.data)
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to search items', err)
                wx.hideLoading()
            }
        })
}
