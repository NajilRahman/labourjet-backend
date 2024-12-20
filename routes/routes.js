const express = require("express");
const  userController = require("../controler/userControler.js");
const router=express.Router()


//user reg post
router.post('/userReg',userController.userRegPost)
router.post('/employeeReg',userController.employeeRegPost)


//login Verify
router.post('/userLogin',userController.loginVerify)


//get logined userData
router.post('/user',userController.logineduserData)


//update profile

router.put('/profileupdate',userController.updateProfile)

//uploadPost
router.post('/uploadPost',userController.uploadPost)

//fetchUserPost
router.post('/fetchUserPost',userController.fetchUserPost)

//update post
router.put('/updatePost',userController.updatePost)

//findUser
router.post('/findUser',userController.findUser)


//findUserById
router.post('/findUserById',userController.findUserById)

//followUpdate
router.post('/followUpdate',userController.followUpdate)

//homePost
router.post('/homePost',userController.homePost)

//likeUpdate
router.post('/likeUpdate',userController.likeUpdate)

//user recommend
router.post('/recommend',userController.recommend)


//messageRedirect
router.post('/messageRedirect',userController.messageRedirect)

//getMessage
router.get('/getMessage/:_id',userController.getMessage)

//postMessage
router.post('/postMessage',userController.postMessage)

//messageHistory
router.post('/messageHistory',userController.messageHistory)

//postComment
router.post('/postComment',userController.postComment)

//getComment
router.post('/getComment',userController.getComment)

//sendWorkRequest
router.post('/sendWorkRequest',userController.sendWorkRequest)

//workStatusUpdate
router.post('/workStatusUpdate',userController.workStatusUpdate)

//paymentStatusUpdate
router.post('/paymentStatusUpdate',userController.paymentStatusUpdate)

//getWorksData
router.post('/getWorksData',userController.getWorksData)

//setRating
router.post('/setRating',userController.setRating)


//getallusers
router.get('/getallusers',userController.getallusers)

//delterUser
router.delete('/deleteUser/:_id',userController.deleteUser)


//changeStatus
router.post('/changeStatus',userController.changeStatus)

module.exports=router

