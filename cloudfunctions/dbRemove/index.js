/**
 * Cloud function to remove an item from the given collection in cloud database.
 */
const cloud = require('wx-server-sdk') // require using wx-server-sdk for using database

// Initialize cloud setting
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database() // the cloud database

/**
 * Remove an item that has the given id from the given collection.
 * 
 * @method main
 * @param{Object} event An object has keys that contain the collection name and item id for removing
 * @return{Object} The result of removing data from the collection
 */
exports.main = async (event, context) => {
    try {
        return await db.collection(event.collection_name)
            .doc(event.uid)
            .remove()
    }
    catch (e) {
        console.log(e)
    }

}