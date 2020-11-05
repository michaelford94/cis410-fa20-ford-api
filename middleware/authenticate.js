const jwt = require('jsonwebtoken')

const db = require('../dbConnectExec.js')
const config = require('../config.js')

const auth = async(req, res,next)=>{
    console.log(req.header('Authorization'))
    try{

        //1. decode token

        let myToken = req.header('Authorization').
        replace('Bearer ', '')
        //console.log(myToken)

        letdecodedToken = jwt.verify(myToken, config.JWT)
        console.log(decodedToken)

        let contactPK = decodedToken.pk;
        console.log(contactPK)

        //2. compare token with db token

        let Query = `  SELECT contactPK, NameFirst, NameLast, Email
        FROM Contact 
        WHERE ContactPK = ${contactPK} and Token = '${myToken}'`

        let returnUser = await db.executeQuery(query)
        // console.log(returnUser)

        //3. save user information in request
        if(returnUser[0]){
            req.contact = returnUser[0]
            next()
        }
        else{res.status(401).send('Authentication failed.')}
    }catch(myError){
        res.status(401).send("Authentication failed.")
        }
    }


module.exports = auth