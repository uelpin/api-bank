const { promise } = require('../database/connection')
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
                reject('Error')
            }
            else {
                resolve(data[0]['numero_conta'])
            }
        })
    })
}

async function getSaldo(numeroConta) {
    const sql =
        `SELECT                              ` +
        `   saldo                            ` +
        `FROM                                ` +
        `   cliente                          ` +
        `WHERE                               ` +
        `   numero_conta = "${numeroConta}"; `

    return new Promise((resolve, reject) => {
        database.query(sql, (e, data) => {
            if (e) {
                reject('Error')
            }
            else {
                resolve(data[0]["saldo"])
            }
        })
    })
}

async function updateSaldo(numeroConta, valorAtualizado) {
    const sql =
        `UPDATE                              ` +
        `   cliente                          ` +
        `SET                                 ` +
        `    saldo = ${valorAtualizado}      ` +
        `WHERE                               ` +
        `    numero_conta = "${numeroConta}";`

    return new Promise((resolve, reject) => {
        database.query(sql, (e, data) => {
            if (e) {
                reject('Error')
            }
            else {
                resolve(data)
            }
        })
    })
}

async function setMovimentacao(numeroConta, descricao, valor) {
    const sql =
        `INSERT INTO movimentacao  ` +
        `(                         ` +
        `   numero_conta,          ` +
        `   descricao,             ` +
        `   valor                  ` +
        `)                         ` +
        `VALUES                    ` +
        `(                         ` +
        `   "${numeroConta}",      ` +
        `   "${descricao}",        ` +
        `    ${valor}              ` +
        `);                        `

    return new Promise((resolve, reject) => {
        database.query(sql, (e, data) => {
            if (e) {
                reject('Error')
            }
            else {
                resolve(data)
            }
        })
    })
}


class BankController {

    async deposito(request, response) {
        var valorDeposito, { usuario, valor } = request.body

        if (usuario == undefined || valor == undefined) {
            response.json({ "Message": "Falta de dados" })
            return
        }
        valorDeposito = parseFloat(valor)

        var numeroConta = await getUsuario(usuario)
        if (numeroConta == undefined) {
            response.json({ "Message": "Conta não encontrada" })
            return
        }

        var saldoConta = await getSaldo(numeroConta)
        if (saldoConta == 'Error') {
            response.json({ "Message": "Não foi possivel verificar o saldo!" })
            return
        }

        valorDeposito = parseFloat(valorDeposito) + parseFloat(saldoConta)

        await updateSaldo(numeroConta, valorDeposito).then(
            result =>
                setMovimentacao(numeroConta, 'Depósito', valor).then(
                    result2 =>
                        response.json({ "Message": "Depósito realizado com sucesso!" })))
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