const express = require('express')
const bcrypt = require('bcryptjs')

const db = require('./dbConnectExec.js')
const app = express();
app.use(express.json())

app.get("/hi",(req,res)=>{
    res.send("hello world")
})

app.post("/contacts", async (req,res)=>{
    // res.send("creating user")
    //console.log("request body", req.body)


    var nameFirst = req.body.nameFirst;
    var namelast = req.body.namelast;
    var email = req.body.email;
    var password = req.body.password;

    if(!nameFirst || !nameLast || !email || !password){
        return res.status(400).send('bad request')
    }

    nameFirst = nameFirst.replace("'","''")
    nameLast = nameLast.replace("'","''")

    var emailCheckQuery = `SELECT email 
    FROM contact
    WHERE email='${email}'`

    var existingUser = await db.executeQuery(emailCheckQuery)

    // console.log("Existing user", existingUser)
    if(existingUser[0]){
        return res.status(409).send('PLease enter a different email.')
    }

    var hashedPassword = bcrypt.hashSync(password)
    var insertQuery = `INSERT INTO	contact(NameFirst,NameLast,Email,password)
    VALUES('${nameFirst}', '${nameLast}','${email}','${hashedPassword}')`

    db.executeQuery(insertQuery)
    .then(()=>{res.status(201).send()})
    .catch((err)=>{
        console.log("error in POST /contatcs",err)
        res.status(500).send()
    })

})

app.get("/movies", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT* FROM Movie
    LEFT JOIN Genre ON genre.GenrePK = Movie.GenreFK`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err)
        res.status(500).send()
    })
})

app.get("/movies/:pk", (req, res)=>{
    var pk = req.params.pk
    // console.log("my pk: ", pk)

    var myQuery = `SELECT* FROM Movie
    LEFT JOIN Genre ON genre.GenrePK = Movie.GenreFK
    WHERE MoviePK = ${pk}`

    db.executeQuery(myQuery)
        .then((movies)=>{
            // console.log("movies: ", movies)

            if(movies[0]){
                res.send(movies[0])

            } else{res.status(404).send('bad request')}
        })
        .catch((err)=>{
            console.log("Error in /movie/pk", err)
            res.status(500).send()
        })
})
app.listen(5000, ()=>{console.log("app is running on port 5000")})

app.get("/TransactType",(req,res)=>{
    db.executeQuery(`SELECT * 
    FROM TransactType
    WHERE Quantity = 1;`)

    .then((result)=>{
        res.status(200).send(result)
        
    })
    .catch((err)=>{console.log(err)
    res.status(500).send()
})
})