const { CartItem, Product } = require('../models');
const httpStatusText = require('../utils/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');
const appError = require('../utils/appError');

// Get user cart
const getCart = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;
  
  const cartItems = await CartItem.findAll({
    where: { userId },
    include: [{
      model: Product,
      as: 'product'
    }]
  });

  res.json({
    status: httpStatusText.Success,
    data: { cartItems }
  });
});

// Add to cart
const addToCart = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;
  const { productId, quantity = 1 } = req.body;

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    return next(appError.createError('Product not found', 404, httpStatusText.Fail));
  }

  // Check if already in cart
  const existingCartItem = await CartItem.findOne({
    where: { userId, productId }
  });

  if (existingCartItem) {
    // Update quantity
    existingCartItem.quantity += quantity;
    await existingCartItem.save();
    
    return res.json({
      status: httpStatusText.Success,
      data: { cartItem: existingCartItem }
    });
  }

  const cartItem = await CartItem.create({ userId, productId, quantity });

  res.status(201).json({
    status: httpStatusText.Success,
    data: { cartItem }
  });
});

// Update cart item quantity
const updateCartItem = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity <= 0) {
    return next(appError.createError('Quantity must be greater than 0', 400, httpStatusText.Fail));
  }

  const cartItem = await CartItem.findOne({
    where: { userId, productId }
  });

  if (!cartItem) {
    return next(appError.createError('Cart item not found', 404, httpStatusText.Fail));
  }

  cartItem.quantity = quantity;
  await cartItem.save();

  res.json({
    status: httpStatusText.Success,
    data: { cartItem }
  });
});

// Remove from cart
const removeFromCart = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;
  const { productId } = req.params;

  const cartItem = await CartItem.findOne({
    where: { userId, productId }
  });

  if (!cartItem) {
    return next(appError.createError('Cart item not found', 404, httpStatusText.Fail));
  }

  await cartItem.destroy();

  res.json({
    status: httpStatusText.Success,
    message: 'Removed from cart'
  });
});

// Clear cart
const clearCart = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;

  await CartItem.destroy({
    where: { userId }
  });

  res.json({
    status: httpStatusText.Success,
    message: 'Cart cleared'
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};