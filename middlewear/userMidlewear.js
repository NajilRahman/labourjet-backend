const jwt=require('jsonwebtoken')
const userMiddlewear=(req,res,next)=>{
  const token=  req.headers.userid
 if(token)
 {
  const payload=jwt.verify(token,'secret123')
  req.payload=payload.userid
  next()
 }
 else{
  res.status(404).json('not autherized')
 }
}

module.exports=userMiddlewear