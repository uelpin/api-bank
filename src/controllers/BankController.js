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

    try {
        const result = await database.query(sql)

        return result[0][0].numero_conta
    } catch (error) {
        return undefined
    }
}

async function getSaldo(numeroConta) {
    const sql =
        `SELECT                              ` +
        `   saldo                            ` +
        `FROM                                ` +
        `   cliente                          ` +
        `WHERE                               ` +
        `   numero_conta = "${numeroConta}"; `

    try {
        const result = await database.query(sql)

        return result[0][0].saldo
    } catch (error) {
        return undefined
    }
}

async function updateSaldo(numeroConta, valorAtualizado) {
    const sql =
        `UPDATE                              ` +
        `   cliente                          ` +
        `SET                                 ` +
        `    saldo = ${valorAtualizado}      ` +
        `WHERE                               ` +
        `    numero_conta = "${numeroConta}";`

    try {
        await database.execute(sql)
    } catch (error) {
        throw error
    }
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

    try {
        await database.execute(sql)
    } catch (error) {
        throw error
    }
}

class BankController {

    async deposito(request, response) {
        var valorDeposito, { usuario, valor } = request.body

        if (usuario == undefined || valor == undefined) {
            response.status(400).json({ "Message": "Falta de dados" })
            return
        }
        valorDeposito = parseFloat(valor)

        var numeroConta = await getUsuario(usuario)
        if (numeroConta == undefined) {
            response.status(404).json({ "Message": "Conta não encontrada" })
            return
        }

        var saldoConta = await getSaldo(numeroConta)
        if (saldoConta == 'Error') {
            response.status(400).json({ message: "Não foi possivel verificar o saldo!" })
            return
        }

        valorDeposito = parseFloat(valorDeposito) + parseFloat(saldoConta)

        await updateSaldo(numeroConta, valorDeposito).then(
            result =>
                setMovimentacao(numeroConta, 'Depósito', valor).then(
                    result2 =>
                        response.status(200).json({ message: "Depósito realizado com sucesso!" })).catch(
                            error =>
                                response.status(400).json({ message: "Falha ao fazer o deposito" }))).catch(
                                    error2 =>
                                        response.status(400).json({ message: "Falha ao fazer o deposito" }))
    }

    async saque(request, response) {
        var saldoConta, { usuario, valor } = request.body

        if (usuario == undefined || valor == undefined) {
            response.json({ "Message": "Falta de dados" })
            return
        }

        var numeroConta = await getUsuario(usuario)
        if (numeroConta == undefined) {
            response.json({ "Message": "Usuario não encontrado" })
            return
        }

        saldoConta = await getSaldo(numeroConta)
        if (saldoConta < valor) {
            response.json({ "Message": "Saldo insuficiente" })
            return
        }

        var valorAtualizado = saldoConta - valor

        await updateSaldo(numeroConta, valorAtualizado).then(
            result =>
                setMovimentacao(numeroConta, 'Saque', valor).then(
                    result2 =>
                        response.json({ "Message": "Saque realizado com sucesso!" })))
    }

    async pagamento(request, response) {
        var { valor, usuario } = request.body

        if (valor == undefined || usuario == undefined) {
            response.json({ "Message": "Falta de dados" })
        }

        var numeroConta = await getUsuario(usuario)
        if (numeroConta == undefined) {
            response.json({ "Message": "Usuario não encontrado" })
            return
        }

        var saldo = await getSaldo(numeroConta)
        if (saldo < valor) {
            response.json({ "Message": "Saldo insuficiente" })
            return
        }

        var saldoAtualizado = parseFloat(saldo) - parseFloat(valor)

        await updateSaldo(numeroConta, saldoAtualizado).then(
            result =>
                setMovimentacao(numeroConta, 'Pagamento', valor).then(
                    result2 =>
                        response.json({ "Message": "Pagamento realizado com sucesso!" })
                )
        )
    }

    async transferencia(request, response) {
        var { usuario, conta_credito, valor } = request.body

        if (valor == undefined) {
            response.json({ "Message": "Valor não definido" })
            return
        }

        if (usuario == undefined && conta_credito == undefined) {
            response.json({ "Message": "Usuario não definido" })
            return
        }

        var movimentacao, numeroConta
        if (usuario != undefined) {
            movimentacao = 'Transferencia - Saida'
            numeroConta = await getUsuario(usuario)
        }
        else {
            movimentacao = 'Transferencia - Entrada'
            numeroConta = await getUsuario(conta_credito)
        }

        var saldo = await getSaldo(numeroConta)
        if (movimentacao == 'Transferencia - Saida' && saldo < valor) {
            response.json({ "Message": "Saldo insuficiente" })
            return
        }

        var saldoAtualizado = parseFloat(saldo) + parseFloat(valor)
        if (movimentacao == 'Transferencia - Saida') {
            saldoAtualizado = parseFloat(saldo) - parseFloat(valor)
        }

        await updateSaldo(numeroConta, saldoAtualizado).then(
            result =>
                setMovimentacao(numeroConta, movimentacao, valor).then(
                    result2 =>
                        response.json({ "Message": "Transferência realizada com sucesso!" })
                )
        )
    }

    async getInfo(request, response) {
        const usuario = request.query.nome_usuario

        var sql = `SELECT * FROM cliente`

        if (usuario != undefined) {
            sql = sql + ` WHERE nome = "${usuario}"`
        }

        try {
            const result = await database.query(sql)

            response.status(200).json(result[0])
        } catch (error) {
            response.status(400).json({ message: error })
        }
    }
}

module.exports = new BankController()