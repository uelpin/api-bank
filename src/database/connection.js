const mysql = require('mysql2')

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'acessog10',
    database: 'uelbanco'
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