const userModel = require("../model/users/userSchema")
const jwt = require('jsonwebtoken')
const cloudinary = require('../cloudinary').default
const { response, request } = require("express")
const postModel = require("../model/post/postSchema")
const { json } = require("body-parser")
const chatModel = require("../model/chatSchema/chatSchema")
const messageHistory = require('../model/messageHistory/messageHistory')
const commentModel = require("../model/postComment/postComment")
const workModel = require("../model/work/workSchema")
const bcrypt = require('bcryptjs')

// user reg post
exports.userRegPost = async (req, res) => {
    const data = req.body
    const { email, password } = req.body
    userModel.findOne({ email: email })
        .then(async (exist) => {
            if (exist == null) {
                try {
                    const hashedPassword = await bcrypt.hash(password, 10)
                    const userData = { ...data, password: hashedPassword }
                    userModel.create(userData)
                        .then((createdUser) => {
                            res.status(200).json(createdUser)
                        })
                        .catch((err) => {
                            res.status(500).json('Error creating user profile')
                        })
                } catch (err) {
                    res.status(500).json('Error securing password')
                }
            } else {
                res.status(400).json('email already exist')
            }
        })
}

// employee reg post
exports.employeeRegPost = async (req, res) => {
    let data = req.body

    if (data.documents) {
        try {
            const firstres = await cloudinary.uploader.upload(data.documents, { folder: 'profile' })
            data.documents = firstres.secure_url
        } catch (e) {
            console.error('Error uploading documents:', e)
        }
    }

    if (data.idCard) {
        try {
            const secres = await cloudinary.uploader.upload(data.idCard, { folder: 'profile' })
            data.idCard = secres.secure_url
        } catch (e) {
            console.error('Error uploading ID Card:', e)
        }
    }

    const { email, password } = req.body
    userModel.findOne({ email: email })
        .then(async (exist) => {
            if (exist == null) {
                try {
                    const hashedPassword = await bcrypt.hash(password, 10)
                    data.password = hashedPassword
                    userModel.create(data)
                        .then((result) => {
                            console.log(result)
                            res.status(200).json(result)
                        })
                        .catch((err) => {
                            res.status(500).json('Error creating employee profile')
                        })
                } catch (err) {
                    res.status(500).json('Error securing password')
                }
            } else {
                res.status(400).json('email already exist')
            }
        })
}

// user login verify
exports.loginVerify = (req, res) => {
    const data = req.body
    const { email, password } = req.body
    userModel.findOne({ email: email })
        .then(async (exist) => {
            if (!exist) {
                return res.status(300).json('user not found . please register')
            }

            // Secure password comparison: compares hashed, falls back to plain-text for legacy users
            const isMatch = await bcrypt.compare(password, exist.password).catch(() => false) || (password === exist.password)

            if (exist.userType == 'user') {
                if (isMatch) {
                    res.status(200).json({ user: jwt.sign({ userid: exist._id }, process.env.JWT_SECRET || 'secret123'), _id: exist._id, userType: exist.userType, follower: exist.follower })
                } else {
                    res.status(300).json('Wrong Password')
                }
            } else if (exist.userType == 'employee') {
                if (exist.approvel == 'accepted') {
                    console.log(exist.approvel)
                    if (isMatch) {
                        res.status(200).json({ user: jwt.sign({ userid: exist._id }, process.env.JWT_SECRET || 'secret123'), _id: exist._id, userType: exist.userType, follower: exist.follower })
                    } else {
                        res.status(300).json('Wrong Password')
                    }
                } else {
                    console.log(exist.approvel)
                    res.status(300).json('Your Employee Request in Pending')
                }
            } else if (exist.userType == 'admin') {
                if (isMatch) {
                    res.status(200).json({ user: jwt.sign({ userid: exist._id }, process.env.JWT_SECRET || 'secret123'), _id: exist._id, userType: exist.userType })
                } else {
                    res.status(300).json('Wrong Password')
                }
            }
        })
        .catch((err) => {
            res.status(300).json('user not found . please register')
        })
}

