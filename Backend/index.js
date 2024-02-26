const PORT=4000;
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const multer=require("multer");
const path=require("path");
const cors=require("cors");

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/GreatStack");

app.get("/",(req,res)=>{
      res.send("Express App is Running")
})

//Image storage Engine
const storage=multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
      return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload= multer({storage:storage})
app.use('/images' ,express.static('upload/images'))
app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        sucess:1,
        image_url:`http://localhost:${PORT}/images/${req.file.filename}`
    })
})

//Schema 
const Product= mongoose.model("Product" ,{
    id:{
        type:Number,
        require:true,
    },
    name:{
        type:String,
        require:true,
    },
    image:{
        type:String,
        require:true,
    },
    category:{
        type:String,
        require:true,
    },
    new_price:{
        type:Number,
        require:true,
    },
    old_price:{
        type:Number,
        require:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    avilable:{
        type:Boolean,
        default:true,
    }

})

app.post('/addproduct',async(req , res)=>{
    let products=await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array=products.slice(-1);
        let last_product =last_product_array[0];
        id=last_product.id+1;
    }
    else{
      id=1;  
    }
  const product=new Product({
   id:req.body.id,
   name:req.body.name,
   image:req.body.image,
   category:req.body.category,
   new_price:req.body.new_price,
   old_price:req.body.old_price,
})
console.log(product);
await product.save();
console.log("Saved");
res.json({
    sucess:"true",
    name:req.body.name,
})
})

app.post('/removeproduct',async(req , res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        sucess:"true",
        name:req.body.name,
    })
})

app.get('/allproducts',async(req,res)=>{
let products= await Product.find({});
console.log("All Products Fetched");
res.send(products);
})

const Users=mongoose.model('Users' ,{
    name:{
        type:String,
    
    },
    email:{
   type:String,
   unique:true,
    },
    password:{
        type:String, 
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

app.post('/signup',async(req , res)=>{
let check=await Users.findOne({email:req.body.email});
if(check){
    return res.status(400).json({success:false , errors:"existing user already"})
}
let cart={};
for(let i=0;i<300;i++){
    cart[i]=0;
}

const user=new Users({
    name:req.body.username,
    email:req.body.email,
    password:req.body.password,
    cartData:cart,
})

await user.save();

const data ={
    user:{
        id:user.id
    }
}

const token=jwt.sign(data,'secrect_ecom');
res.json({success:true,token})
})


app.post('/login',async(req , res)=>{
    let user=await Users.findOne({email:req.body.email});
    if(user){
        const passCompare=req.body.password === user.password;
        if(passCompare){
            const data={
                user:{
                    id:user.id
                }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({sucess:true.token});
        }
        else{
            res.json({sucess:false,errors:"wrong Password"});
        }
    }
    else{
        res.json({sucess:false,errors:"wrong email.id"})
    }
})


app.get('/newcollection', async(req , res)=>{
let products=await Product.find({});
let newcollection= products.slice(1).slice(-8);
res.send(newcollection);
})

app.get('/popularinwomen', async(req , res)=>{
    let products=await Product.find({category:"women"});
    let popularinwomen= products.slice(0,4);
    res.send(popularinwomen);
    })
    
const fetchUser =async(req , res,next)=>{
  const token=req.header('auth_token');
  if(!token){
    res.status(401).send({error:"Please authenticate using valid token"})
  }  
  else{
    try {
        const data=jwt.verify(token , 'secret_ecom');
        req.user=data.user;
        next();
    } catch (error) {
        res.status(401).send({error:"Please authenticate using valid token"})

    }
  }
}

    app.post('/addtocart', fetchUser,async(req , res)=>{
       let userData=await Users.findOne({_id:req.user.id});
       userData.cartData[req.body.itemId]+=1;
       await Users.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData});
       res.send("Added")
        })

        app.post('/removefromcart', fetchUser,async(req , res)=>{
            let userData=await Users.findOne({_id:req.user.id});
            if( userData.cartData[req.body.itemId] >0)
            userData.cartData[req.body.itemId]-=1;
            await Users.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData});
            res.send("Removed")
             })

app.post('/getcart',fetchUser,async(req , res)=>{
    let userData=await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})



app.listen(PORT,(error)=>{
if(!error){
console.log("Server Running on PORT"+PORT);
}
else{
    console.log("Error:"+error);
}
})