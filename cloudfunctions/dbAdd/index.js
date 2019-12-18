// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try{
    return db.collection(event.collection_name)
      .add({
        data: event.add_data
      })
  }
  catch(e) {
    console.log(e)
  }
}