// logined user Data
exports.logineduserData = (req, res) => {
    const { id } = req.body
    userModel.findOne({ _id: id })
        .then((item) => {
            res.json(item)
        })
        .catch((err) => {
            res.status(400).json({ err: true })
        })
}

// update Profile 
exports.updateProfile = async (req, res) => {
    const data = req.body;
    let updateFields = { ...data };

    if (data.imgUrl && data.imgUrl.startsWith('data:')) {
        try {
            const imgUrl = await cloudinary.uploader.upload(data.imgUrl, { folder: 'profile' });
            updateFields.imgUrl = imgUrl.secure_url;
        } catch (e) {
            console.error('Error uploading image to Cloudinary:', e);
        }
    }

    const result = await userModel.findOneAndUpdate(
        { email: data.email },
        {
            $set: updateFields
        },
        { new: true }
    );
    res.json(result);
}

// uploadPost
exports.uploadPost = async (req, res) => {
    let data = req.body;
    if (data.imgUrl && data.imgUrl.startsWith('data:')) {
        try {
            const imgUrl = await cloudinary.uploader.upload(data.imgUrl, { folder: 'profile' });
            data.imgUrl = imgUrl.secure_url
        } catch (e) {
            console.error('Error uploading post image:', e);
        }
    }

    postModel.create(data)
        .then((response) => {
            res.send(response);
        })
        .catch((err) => {
            res.status(400).json({ err: true });
        });
}

// fetchUserPost
exports.fetchUserPost = (req, res) => {
    const { viewerid } = req.body
    postModel.find({ userid: viewerid })
        .then((response) => {
            res.json(response)
        })
        .catch((err) => {
            res.status(400).json('post not founded')
        })
}

// updatePost (Actually deletes the post in the original codebase)
exports.updatePost = async (req, res) => {
    const data = req.body;
    postModel.findOneAndDelete({ _id: data._id })
        .then((response) => {
            res.json(response)
        })
        .catch((err) => {
            res.status(400).json('post not founded')
        })
}

// editPost (Edits the post description)
exports.editPost = async (req, res) => {
    const { _id, description } = req.body;
    postModel.findOneAndUpdate({ _id }, { $set: { description } }, { new: true })
        .then((response) => {
            res.status(200).json(response)
        })
        .catch((err) => {
            res.status(400).json('post update failed')
        })
}

// search user (createIndexes is removed because index is initialized on Schema definition)
exports.findUser = (req, res) => {
    const { search } = req.body;
    userModel.find({ $text: { $search: search } })
        .then((users) => {
            res.json(users);
        })
        .catch((err) => {
            res.status(500).json({ error: 'An error occurred while searching' });
        });
}

// find user by id
exports.findUserById = (req, res) => {
    const { id } = req.body
    userModel.findOne({ _id: id })
        .then((response) => {
            res.json(response)
        })
        .catch((err) => {
            res.status(404).json(err)
        })
}

// followUpdate
exports.followUpdate = (req, res) => {
    const { userData, viewerid, reqType } = req.body
    if (reqType == 'follow') {
        userModel.find({ $or: [{ _id: userData._id }, { _id: viewerid }] })
            .then((response) => {
                const promises = response.map((obj) => {
                    const user = obj._id == viewerid ? userData._id : viewerid
                    const exist = obj.follower.filter((item) => item == user)

                    if (exist.length <= 0) {
                        return userModel.findOneAndUpdate({ email: obj.email }, { $push: { follower: user } })
                    }
                    return Promise.resolve();
                })
                Promise.all(promises).then(() => {
                    res.json({ updated: true })
                })
            })
            .catch((err) => {
                res.status(404).json({ updated: false })
            })
    } else {
        userModel.find({ $or: [{ _id: userData._id }, { _id: viewerid }] })
            .then((response) => {
                const promises = response.map((obj) => {
                    const user = obj._id == viewerid ? userData._id : viewerid;
                    const updatedUserData = obj.follower?.filter((item) => item != user)
                    return userModel.findOneAndUpdate({ _id: obj._id }, { $set: { follower: updatedUserData } })
                })
                Promise.all(promises).then(() => {
                    res.json({ updated: true })
                })
            })
            .catch((err) => {
                res.status(404).json({ updated: false })
            })
    }
}

