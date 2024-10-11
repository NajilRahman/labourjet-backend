const mongoose=require('mongoose')

const postSchema=new mongoose.Schema({
    liked:{
        type:Array,
        default:[]
    },
    imgUrl:{
        type:String,
    }
    ,
    userid:{
        type:String,
    },
    description:{
        type:String,
    }
    ,
    date:{
        type:Date,
        default:Date.now()
    }
})


const postModel=new mongoose.model('post',postSchema)

module.exports = postModel