import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ENV_VARS } from "../config/envVars.js";

export const protectRoute = async (req, res, next) => {
  try {
    // proveri da li je korisnik autentifikovan (ako nije, vrati gresku 401) [proveris validnost tokena]
    const token = req.cookies["jwt-netflix"];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - No Token Provided" });
    }

    // proveri da li je token validan (ako si unauthorized vrati gresku 401)
    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid Token" });
    }

    // Find the user by ID from the decoded token
    // and exclude the password field from the result
    const user = await User.findById(decoded.userId).select("-password"); // userId je ID dobijen iz generisanog tokena

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Attach the user to the request object for further use in the route handlers
    req.user = user;

    next(); // sve ok, prosledi zahtev dalje na sledeci middleware
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
