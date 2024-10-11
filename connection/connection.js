const mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:27017/labourjet')
.then(()=>{
    console.log('db connnected')
})
.catch((err)=>{
    console.log(err)
});


//mongoose.connect('mongodb+srv://najil:najil@cluster0.pyba7cl.mongodb.net/labourjet?retryWrites=true&w=majority&appName=Cluster0')
