const mongoose=require('mongoose')

const commentSchema=new mongoose.Schema({
    comment:{
        type:String,
    },
    commenterid:{
        type:String,
    }
    ,
    postid:{
        type:String,
    },
    date:{
        type:Date,
        default:Date.now()
    }
})


const commentModel=new mongoose.model('comment',commentSchema)

module.exports = commentModel