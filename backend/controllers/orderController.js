const { validationResult } = require('express-validator');
const { Order, OrderItem, Product, User } = require('../models');
const httpStatusText = require('../utils/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');
const appError = require('../utils/appError');

const createOrder = asyncWrapper(async (req, res, next) => {
  const { items, customerInfo } = req.body;
  const userId = req.currentUser.userId;

  if (!items || items.length === 0) {
    return next(
      appError.createError('Order items are required', 400, httpStatusText.Fail)
    );
  }

  let totalAmount = 0;
  
  // Calculate total amount
  for (const item of items) {
    const product = await Product.findByPk(item.id);
    if (!product) {
      return next(
        appError.createError(`Product with ID ${item.id} not found`, 404, httpStatusText.Fail)
      );
    }
    totalAmount += parseFloat(product.price) * item.quantity;
  }

  // Create order
  const order = await Order.create({
    userId,
    totalAmount,
    customerInfo: JSON.stringify(customerInfo)
  });

  // Create order items
  for (const item of items) {
    const product = await Product.findByPk(item.id);
    await OrderItem.create({
      orderId: order.id,
      productId: item.id,
      quantity: item.quantity,
      price: product.price
    });
  }

  res.status(201).json({
    status: httpStatusText.Success,
    data: { order }
  });
});

const getAllOrders = asyncWrapper(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: orders } = await Order.findAndCountAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price']
          }
        ]
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    status: httpStatusText.Success,
    data: {
      orders,
      totalOrders: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    }
  });
});

const getUserOrders = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;

  const orders = await Order.findAll({
    where: { userId },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'image']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    status: httpStatusText.Success,
    data: { orders }
  });
});

module.exports = {
  createOrder,
  getAllOrders,
  getUserOrders
};