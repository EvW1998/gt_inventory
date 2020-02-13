/**
 * The page to show all the products in the product collection.
 */
const app = getApp() // the app
const db = wx.cloud.database() // the cloud database
const db_product = 'product' // the collection of products

const product_add_page = '../productAdd/productAdd' // the page url of adding a new product


Page({

    /**
     * Data for this page
     */
    data: {
        search_state: 'searching', // the state of the searching products
        products: {}, // the products in the product collection
        product_amount: 0, // the amount of products
        product_add_page: product_add_page // the page url of adding a new product
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
    db.collection(db_product)
        .get({
            success: res => {
                var product_result = res.data
                var product_amount = product_result.length

                if (product_amount == 0) {
                    page.setData({
                        search_state: 'noData'
                    })
                } else {
                    page.setData({
                        search_state: 'found',
                        products: product_result,
                        product_amount: product_amount
                    })
                }

                console.log('Get all products info', res.data)
            },
            fail: err => {
                console.error('Failed to search sales in database', err)
            }
        })
}
