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
        this.globalData.logged = false // the user's login state
        this.globalData.registered = false // the user's register state
        this.globalData.permission_level = 0 // the user's default permission level
        this.globalData.permission_too_low = false // whether the user's permission level is too low

        // get the App's info from database
        setInfo(this, wx.cloud.database(), db_info)
    }
})


/**
 * Set the App's globalData from the cloud database.
 * 
 * @method setInfo
 * @param{App} app The application
 * @param{DB.Database} db The database
 * @param{String} collection The collection name of the app info
 */
function setInfo(app, db, collection) {
    db.collection(collection)
        .field({
            _id: true,
            invite_code: true,
            version: true,
            check_left: true,
            upgrade_code: true
        })
        .get({
            success: res => {
                var result = res.data[0]
                app.globalData.info_id = result._id // the id of the info collection
                app.globalData.version = result.version // the version info of this app
                app.globalData.check_left = result.check_left // the inventory state   
            }
        })
}
