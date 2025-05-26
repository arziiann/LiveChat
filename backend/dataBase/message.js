import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../dataBase/db.js";

const Message = sequelize.define(
  "Message",
  {
    from: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },

    to: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },

    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    timestamp: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },

    delivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

export default Message;
