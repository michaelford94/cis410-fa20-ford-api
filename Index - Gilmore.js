const express = require("express");
const db = require("./dbConnect.js")

const app = express();


app.get("/hi",(req,res)=>{
    res.send("hello world")
})


app.get("/workplaces", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT *
    FROM Workplace
    LEFT JOIN Industry
    ON Industry.IndustryPK = Workplace.IndustryFK`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).send()
    })
})

app.listen(5000,()=>{console.log("app is running on port 5000")});