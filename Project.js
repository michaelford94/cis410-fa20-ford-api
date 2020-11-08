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

//Test
app.get("/hi",(req,res)=>{
    res.send("hello world")
})

//QUESTION 1 -- What is the link to GET the data entity?
app.get("/Location", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT *
    FROM Location
    `)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).send()
    })
})

//QUESTION 2 -- What is the link to GET a particular record in your data entity?
app.get("/Location/:pk", (req, res)=>{
    var pk = req.params.pk
    // console.log("my PK:" , pk)

    var myQuery = 
    `SELECT *
    FROM Location
    LEFT JOIN BikeType
    ON BikeType.TypeName = Location.ProductPK
    WHERE LocationPK = ${pk}`

    db.executeQuery(myQuery)
        .then((Location)=>{
            // console.log("Movies: ", movies)

            if(Location[0]){
                res.send(Location[0])
            }else{res.status(404).send('bad request')}
        })
        .catch((err)=>{
            console.log("Error in /Location/pk", err)
            res.status(500).send()
        })
})

//QUESTION 3 -- What is the link to POST a new user?

app.post("/contacts", async (req,res)=>{
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

    var emailCheckQuery = `SELECT email
    FROM contact
    WHERE email = '${email}'`

    var existingUser = await db.executeQuery(emailCheckQuery)

    //This prevents users from registering with a duplicate email
    if(existingUser[0]){
        return res.status(409).send('Please enter a different email.')
    }

    //Password is hashed
    var hashedPassword = bcrypt.hashSync(password)

    var insertQuery = `INSERT INTO contact(NameFirst,NameLast,Email,Password)
    VALUES('${nameFirst}','${nameLast}','${email}','${hashedPassword}')`

    //New user is written to database
    db.executeQuery(insertQuery)

        //sends a sucessfull 201 repsonse
        .then(()=>{res.status(201).send()})
        .catch((err)=>{
            console.log("error in POST /contacts",err)
            res.status(500).send()
        })
})

//QUESTION 4 -- What is the POST API to login a user? 








const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)})