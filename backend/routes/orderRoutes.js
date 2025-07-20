const express = require('express');
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/verifyToken');
const allowRoles = require('../middleware/allowRoles');
const userRoles = require('../utils/userRoles');

const router = express.Router();

router.post('/', verifyToken, orderController.createOrder);
router.get('/my-orders', verifyToken, orderController.getUserOrders);
router.get('/', verifyToken, allowRoles(userRoles.ADMIN), orderController.getAllOrders);

module.exports = router;