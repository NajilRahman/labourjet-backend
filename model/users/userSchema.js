const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    userName:{
        type:String
       },
    imgUrl:{
        type:String,
        default:'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg'
    },
    email:{
        type:String,
        unique:true

    },
    phone:{
        type:Number

    }
    , password:{
        type:String,
    }
    , documents:{
        type:String,
    }
    , jobRole:{
        type:String,
    }
    , idCard:{
        type:String,
    }
    , Education:{
        type:String,
    }
    ,
    approvel:{
        type:String
    }
    , 
    state:{
        type:String,
    },
    postal:{
        type:String,
    }
    ,
    userType:{
        type:String,
    },
    follower:{
        type:Array,
        default:[]
    },
    skills:{
        type:Array,
        default:[]
    },
    assignedWorks:{
        type:Array,
        default:[]
    },
    givenWork:{
        type:Array,
        default:[]
    }

})
userSchema.index({ userName: 'text', postal: 'text', state: 'text', job: 'text',userType:'text' });


const userModel=new mongoose.model('users',userSchema)

module.exports = userModel