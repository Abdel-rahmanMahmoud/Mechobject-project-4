const express = require('express');
const cartController = require('../controllers/cartController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken); // All routes require authentication

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:productId', cartController.updateCartItem);
router.delete('/:productId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;