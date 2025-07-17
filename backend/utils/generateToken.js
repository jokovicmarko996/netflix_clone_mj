import jwt from "jsonwebtoken";
import { ENV_VARS } from "../config/envVars.js";

export const generateTokenAndSetCookie = (userId, res) => {
  const secretKey = process.env.JWT_SECRET; // Ensure this is defined in your environment variables

  if (!secretKey) {
    throw new Error("JWT_SECRET is not defined");
  }

  // 📌 jwt.sign(payload, secret, options)
  // payload – korisnički podaci
  // secret – tvoj tajni ključ za potpisivanje
  // expiresIn – koliko dugo važi token ('1h', '7d', '30m', itd.)
  const token = jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: "15d" });

  // put the token in the cookie
  res.cookie("jwt-netflix", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks, make it not be accessed by JS
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: ENV_VARS.NODE_ENV !== "development",
  });

  return token;

  // 🔐 Nakon uspešnog logovanja, server generiše JWT i šalje ga klijentu
  // 📦 Klijent ga čuva u localStorage ili cookies
  // 🔁 Pri svakom API zahtevu, klijent šalje token (npr. u Authorization headeru)
  // ✅ Server proverava token i odlučuje da li korisnik ima pristup
};
