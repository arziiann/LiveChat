import express from "express";
import path from "path";
import { __dirName } from "../../backend/app.js";
import bodyParser from "body-parser";
import User from "../dataBase/users.js";
import { sequelize, ConnectDB } from "../dataBase/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { authenticate } from "../middleware/authenticate.js";
import { Sequelize } from "sequelize";
import Message from "../dataBase/message.js";
import multer from "multer";
import Verification from "../dataBase/verification.js";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { encryptMessage, decryptMessage } from "../utils/encryption.js";

dotenv.config();

const router = express.Router();

await ConnectDB().catch((err) => {
  // console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirName, "../frontend/profil", "profil.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirName, "../frontend", "register/register.html"));
});

router.get("/verify", (req, res) => {
  res.sendFile(path.join(__dirName, "../frontend", "verify/verify.html"));
});

router.get("/chat/:userId", authenticate, (req, res) => {
  res.sendFile(path.join(__dirName, "../frontend", "chat/chat.html"));
});

router.get("/chat-data", authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      userId: user.id,
      profileImageUrl: user.profileImageUrl || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users", authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const users = await sequelize.query(
      `
      SELECT 
        u.id, 
        u."firstName", 
        u."lastName", 
        u."profileImageUrl", 
        MAX(m."timestamp") AS "lastMessageTime"
      FROM "Users" u
      LEFT JOIN "Messages" m 
        ON u.id = m."from" OR u.id = m."to"
      WHERE u.id != :currentUserId
      GROUP BY u.id, u."firstName", u."lastName", u."profileImageUrl"
      ORDER BY "lastMessageTime" DESC NULLS LAST
    `,
      {
        replacements: { currentUserId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(users);
  } catch (error) {
    // console.error("User load error:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
});

router.get("/messages/:withUserId", authenticate, async (req, res) => {
  const currentUserId = req.user.userId;
  const withUserId = parseInt(req.params.withUserId, 10); // Վերափոխում ենք թիվ

  // console.log("Request received to load messages");
  // console.log("Current User ID:", currentUserId);
  // console.log("With User ID:", withUserId);

  if (isNaN(withUserId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const messages = await Message.findAll({
      where: {
        [Sequelize.Op.or]: [
          { from: currentUserId, to: withUserId },
          { from: withUserId, to: currentUserId },
        ],
      },
      order: [["timestamp", "ASC"]],
    });

    // console.log(`Found ${messages.length} messages between users`);

    const messagesWithSender = await Promise.all(
      messages.map(async (msg) => {
        const sender = await User.findByPk(msg.from);

        let decryptedMessage = null;
        try {
          if (msg.message) {
            decryptedMessage = decryptMessage(msg.message);
          }
        } catch (e) {
          // console.error(`Failed to decrypt message ID ${msg.id}:`, e.message);
        }

        return {
          ...msg.toJSON(),
          senderName: sender
            ? `${sender.firstName} ${sender.lastName}`
            : "Unknown",
          message: decryptedMessage,
        };
      })
    );

    res.json(messagesWithSender);
  } catch (err) {
    // console.error("Error loading messages:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !password || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      return res
        .status(400)
        .json({ message: "Only Gmail addresses are allowed." });
    }

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^])[A-Za-z\d@$!%*#?&^]{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include uppercase, lowercase, number and special symbol.",
      });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const saltRounds = 14;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const code = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Verification.destroy({ where: { email } });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"LiveChat" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Email Verification - LiveChat",
      text: `Hello ${firstName},

      Thank you for registering at LiveChat!
      
      Your verification code is: ${code}
      
      Please enter this code within 10 minutes to verify your email address.
      
      If you did not request this code, please ignore this email.
      
      Best regards,
      LiveChat Team
      `,
    });

    await Verification.create({
      id: uuidv4(),
      email,
      firstName,
      lastName,
      password: hashPassword,
      code,
      expiresAt,
    });

    return res
      .status(200)
      .json({ message: "Verification code sent to your Gmail address." });
  } catch (error) {
    // console.error("Register Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/verify", async (req, res) => {
  const { email, code } = req.body;

  try {
    const record = await Verification.findOne({ where: { email } });
    if (!record)
      return res.status(404).json({ message: "Verification not found." });

    if (record.code !== parseInt(code))
      return res.status(400).json({ message: "Invalid code." });

    if (Date.now() > new Date(record.expiresAt)) {
      return res.status(400).json({ message: "Code expired." });
    }

    await User.create({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      password: record.password,
    });

    await Verification.destroy({ where: { email } });

    res.status(200).json({ message: "Email verified. Registration complete!" });
  } catch (err) {
    // console.error("Verification error:", err);
    res.status(500).json({ message: "Verification failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newUser = await User.findOne({ where: { email } });
    if (!newUser) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, newUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.clearCookie("token");

    const token = jwt.sign({ userID: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res
      .status(200)
      .json({ message: "Login successful.", userId: newUser.id });
  } catch (error) {
    // console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully." });
});

async function getAllUsers() {
  try {
    const users = await User.findAll();

    // console.log("All Users:");
    users.forEach((user) => {
      // console.log(
      //   `ID: ${user.id}, Name: ${user.firstName} ${user.lastName}, Email: ${user.email}`
      // );
    });
  } catch (error) {
    // console.error("Error fetching users:", error);
  }
}

router.post("/messages", authenticate, async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user.userId;

    if (!to || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const encryptedMessage = encryptMessage(message);

    const newMessage = await Message.create({
      from,
      to,
      text: encryptedMessage,
      timestamp: new Date(),
    });

    res.status(201).json({ message: "Message sent", data: newMessage });
  } catch (err) {
    // console.error("Message send error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirName, "../uploads"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `user-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.post(
  "/upload-profile-pic",
  authenticate,
  upload.single("profilePic"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.userId;

    const imageUrl = `/uploads/${req.file.filename}`;
    try {
      await User.update(
        { profileImageUrl: imageUrl },
        { where: { id: userId } }
      );
      res.status(200).json({ imageUrl });
    } catch (err) {
      // console.error("DB update error:", err);
      res.status(500).json({ message: "Failed to save profile image" });
    }
  }
);

export { router };
