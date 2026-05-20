const jwt=require('jsonwebtoken')
const userMiddleware=(req,res,next)=>{
  const token=  req.headers.userid
 if(token)
 {
  try {
    const payload=jwt.verify(token, process.env.JWT_SECRET || 'secret123')
    req.payload=payload.userid
    next()
  } catch(e) {
    res.status(401).json('invalid token')
  }
 }
 else{
  res.status(401).json('not authorized')
 }
}

module.exports=userMiddleware