// homePost
exports.homePost = (req, res) => {
    const data = req.body
    postModel.find({ userid: { $in: [...data] } }).sort({ date: 1 })
        .then((response) => {
            res.status(200).json(response)
        })
        .catch((err) => {
            res.status(500).json({ err: true })
        })
}

// likeUpdate
exports.likeUpdate = (req, res) => {
    const { _id, viewerid, reqType } = req.body
    if (reqType == 'like') {
        postModel.findOneAndUpdate({ _id }, { $addToSet: { liked: viewerid } }, { new: true })
            .then((item) => {
                res.status(200).json(item)
            })
            .catch((err) => {
                res.status(400).json(err)
            })
    } else {
        postModel.findOneAndUpdate({ _id }, { $pull: { liked: viewerid } }, { new: true })
            .then((item) => {
                res.status(200).json(item)
            })
            .catch((err) => {
                res.status(400).json(err)
            })
    }
}

// recommend
exports.recommend = (req, res) => {
    const { _id } = req.body
    userModel.find({ follower: { $ne: _id } }).limit(3)
        .then((response) => {
            res.json(response)
        })
        .catch((err) => {
            res.status(400).json('error')
        })
}

// messageRedirect
exports.messageRedirect = (req, res) => {
    const { user } = req.body
    chatModel.findOne({ users: { $all: user } })
        .then((response) => {
            if (response) {
                res.json(response)
            } else {
                chatModel.create({
                    users: user
                })
                    .then((result) => {
                        res.json(result)
                    })
                    .catch((err) => {
                        res.status(500).json('error to add message')
                    })
            }
        })
        .catch((err) => {
            res.status(500).json('error to add message')
        })
}

// getMessage
exports.getMessage = (req, res) => {
    const { _id } = req.params
    chatModel.findOne({ _id })
        .then((response) => {
            res.json(response)
        })
        .catch((err) => {
            res.status(400).json(err)
        })
}

// postMessage
exports.postMessage = (req, res) => {
    const data = req.body
    chatModel.findOneAndUpdate(
        { _id: data._id },
        {
            $push: {
                messages: {
                    msg: data.msg,
                    messager: data.messager,
                    recid: data.recid,
                    msgType: data.msgType,
                    status: data.status ? data.status : '',
                    upiid: data.upiid ? data.upiid : '',
                    amount: data.amount ? data.amount : '',
                    date: new Date()
                }
            }
        },
        { new: true }
    )
        .then((response) => {
            res.json(response)
            console.log(response)
        })
        .catch((err) => {
            res.status(400).json(err)
        })
}

// messageHistory
exports.messageHistory = (req, res) => {
    const { id } = req.body
    chatModel.find({ users: { $in: [id] } })
        .then((response) => {
            const user = response.reduce((prev, next) => {
                prev = [...prev, next.users[0] == id ? next.users[1] : next.users[0]]
                return prev
            }, [])

            userModel.find({ _id: { $in: user } })
                .then((result) => {
                    res.json(result)
                })
                .catch((err) => {
                    res.status(400).json(err)
                })
        })
        .catch((err) => {
            res.status(400).json(err)
        })
}

// postComment
exports.postComment = (req, res) => {
    const data = req.body
    commentModel.create({
        postid: data._id,
        comment: data.comment,
        commenterid: data.commenterid
    })
        .then((response) => {
            res.json(response)
        })
}

// getComment
exports.getComment = (req, res) => {
    const { _id } = req.body
    commentModel.find({ postid: _id }).sort({ date: 1 })
        .then((response) => {
            res.json(response)
            console.log(response)
        })
}

