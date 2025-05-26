import { DataTypes } from 'sequelize';
import { sequelize } from '../dataBase/db.js';

const Verification = sequelize.define('Verification', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  code: DataTypes.INTEGER,
  expiresAt: DataTypes.DATE,
}, {
  timestamps: false
});

export default Verification;
