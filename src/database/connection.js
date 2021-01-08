const mysql = require('mysql2')

const connection = mysql.createConnection({
    host: 'sql10.freemysqlhosting.net',
    user: 'sql10385852',
    password: 'C84tNBCaIq',
    database: 'sql10385852'
})

connection.connect((e) => {
    if (e) {
        console.log('Erro:', e)
    }
    else {
        console.log('conectado')
    }
})

module.exports = connection