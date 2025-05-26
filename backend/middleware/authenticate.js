import jwt, { decode } from "jsonwebtoken";
import User from "../dataBase/users.js";

export const authenticate = async (req, res, next) => {
  // console.log("Cookies received:", req.cookies);

  const token = req.cookies.token;

  if (!token) {
    // console.warn("No token found in cookies.");
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Token decoded:", decoded);

    const user = await User.findByPk(decoded.userID);

    if (!user) {
      // console.warn("User not found with ID:", decoded.userID);
      return res.status(401).json({ message: "User not found" });
    }

    // console.log("Authenticated user:", user.firstName, user.lastName);

    req.user = { userId: decoded.userID };

    next();
  } catch (error) {
    // console.error("JWT verification failed:", error.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};
