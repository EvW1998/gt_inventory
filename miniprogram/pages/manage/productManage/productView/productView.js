/**
 * The page to show all the products in the product collection.
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_product = 'product' // the collection of products

const product_add_page = '../productAdd/productAdd' // the page url of adding a new product
const product_modify_page = '../productModify/productModify' // the page url of modifying a product


Page({

    /**
     * Data for this page
     */
    data: {
        search_state: 'searching', // the state of the searching products
        products: {}, // the products in the product collection
        product_amount: 0, // the amount of products
        selected_product: '', // the selected product for removing
        show_remove: false, // whether to show the dialog to remove a product
        product_add_page: product_add_page, // the page url of adding a new product
        product_modify_page: product_modify_page // the page url of modifying a product
    },

    /**
     * When load the page
     */
    onLoad: function () {

    },

    /**
     * When show the page, get all products info
     */
    onShow: function () {
        setAllProductInfo(this)
    },

    /**
     * Open the half screen dialog of removing product.
     * 
     * @method openRemoveDialog
     * @param{Object} e The longpress event
     */
    openRemoveDialog: function (e) {
        var product_id = e.currentTarget.id
        console.log('Open the half screen dialog of removing')
        console.log('Selected product: ', product_id)

        var product = ''

        for (var i in this.data.products) {
            if (this.data.products[i]._id == product_id) {
                product = this.data.products[i]
                break
            }
        }

        this.setData({
            selected_product: product,
            show_remove: true
        })
    },

    /**
     * Close the half screen of removing product.
     * 
     * @method closeRemoveDialog
     */
    closeRemoveDialog: function() {
        console.log('Close the half screen dialog of removing')
        this.setData({
            show_remove: false
        })
    },

    /**
     * Remove the selected product from the database.
     * 
     * @method removeProduct
     */
    removeProduct: function() {
        wx.showLoading({
            title: '删除中',
            mask: true
        })

        var product = this.data.selected_product
        console.log('Try to remove the selected product: ', product)

        wx.cloud.callFunction({
            name: 'dbRemove',
            data: {
                collection_name: db_product,
                uid: product._id
            },
            success: res => {
                console.log('Remove product success: ', res)

                this.setData({
                    show_remove: false
                })

                this.onShow()

                wx.hideLoading()
                wx.showToast({
                    title: '删除成功'
                })
            },
            fail: err => {
                console.error('Failed to remove product: ', err)

                this.onShow()

                wx.hideLoading()
                wx.showToast({
                    title: '删除失败',
                    icon: 'none'
                })
            }
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
 * Set all the product info into the page data.
 * 
 * @method setAllProductInfo
 * @param{Page} page The page
 */
function setAllProductInfo(page) {
    wx.cloud.callFunction({
        name: 'dbGet',
        data: {
            collection_name: db_product,
            collection_limit: 100,
            collection_field: {},
            collection_where: {},
            collection_orderby_key: 'product_name',
            collection_orderby_order: 'asc'
        },
        success: res => {
            var product_result = res.result
            var product_amount = product_result.length

            if (product_amount == 0) {
                page.setData({
                    search_state: 'noData'
                })
            } else {
                var products = []
                var order = 1
                for (var i in product_result) {
                    var new_product = product_result[i]
                    var new_order = order.toString()

                    if (product_amount > 9 && order < 10) {
                        new_order = '0' + new_order
                    }

                    if (product_amount > 99 && order < 100) {
                        new_order = '0' + new_order
                    }

                    new_product['product_order'] = new_order
                    products.push(new_product)

                    order++
                }

                page.setData({
                    search_state: 'found',
                    products: products,
                    product_amount: product_amount
                })
            }

            console.log('Get all products info', res.result)
        },
        fail: err => {
            console.error('Failed to search sales in database', err)
        }
    })
}
