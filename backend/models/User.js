const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firebaseUid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // null for Firebase users
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'USER', 'MANAGER', 'WRITER', 'READER'),
      defaultValue: 'USER'
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: 'profile.png'
    },
    isFirebaseUser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'Users',
    timestamps: true
  });

  User.associate = function(models) {
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders'
    });
    User.hasMany(models.Favorite, {
      foreignKey: 'userId',
      as: 'favorites'
    });
    User.hasMany(models.CartItem, {
      foreignKey: 'userId',
      as: 'cartItems'
    });
  };

  return User;
};