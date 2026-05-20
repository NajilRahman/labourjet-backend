const mongoose=require('mongoose')


const chatSchema=new mongoose.Schema({
    
    users:{
        type:Array
    },
    messages:{
        type:[{
            sender: { type: String },
            type: { type: String, enum: ['text','image','audio','video'], default: 'text' },
            content: { type: String }, // text or media URL
            timestamp: { type: Date, default: Date.now }
        }],
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