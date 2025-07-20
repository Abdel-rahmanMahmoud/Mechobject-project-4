'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await queryInterface.bulkInsert('Users', [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        avatar: 'profile.png',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Regular',
        lastName: 'User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER',
        avatar: 'profile.png',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};