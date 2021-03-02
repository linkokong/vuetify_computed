//jshint esversion:6

//expressをロードする
const express = require("express");
const app = express();


// public内ファイルを使用できるようにする
app.use(express.static("public"));


//requestがあった時のresponse処理
app.get("/",function(req,res){
  res.sendFile(__dirname+"/index.html");

});

// process.env.PORTはdynamic portとしての機能
app.listen(process.env.PORT || 3000, function(){
  console.log("The server is runnning on port 3000.");
});
