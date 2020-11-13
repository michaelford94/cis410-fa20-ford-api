//JAVASCRIPT BACK-END PROJECT
// Team member 1: Michael Ford
// Team member 2: Maurice Gilmore

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const db = require('./dbConnectExec.js')
const config = require('./config.js')
const auth = require('./middleware/authenticate')

//azurewebsites.net, colostate.edu
const app = express();
app.use(express.json())
app.use(cors())

//TEST
app.get("/", (req,res)=>{res.send("Hello world.")})

//QUESTION 1 -- What is the link to GET the data entity?
app.get("/Workplace", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT *
    FROM Workplace
    LEFT JOIN Industry
    ON Industry.IndustryPK = Workplace.WorkplacePK`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).send()
    })
})

//QUESTION 2 -- What is the link to GET a particular record in your data entity?
app.get("/Workplace/:pk", (req, res)=>{
    var pk = req.params.pk
    // console.log("my PK:" , pk)

    var myQuery = 
    `SELECT *
    FROM Workplace
    LEFT JOIN Industry
    ON Industry.IndustryPK = Workplace.WorkplacePK
    WHERE WorkplacePK = ${pk}`

    db.executeQuery(myQuery)
        .then((Workplace)=>{

            if(Workplace[0]){
                res.send(Workplace[0])
            }else{res.status(404).send('bad request')}
        })
        .catch((err)=>{
            console.log("Error in /Workplace/pk", err)
            res.status(500).send()
        })
})

//QUESTION 3 -- What is the link to POST a new user?
app.post("/JobSeeker", async (req,res)=>{
    // res.send("creating user")
    // console.log("request body", req.body)

    var nameFirst = req.body.nameFirst;
    var nameLast = req.body.nameLast;
    var email = req.body.email;
    var password = req.body.password;

    if(!nameFirst || !nameLast || !email || !password){
        return res.status(400).send("bad request")
    }

    nameFirst = nameFirst.replace("'","''")
    nameLast = nameLast.replace("'","''")

    //Checking for exisitng email
    var emailCheckQuery = `SELECT Email
    FROM JobSeeker
    WHERE Email = '${email}'`

    var existingUser = await db.executeQuery(emailCheckQuery)

    if(existingUser[0]){
        return res.status(409).send('Please enter a different email.')
    }

    //Hashed password
    var hashedPassword = bcrypt.hashSync(password)

    var insertQuery = `INSERT INTO JobSeeker(NameFirst,NameLast,Email,Password)
    VALUES('${nameFirst}','${nameLast}','${email}','${hashedPassword}')`

    //New user written to database
    db.executeQuery(insertQuery)
    
        //Sends sucessfull 201 response
        .then(()=>{res.status(201).send()})
        .catch((err)=>{
            console.log("error in POST /JobSeeker",err)
            res.status(500).send()
        })
})

//QUESTION 4 -- What is the POST API to login a user? 



//QUESTION 5 -- What is the POST link to logout a user?
app.post('/JobSeeker/logout', auth, (req,res)=>{
    var query = `UPDATE JobSeeker
    SET Token = NULL
    WHERE JobSeekerPK = ${req.contact.ContactPK}`

    db.executeQuery(query)
        .then(()=>{res.status(200).send()})
        .catch((error)=>{
            console.log("error in POST /JobSeeker/logout", error)
            res.status(500).send()
    })
})

//QUESTION 6 -- What is the POST link to create a transaction?




//QUESTION 7 -- What is the GET route to get all transactions (events/orders) records for a user?




const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)})