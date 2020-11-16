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

//QUESTION 2 -- What is the link to GET a particular record in your data entity?
app.get("/workplaces/:pk", (req, res)=>{
    var pk = req.params.pk
    // console.log("my PK:" , pk)

    var myQuery = `SELECT *
    FROM Workplace
    LEFT JOIN Industry
    ON Industry.IndustryPK = Workplace.IndustryFK
    WHERE workplacePk = ${pk}`

    db.executeQuery(myQuery)
        .then((workplace)=>{
            // console.log("Movies: ", movies)

            if(workplace[0]){
                res.send(workplace[0])
            }else{res.status(404).send('bad request')}
        })
        .catch((err)=>{
            console.log("Error in /movies/pk", err)
            res.status(500).send()
        })
})

//QUESTION 3 -- What is the link to POST a new user?
    app.post("/jobseeker", async (req,res)=>{
        //res.send("creating jobseeker");
        //console.log("request body", req.body)
    
        var nameFirst= req.body.nameFirst;
        var nameLast = req.body.nameLast;
        var email = req.body.email;
        var password = req.body.password;
    
        if(!nameFirst || !nameLast || !email || !password){
            return res.status(400).send("Bad Request")
        }
    
        nameFirst = nameFirst.replace("'","''")
        nameLast = nameLast.replace("'","''")
    
        var emailCheckQuery = `SELECT Email
        FROM JobSeeker
        WHERE Email = '${email}'`;
    
        var existingUser = await db.executeQuery(emailCheckQuery);
    
        //console.log("existing user", existingUser)
        if(existingUser[0]){
            return res.status(409).send("Please enter a different email")
        }
    
        var hashedPassword = bcrypt.hashSync(password)
        var insertQuery = `INSERT INTO JobSeeker(NameFirst,NameLast,Email,Password)
        VALUES('${nameFirst}','${nameLast}', '${email}','${hashedPassword}')
        `
    
        db.executeQuery(insertQuery)
            .then(()=>{res.status(201).send()})
            .catch((err)=>{
                console.log("error in POST /jobseeker",err)
                res.status(500).send()
            })
    })

//QUESTION 4 -- What is the POST API to login a user? 

app.post("/jobseeker/login", async (req,res)=>{
    //console.log(req.body)

    var email = req.body.email;
    var password = req.body.password;

    if(!email || !password){
        return res.status(400).send("Bad Request");
    }

    //1. check that user email exists in the database
    var query = `SELECT *
    FROM JobSeeker 
    WHERE Email = '${email}'`

    
    let result;

    try{
        result = await db.executeQuery(query)
    }catch(myError){
        console.log("Error in /jobseeker/login:", myError);
        return res.status(500).send();
    }

    // console.log(result);

    if(!result[0]){
        return res.status(400).send("Invalid User Credentials")
    }

    //2. check their password  

    let user = result[0];
    // console.log(user);

    if(!bcrypt.compareSync(password, user.Password)){
        console.log("Invalid Password");
        return res.status(400).send("Invalid User Credentials");
    }
    //3. generate a token
    
    let token = jwt.sign({pk: user.JobSeekerPK}, config.JWT, {expiresIn: "60 minutes"})

    //console.log(token)

    //4. Save token in db and send token and user info back to user 
    let setTokenQuery = `UPDATE JobSeeker
    SET Token = '${token}'
    WHERE JobSeekerPK = ${user.JobSeekerPK}`

    try{
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user: {
                NameFirst: user.NameFirst,
                NameLast: user.NameLast,
                Email: user.Email,
                JobSeekerPK: user.JobSeekerPK
            }
        })
    }
    catch(myError){
        console.log("error setting user token", myError);
        res.status(500).send()
    }

})

//QUESTION 5 -- What is the POST link to logout a user?
app.post("/jobseeker/logout", auth, (req,res)=>{
    var query = `UPDATE JobSeeker
    SET Token = NULL
    WHERE JobSeekerPK = ${req.jobseeker.JobSeekerPK}`

    db.executeQuery(query)
        .then(()=>{res.status(200).send()})
        .catch((error)=>{
            console.log("error in POST /jobseeker/logout", error)
            res.status(500).send()
        })
})

//QUESTION 6 -- What is the POST link to create a transaction?

app.post("/applications", auth, async (req,res)=>{

    try{
        var workplaceFK = req.body.workplaceFK;
        var about = req.body.about;
        var dateApplied = req.body.dateApplied;
    
        if(!workplaceFK || !about || !dateApplied){res.status(400).send("Bad Request")}

        about = about.replace("'","''")
    
        // console.log("Here is the jobseeker in /applications", req.jobseeker)
        // res.send("Here is your response")

        let insertQuery = `INSERT INTO Application(About, DateApplied, WorkplaceFK, JobSeekerFK)
        OUTPUT inserted.ApplicationPK, inserted.About, inserted.DateApplied, inserted.JobSeekerFK
        VALUES('${about}', '${dateApplied}', ${workplaceFK}, ${req.jobseeker.JobSeekerPK})`

        let insertedApplication = await db.executeQuery(insertQuery)
        
        
        //console.log(insertedApplication);
        
        
        res.status(201).send(insertedApplication[0])    
    }
    catch(error){
        console.log("error in POST /applications", error)
        res.status(500).send();
    } 
})


//QUESTION 7 -- What is the GET route to get all transactions (events/orders) records for a user?

app.get("/jobseeker/me", auth, (req,res)=>{
    res.send(req.jobseeker)
})


const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)})