const mongoose=require('mongoose')

const workSchema=new mongoose.Schema({
    chatid:{
        type:String,
    },
    workName:{
        type:String,
    },
    description:{
        type:String,
    }
    ,
    workdate:{
        type:String,
    },
    recid:{
        type:String
    },
    senderid:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now()
    },
    approved:{
        type:Boolean,
        default:false
    },
    msgType:{
        type:String,
        default:'workRequest'
    },
    status:{
        type:String,
        default:'pending'
    }
})


const workModel=new mongoose.model('work',workSchema)

module.exports = workModel
