const mongoose=require('mongoose');
const seedAdmin = require('../seedAdmin');
mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log('db connected')
     seedAdmin()
})
.catch((err)=>{
    console.log(err)
});


//mongoose.connect('mongodb+srv://najil:najil@cluster0.pyba7cl.mongodb.net/labourjet?retryWrites=true&w=majority&appName=Cluster0')
