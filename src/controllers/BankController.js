const database = require('../database/connection')

async function getUsuario(usuario) {
    const sql =
        `SELECT                  ` +
        `   numero_conta         ` +
        `FROM                    ` +
        `   cliente              ` +
        `WHERE                   ` +
        `   nome = "${usuario}"; `

    return new Promise((resolve, reject) => {
        database.query(sql, (e, data) => {
            if (e) {
                reject(e)
            }
            else {
                resolve(data[0]['numero_conta'])
            }
        })
    })
}


class BankController {

    async deposito(request, response) {
        var sql, valorDeposito
        var { usuario, valor } = request.body

        if (usuario == undefined || valor == undefined) {
            response.json({ "Message": "Falta de dados" })
            return
        }
        valorDeposito = valor

        var numeroConta = await getUsuario(usuario)

        if (numeroConta == undefined) {
            response.json({ "Message": "Conta não encontrada" })
            return
        }

        sql =
            `SELECT                              ` +
            `   saldo                            ` +
            `FROM                                ` +
            `   cliente                          ` +
            `WHERE                               ` +
            `   numero_conta = "${numeroConta}"; `

        var saldoConta = await new Promise((resolve, reject) => {
            database.query(sql, (e, data) => {
                if (e) {
                    console.log('erroSQL', e)
                    reject()
                }

                console.log('saldo ' + data)

                saldoConta = data[0]['saldo']
                resolve(saldoConta)
            })
        })

        valorDeposito = parseFloat(valorDeposito) + parseFloat(saldoConta)

        sql =
            `UPDATE                              ` +
            `   cliente                          ` +
            `SET                                 ` +
            `    saldo = ${valorDeposito}        ` +
            `WHERE                               ` +
            `    numero_conta = "${numeroConta}";`

        await new Promise((resolve, reject) => {
            database.query(sql, (e, data) => {
                if (e) {
                    reject(new Error, e)
                }
                resolve(data)
            })
        })

        sql =
            `INSERT INTO movimentacao  ` +
            `(                         ` +
            `   numero_conta,          ` +
            `   descricao,             ` +
            `   valor                  ` +
            `)                         ` +
            `VALUES                    ` +
            `(                         ` +
            `   "${numeroConta}",      ` +
            `   "Depósito",            ` +
            `   ${valorDeposito}       ` +
            `);                        `

        await new Promise((resolve, reject) => {
            database.query(sql, (e, data) => {
                if (e) {
                    reject(e)
                    return
                }
                resolve(data)
            })
        })

        response.json({ "Message": "Depósito realizado com sucesso!" })
    }

    async saque(request, response) {
        var sql, saldoConta
        var { usuario, valor } = request.body

        if (usuario == undefined || valor == undefined) {
            response.json({ "Message": "Falta de dados" })
            return
        }

        var numeroConta = await getUsuario(usuario)

        if (numeroConta == undefined) {
            response.json({ "Message": "Usuario não encontrado" })
            return
        }

        sql =
            `SELECT                             ` +
            `   saldo                           ` +
            `FROM                               ` +
            `   cliente                         ` +
            `WHERE                              ` +
            `   numero_conta = "${numeroConta}" `

        saldoConta = await new Promise((resolve, reject) => {
            database.query(sql, (e, data) => {
                if (e) {
                    reject(e)
                    return
                }
                else {
                    saldoConta = data[0]["saldo"]
                    resolve(saldoConta)
                }
            })
        })

        if (saldoConta < valor) {
            response.json({ "Message": "Saldo insuficiente" })
            return
        }

        var valorSaque = saldoConta - valor

        sql =
            `UPDATE                            ` +
            `   cliente                        ` +
            `SET                               ` +
            `   saldo = ${valorSaque}          ` +
            `WHERE                             ` +
            `   numero_conta = ${numeroConta}; `

        await new Promise((resolve, reject) => {
            database.query(sql, (e, data) => {
                if (e) {
                    response.json({ "Message": e })
                    return
                }
                resolve(data)
            })
        })

        sql =
            `INSERT INTO movimentacao   ` +
            `(                          ` +
            `   numero_conta,           ` +
            `   descricao,              ` +
            `   valor                   ` +
            `)                          ` +
            `VALUES                     ` +
            `(                          ` +
            `   ${numeroConta},         ` +
            `   'Saque',                ` +
            `   ${valor}                ` +
            `);                         `

        await new Promise((resolve, reject) => {
            database.query(sql, (e, data) => {
                if (e) {
                    response.json({ "Message": e })
                    return
                }
                else {
                    resolve(data)
                }
            })
        })

        response.json({ "Message": "Saque realizado com sucesso" })
    }

}

module.exports = new BankController()