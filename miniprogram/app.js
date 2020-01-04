/***
 *  This is an inventory manage system for Anshan GuoTai KFC
 */
const db_info = 'info' // the collection name of the app info


App({
    /***
     * When launch the miniapp
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
        this.globalData.logged = false // user's login state
        this.globalData.registered = false // user's register state
        this.globalData.permission_level = 0 // user's default permission level

        // get the App invition code and version info from database
        setInfo(this, wx.cloud.database(), db_info)

        this.globalData.permission_too_low = false // whether permission level is too low
    }
})


/**
 * Access to the App cloud database info collection,
 * get the App's invition code and version info, then
 * set them to the App globalData.
 * 
 * @method setInfo
 * @param{Object} app The application
 * @param{Object} db The database
 * @param{String} collection The collection name for searching
 * @return{Object} null
 */
function setInfo(app, db, collection) {
    db.collection(collection)
        .field({
            invite_code: true,
            version: true
        })
        .get({
            success: res => {
                var result = res.data[0]
                app.globalData.invite_code = result.invite_code
                app.globalData.version = result.version
            }
        })
}
