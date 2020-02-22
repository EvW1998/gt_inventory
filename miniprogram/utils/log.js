/**
 * Util functions about real time logs.
 */
var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

module.exports = {
    info() {
        if (!log) return
        log.info.apply(log, arguments)
    },
    warn() {
        if (!log) return
        log.warn.apply(log, arguments)
        console.warn('Warning!', arguments)
    },
    error() {
        if (!log) return
        log.error.apply(log, arguments)
        console.error('Error!', arguments)
    },
    setFilterMsg(msg) { // 从基础库2.7.3开始支持
        if (!log || !log.setFilterMsg) return
        if (typeof msg !== 'string') return
        log.setFilterMsg(msg)
    },
    addFilterMsg(msg) { // 从基础库2.8.1开始支持
        if (!log || !log.addFilterMsg) return
        if (typeof msg !== 'string') return
        log.addFilterMsg(msg)
    }
}
