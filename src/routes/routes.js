const connection = require('../database/connection')
const express = require('express')
const router = express.Router()
const BankController = require('../controllers/BankController')
const { response } = require('express')


router.post('/deposito', BankController.deposito)
router.post('/saque', BankController.saque)

router.get('/teste/:usuario', (request, response) => {
    const usuario = request.params['usuario']

    const contaid = BankController.getUsuario(usuario)
    response.send(contaid)
})


module.exports = router