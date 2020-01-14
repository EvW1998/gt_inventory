/**
 * Modify the category name or delete it.
 * Also show items under this category.
 */
const app = getApp()
const db = wx.cloud.database()
const db_category = 'category' // the collection of categories
const page_modify = '../categoryModify/categoryModify' // the page url to modify the category

Page({

    /**
     * Data for the page
     */
    data: {
        category_id: '', // the uid of the selected user
        category_selected: {},
        page_modify: page_modify,
        first_load: true
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

        searchCategory(this, this.data.category_id)
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
            searchCategory(this, this.data.category_id)
        }
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

                console.log('Show the category: ', res.data[0])
                wx.hideLoading()
            },
            fail: err => {
                console.error('Failed to search the category', err)
                wx.hideLoading()
            }
        })
}