// sendWorkRequest
exports.sendWorkRequest = (req, res) => {
    const data = req.body
    workModel.create({
        chatid: data._id,
        senderid: data.viewerid,
        msgType: 'workRequest',
        workName: data.workName,
        description: data.description,
        workdate: data.date,
        recid: data.recid,
        status: 'pending'
    })
        .then((response) => {
            chatModel.findOneAndUpdate(
                { _id: data._id },
                {
                    $push: {
                        messages: {
                            workid: response._id,
                            senderid: data.viewerid,
                            msgType: 'workRequest',
                            workName: data.workName,
                            description: data.description,
                            workdate: data.date,
                            recid: data.recid,
                            status: 'pending',
                            date: new Date()
                        }
                    }
                },
                { new: true }
            )
                .then((result) => {
                    res.json(result)
                    console.log(result)
                })
                .catch((err) => {
                    res.status(400).json(err)
                })
        })
        .catch((err) => {
            res.status(400).json(err)
        })
}

// workStatusUpdate
exports.workStatusUpdate = (req, res) => {
    const { status, chatid, workid } = req.body
    chatModel.findOne({ _id: chatid })
        .then((response) => {
            if (!response) return;
            const datain = response.messages.filter((item) => item.workid == workid)
            const datanot = response.messages.filter((item) => item.workid != workid)
            if (datain.length > 0) {
                const updated = { ...datain[0]._doc, status: status }
                const updatedMessages = [...datanot, updated]
                chatModel.findOneAndUpdate({ _id: chatid }, { $set: { messages: updatedMessages } }).then((chat) => {
                    console.log('chat updated:', chat != null)
                })
            }
        })
    workModel.findOneAndUpdate({ _id: workid }, { $set: { status: status } }, { new: true })
        .then((workresult) => {
            res.status(200).json(workresult)
        })
        .catch((err) => {
            res.status(400).json(err)
        })
}

// paymentStatusUpdate
exports.paymentStatusUpdate = (req, res) => {
    const { status, chatid, messageid } = req.body
    chatModel.findOne({ _id: chatid })
        .then((response) => {
            if (!response) return res.status(404).json('Chat not found');
            const updatedMessages = response.messages.map((item) => {
                if (item._id == messageid) {
                    item.status = status
                }
                return item
            })
            chatModel.findOneAndUpdate({ _id: chatid }, { $set: { messages: updatedMessages } }, { new: true })
                .then((chat) => {
                    res.status(200).json(chat)
                })
                .catch((err) => {
                    res.status(400).json(err)
                })
        })
        .catch((err) => {
            res.status(400).json(err)
        })
}

// getWorksData
exports.getWorksData = (req, res) => {
    const { id } = req.body
    workModel.find({ $or: [{ recid: id }, { senderid: id }] })
        .then((response) => {
            res.json(response)
        })
        .catch((err) => {
            res.status(400).json(err)
        })
}

// setRating
exports.setRating = (req, res) => {
    const { _id, rating } = req.body
    workModel.findOneAndUpdate({ _id }, { $set: { rating } }, { new: true })
        .then((response) => {
            res.json(response.rating)
        })
        .catch((err) => {
            res.status(300).json('rating update failed')
        })
}

// getallusers
exports.getallusers = (req, res) => {
    userModel.find()
        .then((response) => {
            res.status(200).json(response)
        })
}

// deleteUser
exports.deleteUser = (req, res) => {
    const { _id } = req.params
    userModel.findOneAndDelete({ _id })
        .then((response) => {
            console.log(response)
            res.status(200).json(response)
        })
}

// changeStatus
exports.changeStatus = (req, res) => {
    const data = req.body;
    data.approvel = data.approvel == 'accepted' ? 'rejected' : 'accepted'
    userModel.findOneAndUpdate({ _id: data._id }, data, { new: true })
        .then((updatedUser) => {
            console.log(updatedUser)
            res.status(200).json(updatedUser);
        })
        .catch((err) => {
            res.status(500).json({ message: 'Error updating user', error: err });
        });
};