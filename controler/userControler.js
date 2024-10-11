const userModel = require("../model/users/userSchema")
const jwt =require('jsonwebtoken')
const cloudinary=require('../cloudinary')
const { response } = require("express")
const postModel = require("../model/post/postSchema")
const { json } = require("body-parser")
const chatModel = require("../model/chatSchema/chatSchema")


//user reg post
exports.userRegPost=async(req,res)=>{
const  data= req.body
const {email}=req.body
userModel.findOne({email:email})
.then(exist=>{
    if(exist==null)
    {
        userModel.create(data)
        .then(()=>{
            res.status(200).json(data)
            res.end()
        })
    }
    else{
        res.status(400).json('email already exist')
        res.end()
    }
}) 
}


// user login verify

exports.loginVerify=(req,res)=>{
    const  data= req.body
    const {email}=req.body
    userModel.findOne({email:email})
    .then(exist=>{
       if(exist?.password==data.password)
       {
        res.status(200).json({user:jwt.sign({userid:exist._id},'secret123'),_id:exist._id,userType:exist.userType,follower:exist.follower})
       }
       else{
        res.status(400).json('no data found')
       }
    }) 
}

//logined user Data
exports.logineduserData=(req,res)=>{
    const  {id}= req.body
    userModel.findOne({_id:id})
    .then(item=>{
        res.json(item)
        res.end()
    })
    .catch(err=>{
        res.status(400).json({err:true})
        res.end()
    })
   
   
}


//update Profile 
exports.updateProfile=async(req,res)=>{
    const data = req.body;
    const imgUrl = await cloudinary.uploader.upload(data.imgUrl, { folder: 'profile' });
    const result = await userModel.findOneAndUpdate(
        { email: data.email },
        {
            $set: {
                ...data,imgUrl:imgUrl.secure_url
            }
        },
        { new: true }
    );
    res.json(result);
   
   
}



//uploadPost
exports.uploadPost=async(req,res)=>{
    var data = req.body;
    const imgUrl = await cloudinary.uploader.upload(data.imgUrl, { folder: 'profile' });
    data={...data,imgUrl:imgUrl.secure_url}
    postModel.create(data)
    .then(response => {
        res.send(response);
    })
    .catch(err => {
        res.status(400).json({ err: true });
    });
}


//fetchUserPost
exports.fetchUserPost=(req,res)=>{
    const {viewerid}=req.body
    postModel.find({userid:viewerid})
    .then(response=>{
        res.json(response)
    })
    .catch(err=>{
        res.status(400).json('post not founded')
    })
}

//updatePost
exports.updatePost=async(req,res)=>{
    var data = req.body;
    postModel.findOneAndDelete({_id:data._id})
    .then(response=>{
        res.json(response) 
    })
    .catch(err=>{
        res.status(400).json('post not founded')
    })
   
  
}

//search user
exports.findUser=(req,res)=>{
    const { search } = req.body;

if (!search) {
    return res.status(400).json({ error: 'Search term is required' });
}

userModel.createIndexes()  // Ensure indexes are created first
    .then(() => {
        return userModel.find({ $text: { $search: search } });
    })
    .then(users => {
        res.json(users);
        res.end()
    })
    .catch(err => {
        res.status(500).json({ error: 'An error occurred while searching' });
        res.end()

    });

    
 
}


//finde user by id . for user view others profile
exports.findUserById=(req,res)=>{
 const {id}=req.body
 userModel.findOne({_id:id})
 .then(response=>{
    res.json(response)
    res.end()
 })
 .catch(()=>{
    res.status(404).json(response)

 })
}

//followUpdate
exports.followUpdate=(req,res)=>{
   const {userData,viewerid,reqType}=req.body
   if(reqType=='follow')
   {
    userModel.find({$or:[{_id:userData._id},{_id:viewerid}]})
    .then(response=>{
        response.map(obj=>{
            const user=obj._id==viewerid?userData._id:viewerid
            const exist= obj.follower.filter(item=>item==user)

            if(exist.length<=0)
            {
              userModel.findOneAndUpdate({email:obj.email},{$set:{follower:[...obj.follower,user]}})
              .then(result=>{
              })
            }
        })
        res.json({updated:true})
    })
   }
   else{
    userModel.find({$or:[{_id:userData._id},{_id:viewerid}]})
    .then(response=>{
        response.map(obj=>{

           const  user=obj._id==viewerid?userData._id:viewerid;
            const updatedUserData=obj.follower?.filter(item=>item!=user )

            userModel.findOneAndUpdate({_id:obj._id},{$set:{follower:updatedUserData}})
            .then(result=>{
            })
        })
        res.json({updated:true})
    })
    .catch(err=>{
        res.status(404).json({updated:false})
    })
   }
   }
   

   //homePost

   exports.homePost=(req,res)=>{
    const data=req.body
    postModel.find({userid:{$in:[...data]}}).sort({date:1})
    .then(response=>{
       
        res.status(200).json(response)
    })
    .catch(err=>{
        res.status(500).json({err:true})
    })
   }



   //likeUpdate
exports.likeUpdate=(req,res)=>{
    const {_id,viewerid,reqType}=req.body
    if(reqType=='like')
    {
    postModel.findOne({_id})
    .then(response=>{
        const exist=response.liked.filter(item=>item==viewerid)
        if(exist)
        {
            postModel.findOneAndUpdate({_id},{$push:{liked:viewerid}})
            .then(item=>{
                res.json(item).status(200)

            })
            .catch(err=>{
                res.json(err).status(400)
            })
        }
        else{
            res.json(err).status(400)
        }
    })
    .catch(err=>{
        res.json(err).status(400)
    })
    }
    else{
        postModel.findOne({_id})
        .then(response=>{

                
                const removed=response.liked.filter(item=>item!=viewerid)

                postModel.findOneAndUpdate({_id},{liked:removed})
                .then(item=>{
                    res.json(item).status(200)

                })
                .catch(err=>{
                    res.json(err).status(400)
                })
         

        })
        .catch(err=>{
            res.json(err).status(400)
        })
    }
    }
    

    //recommend
    exports.recommend=(req,res)=>{
      const  {_id}=req.body
        userModel.find({follower:{$ne:_id}}).limit(3)
        .then(response=>{
            res.json(response)
        })
        .catch(err=>{
            json.status(400).json('error')
        })
    }

    //messageRedirect

    exports.messageRedirect=(req,res)=>{
        const {user}=req.body
        chatModel.findOne({users:{$all:user}})
        .then(response=>{
            if(response)
            {
                res.json(response)
            }
            else{
                chatModel.create({
                    users:user
                })
                .then(result=>{
                    res.json(result)
                })
                .catch(err=>{
                    res.json('error to add message')
                })
            }
        })
        .catch(err=>{
            res.json('error to add message')
        })
    }


    //getMessage
    exports.getMessage=(req,res)=>{
        const {_id}=req.params
        chatModel.findOne({_id})
        .then(response=>{
            res.json(response)
        })
        .catch(err=>{
            res.status(400).json(err)

        })
    }

    exports.postMessage=(req,res)=>{
        const data=req.body
        chatModel.findOneAndUpdate({_id:data._id},{$push:{messages:{msg:data.msg,messager:data.messager,recid:data.recid}}})
        .then(response=>{
            res.json(response)
        })
        .catch(err=>{
            res.status(400).json(err)

        })
    }