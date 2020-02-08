/**
 * Util functions about page actions.
 */


/**
 * Tap the tab title to switch pages.
 * 
 * @method switchNav
 * @param{Page} page The page
 * @param{Object} e The data from the page tapping
 */
function switchNav(page, e) {
    var id = parseInt(e.target.id) // the new page id

    if (page.data.currentTab == id) {
        return false
    } else {
        page.setData({
            currentTab: id
        })
    }

    page.setData({
        flag: id
    })
}


/**
 * Swipe the page to switch pages.
 * 
 * @method swiperChanged
 * @param{Page} page The page
 * @param{Object} e The data from the page swiping
 */
function swiperChanged(page, e) {
    console.log('Switch navigation to: ', e.detail.current)
    if (page.data.currentTab != e.detail.current) {
        page.setData({
            currentTab: e.detail.current,
            flag: e.detail.current
        })
    }
}


/**
 * Hide Loading and navigate the user back to the previous page with a message.
 * 
 * @method navigateBackUser
 * @param{String} message The message to show in the toast.
 * @param{Number} level The level navigate back to.
 */
function navigateBackUser(message, level) {
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


module.exports = {
    switchNav: switchNav,
    swiperChanged: swiperChanged,
    navigateBackUser: navigateBackUser
}
