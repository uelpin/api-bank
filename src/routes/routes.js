const connection = require('../database/connection')
const express = require('express')
const router = express.Router()
const BankController = require('../controllers/BankController')
const { response } = require('express')


router.post('/deposito', BankController.deposito)
router.post('/saque', BankController.saque)
router.post('/pagamento', BankController.pagamento)

module.exports = router