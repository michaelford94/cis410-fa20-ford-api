const bcrypt = require('bcryptjs')

var hashedPassword = bcrypt.hashSync('asdfasdf')

console.log(hashedPassword)

var hashtest = bcrypt.compareSync('asdfasdf', hashedPassword)
console.log(hashtest)
