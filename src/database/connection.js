const mysql = require('mysql2/promise')

const connection = mysql.createPool({
    host: 'sql10.freemysqlhosting.net',
    user: 'sql10385852',
    password: 'C84tNBCaIq',
    database: 'sql10385852'
})

module.exports = connection