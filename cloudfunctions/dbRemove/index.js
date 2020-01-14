const cloud = require('wx-server-sdk')

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * Remove the data from the given collection
 * 
 * @param{Object} event The collection name and id to remove from the db
 * @return{Object} The result of removing data from the collection
 */
exports.main = async (event, context) => {
    try {
        return db.collection(event.collection_name)
            .doc(event.uid)
            .remove()
    }
    catch (e) {
        console.log(e)
    }
}