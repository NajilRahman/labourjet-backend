const mongoose=require('mongoose')


const msgHistorySchema=new mongoose.Schema({
    
    history:{
        type:Array,
        default:[]
    },
    userid:{
        type:String,
    }

})

const msgHistoryModel=new mongoose.model('msghistory',msgHistorySchema)

module.exports=msgHistoryModel