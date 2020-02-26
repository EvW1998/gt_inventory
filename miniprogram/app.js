/***
 * This is an inventory manage system for Anshan GuoTai KFC.
 */
const db_info = 'info' // the collection name of the app info


App({
    /***
     * When launch the miniapp. Initialize cloud system and globalData.
     * 
     * @method onLaunch
     */
    onLaunch: function () {
        // wechat cloud function sets up
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力')
        } else {
            wx.cloud.init({
                env: 'cloud-fx0md', // unique cloud env
                traceUser: true
            })
        }

        this.globalData = {}
        this.globalData.loginSuccess = true // whether the login process succeeds
        this.globalData.logged = false // the user's login state
        this.globalData.registered = false // the user's register state
        this.globalData.restaurant_registered = {}, // the restaurants that the user registered
        this.globalData.restaurant_id = '' // the restaurant id of the current restaurant selected
        this.globalData.restaurant_name = '' // the restaurant name of the current restaurant selected
        this.globalData.user_name = '' // the user registered name in the selected restaurant
        this.globalData.permission_level = 0 // the user permission level in the selected restaurant
        this.globalData.permission_too_low = false // whether the user's permission level is too low
        this.globalData.restaurant_info = {} // the all restaurants info
        this.globalData.check_left = false // the inventory state
        this.globalData.new_restaurant_add = false
        this.globalData.info_id = '157bd19b-1943-4998-886f-5c6bb3f0bb78' // the id of the info collection
        this.globalData.version = 'Copyright © 开发所属：国泰肯德基 王智健' // the version info of this app

        // get the App's info from database
        setInfo(this, wx.cloud.database())
    }
})


/**
 * Set the App's globalData from the cloud database.
 * 
 * @method setInfo
 * @param{App} app The application
 * @param{DB.Database} db The database
 */
function setInfo(app, db) {
    db.collection(db_info)
        .get({
            success: res => {
                var result = res.data[0]
                app.globalData.version = result.version // the version info of this app
            }
        })
}
