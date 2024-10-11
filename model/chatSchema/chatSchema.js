const mongoose=require('mongoose')


const chatSchema=new mongoose.Schema({
    
    users:{
        type:Array
    },
    messages:{
        type:Array,
        default:[]
    }
    ,
    date:{
        type:Date,
        default:Date.now()
    }
    
    
    
})

const chatModel=new mongoose.model('chat',chatSchema)

module.exports=chatModel