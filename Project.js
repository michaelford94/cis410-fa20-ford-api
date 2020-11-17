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
    
        var nameFirst= req.body.nameFirst;
        var nameLast = req.body.nameLast;
        var email = req.body.email;
        var password = req.body.password;
    
        //Validation to make sure all fields are provided below
        if(!nameFirst || !nameLast || !email || !password){
            return res.status(400).send("Bad Request")
        }
    
        nameFirst = nameFirst.replace("'","''")
        nameLast = nameLast.replace("'","''")
    
        var emailCheckQuery = `SELECT Email
        FROM JobSeeker
        WHERE Email = '${email}'`;
    
        var existingUser = await db.executeQuery(emailCheckQuery);
    
        //Validation in place to prevent duplicate email below
        if(existingUser[0]){
            return res.status(409).send("Please enter a different email")
        }
    
        //Passwords hashed below
        var hashedPassword = bcrypt.hashSync(password)
        var insertQuery = `INSERT INTO JobSeeker(NameFirst,NameLast,Email,Password)
        VALUES('${nameFirst}','${nameLast}', '${email}','${hashedPassword}')
        `
        //New user written to database below
        //Sends successfull 201 repsonse below
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

    //Check that user email exists in the database
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

    if(!result[0]){
        return res.status(400).send("Invalid User Credentials")
    }

    //check their password  

    let user = result[0];

    if(!bcrypt.compareSync(password, user.Password)){
        console.log("Invalid Password");
        return res.status(400).send("Invalid User Credentials");
    }
    //Token is generated and has an expiration of 60 minutes below
    let token = jwt.sign({pk: user.JobSeekerPK}, config.JWT, {expiresIn: "60 minutes"})

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
        console.log("Error credentials are invalid", myError);
        res.status(500).send()
    }

})

//QUESTION 5 -- What is the POST link to logout a user?
//Route protected by auth middleware below
//Token set to NULL in database below
app.post("/jobseeker/logout", auth, (req,res)=>{
    var query = `UPDATE JobSeeker
    SET Token = NULL
    WHERE JobSeekerPK = ${req.jobseeker.JobSeekerPK}`

    db.executeQuery(query)
        .then(()=>{res.status(200).send()})
        .catch((error)=>{
            console.log("Error in POST /jobseeker/logout", error)
            res.status(500).send()
        })
})

//QUESTION 6 -- What is the POST link to create a transaction?
//Route protected by auth middleware below
app.post("/applications", auth, async (req,res)=>{

    try{
        var workplaceFK = req.body.workplaceFK;
        var about = req.body.about;
        var dateApplied = req.body.dateApplied;
    
        //Route uses validation to make sure all fields are required below
        if(!workplaceFK || !about || !dateApplied){res.status(400).send("Bad Request")}

        about = about.replace("'","''")

        let insertQuery = `INSERT INTO Application(About, DateApplied, WorkplaceFK, JobSeekerFK)
        OUTPUT inserted.ApplicationPK, inserted.About, inserted.DateApplied, inserted.JobSeekerFK
        VALUES('${about}', '${dateApplied}', ${workplaceFK}, ${req.jobseeker.JobSeekerPK})`

        //Record is sucessfully written below
        let insertedApplication = await db.executeQuery(insertQuery)
        
        //Sucessfull repsonse includes transaction record below
        res.status(201).send(insertedApplication[0])    
    }
    catch(error){
        console.log("Error in POST /applications", error)
        res.status(500).send();
    } 
})

//QUESTION 7 -- What is the GET route to get all transactions (events/orders) records for a user?
//Route protected by auth middleware below
app.get("/application/me", auth, async(req,res)=>{
    let JobSeekerPK = req.jobseeker.JobSeekerPK;

    //Route returns all records asociated below
    //Response includes JOIN data below
    var meQuery = `SELECT *
    FROM Application
    LEFT JOIN JobSeeker
    ON JobSeeker.JobSeekerPK = Application.JobSeekerFK
    WHERE JobSeekerPK = ${JobSeekerPK}`
    
    db.executeQuery(meQuery)
    .then((result)=>{res.status(200).send(result)})
        .catch((error)=>{
            console.log("error in POST /jobseeker/logout", error)
            res.status(500).send()
        })

<<<<<<< HEAD
=======
app.get("/application/me", auth, async(req,res)=>{
    let JobSeekerPK = req.jobseeker.JobSeekerPK;

    var meQuery = `SELECT *
    FROM Application
    LEFT JOIN JobSeeker
    ON JobSeeker.JobSeekerPK = Application.JobSeekerFK
    WHERE JobSeekerPK = ${JobSeekerPK}`
    
    db.executeQuery(meQuery)
    .then((result)=>{res.status(200).send(result)})
        .catch((error)=>{
            console.log("error in POST /jobseeker/logout", error)
            res.status(500).send()
        })


>>>>>>> c1ca86861fb05a97efa983f9515cda445d56b400
})

const PORT = process.env.PORT || 5000
<<<<<<< HEAD
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)});
=======
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)});
>>>>>>> c1ca86861fb05a97efa983f9515cda445d56b400
