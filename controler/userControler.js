const userModel = require("../model/users/userSchema")
const jwt =require('jsonwebtoken')
const cloudinary=require('../cloudinary')
const { response, request } = require("express")
const postModel = require("../model/post/postSchema")
const { json } = require("body-parser")
const chatModel = require("../model/chatSchema/chatSchema")
const messageHistory=require('../model/messageHistory/messageHistory')
const commentModel = require("../model/postComment/postComment")
const workModel = require("../model/work/workSchema")
 
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


//employee reg post
exports.employeeRegPost=async(req,res)=>{
    var  data= req.body
    data={...data,userName:data.userName}

    cloudinary.uploader.upload(data.documents, { folder: 'profile' })
    .then(firstres=>{
        data={...data,documents:firstres.secure_url}
         cloudinary.uploader.upload(data.idCard, { folder: 'profile' })
        .then(secres=>{
            data={...data,idCard:secres.secure_url}
            const {email}=req.body
            userModel.findOne({email:email})
            .then(exist=>{
                if(exist==null)
                {
                    userModel.create(data)
                    .then((result)=>{
                        console.log(result)
                        res.status(200).json(result)
                        res.end()
                    })
                }
                else{
                    res.status(400).json('email already exist')
                    res.end()
                }
            }) 
        })
        
    })
    

    

   
}

// user login verify

exports.loginVerify=(req,res)=>{
    const  data= req.body
    const {email}=req.body
    userModel.findOne({email:email})
    .then(exist=>{
       if(exist?.userType=='user')
       {
        if(exist?.password==data.password)
            {
             res.status(200).json({user:jwt.sign({userid:exist._id},'secret123'),_id:exist._id,userType:exist.userType,follower:exist.follower})
            }
            else{
             res.status(300).json('Wrong Password')
            }
       }
       else if(exist.userType=='employee')
       {
        if(exist.approvel=='accepted')
        {
            console.log(exist.approvel)
            if(exist?.password==data.password)
                {
                 res.status(200).json({user:jwt.sign({userid:exist._id},'secret123'),_id:exist._id,userType:exist.userType,follower:exist.follower})
                }
                else{
                 res.status(300).json('Wrong Password')
                }
        }
        else{
            console.log(exist.approvel)
            res.status(300).json('Your Employee Request in Penging')
        }
        
       }
    }) 
    .catch(err=>{
        res.status(300).json('user not found . please register')

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
        chatModel.findOneAndUpdate({_id:data._id},{$push:{messages:{msg:data.msg,messager:data.messager,recid:data.recid , msgType:data.msgType,status:data.status?data.status:'',upiid:data.upiid?data.upiid:'',amount:data.amount?data.amount:''}}})
        .then(response=>{
            res.json(response)
            console.log(response)
        })
        .catch(err=>{
            res.status(400).json(err)

        })
    }

    exports.messageHistory=(req,res)=>{
        const {id}=req.body
        chatModel.find({users:{$in:[id]}})
        .then(response=>{
         const user=   response.reduce((prev,next)=>{
            prev=[...prev,next.users[0]==id?next.users[1]:next.users[0]]
            return prev
            },[])

          userModel.find({_id:{$in:user}})
          .then(result=>{
            res.json(result)
          })
        })
        .catch(err=>{
            res.json(err).status(400)
        })
    }

    exports.postComment=(req,res)=>{
        const data=req.body
        commentModel.create({
            postid:data._id,
            comment:data.comment,
            commenterid:data.commenterid
        })
        .then(response=>{
            res.json(response)
        })
    }

  //getComment
  exports.getComment=(req,res)=>{
    const {_id}=req.body
   commentModel.find({postid:_id}).sort({date:1})
   .then(response=>{
    res.json(response)
    console.log(response)
   })
}


//sendWorkRequest
exports.sendWorkRequest = (req, res) => {
    const data = req.body
    workModel.create({
        
            chatid:data._id,
            senderid: data.viewerid,
            msgType: 'workRequest',
            workName: data.workName,
            description: data.description,
            workdate: data.date,
            recid: data.recid,
            status:'pending'
        
    })
    .then(response=>{
        chatModel.findOneAndUpdate({
            _id: data._id
        }, {
            $push: {
                messages: {
        
                    workid:response._id,
                    senderid: data.viewerid,
                    msgType: 'workRequest',
                    workName: data.workName,
                    description: data.description,
                    workdate: data.date,
                    recid: data.recid,
                    status:'pending'
                
            }
        }
        })
        .then(result => {
            res.json(result)
            console.log(result)

        })
        .catch(err => {
            res.status(400).json(err)

        })
    })    
}

//workStatusUpdate

exports.workStatusUpdate=(req,res)=>{
    const {status}=req.body
    const {chatid}=req.body
    const {workid}=req.body
    chatModel.findOne({_id:chatid})
    .then(response=>{
       var datain= response.messages.filter(item=>item.workid==workid)
       var datanot= response.messages.filter(item=>item.workid!=workid)
       var updated={...datain[0],status:status}
        var updatedMessages=[...datanot,updated]
        chatModel.findOneAndUpdate({_id:chatid},{$set:{messages:[...updatedMessages]}}).then(chat=>{
            console.log(chat)
        })
    })
    workModel.findOneAndUpdate({_id:workid},{$set:{status:status}}).then(workresult=>{
        console.log(workresult)
    })
}


//paymentStatusUpdate
exports.paymentStatusUpdate=(req,res)=>{
    const {status}=req.body
    const {chatid}=req.body
    chatModel.findOne({_id:chatid})
    .then(response=>{
       var datain= response.messages.filter(item=>item.workid==workid)
       var datanot= response.messages.filter(item=>item.workid!=workid)
       var updated={...datain[0],status:status}
        var updatedMessages=[...datanot,updated]
        chatModel.findOneAndUpdate({_id:chatid},{$set:{messages:[...updatedMessages]}}).then(chat=>{
            console.log(chat)
        })
    })
    
}


//getWorksData

exports.getWorksData=(req,res)=>{
    const {id}=req.body
    workModel.find({$or:[{recid:id},{senderid:id}]})
    .then(response=>{
        res.json(response)
    })
    .catch(err=>{
        res.json(err).status(400)

    })
}

//setRating

exports.setRating=(req,res)=>{
    const {_id,rating}=req.body
    workModel.findOneAndUpdate({_id},{$set:{rating}})
    .then(response=>{
        res.json(response.rating)

    })
    .catch(err=>{
        res.status(300).json('rating update failed')
    })
}