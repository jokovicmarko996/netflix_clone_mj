import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

// sve su post requestovi => korisnik salje podatke na server koji se izvlace iz req.body objekta i proverava se validnost
export async function signup(req, res) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Regular expression to validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUserByEmail = await User.findOne({ email: email });

    if (existingUserByEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const existingUserByUsername = await User.findOne({ username: username });

    if (existingUserByUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    // genSalt() je metoda koja generiše "salt" — nasumičan niz karaktera koji se dodaje lozinki pre heširanja, kako bi se povećala sigurnost. Broj 10 znači da bcrypt algoritam prolazi kroz 2¹⁰ = 1024 iteracija prilikom generisanja hasha.
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt); // 123456 password -> hashed password e.g. // "$2a$10$43AIyUnTqohb5unzaTMNhOztumzxqVpZeJBOHi3FBwk1ePCBYSi3a" mongo db primer

    const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];

    const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];

    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      image,
    });

    // Ova funkcija generiše JWT (JSON Web Token) koristeći jedinstveni ID korisnika (newUser._id) i postavlja ga kao kolačić u HTTP odgovoru.
    // newUser._id je automatski generisan od strane MongoDB-a kada se kreira novi korisnik.
    generateTokenAndSetCookie(newUser._id, res);
    await newUser.save(); // save the user to the database

    res.status(201).json({
      success: true,
      user: {
        ...newUser._doc, //sadrži "plain object" verziju MongoDB dokumenta, tj. podatke
        password: "", // Ovo se radi iz sigurnosnih razloga kako lozinka korisnika ne bi bila izložena u odgovoru.
      },
    });

    // Kreiranje korisnika:
    // Ovaj deo koda priprema podatke korisnika za čuvanje u bazi podataka.
    // Heširanje lozinke osigurava da lozinka nije sačuvana u originalnom obliku, što povećava sigurnost.
    
    // Autentifikacija:
    // Generisanje JWT tokena omogućava korisniku da ostane prijavljen nakon registracije.
    // Token se koristi za identifikaciju korisnika u budućim zahtevima prema serveru.
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(user._id, res);

    // return success response with user data
    // _doc is used to get the plain object representation of the user document
    res.status(200).json({
      success: true,
      user: {
        ...user._doc,
        password: "",
      },
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function logout(req, res) {
  // ocisti kolacic sa sesijom za logovanje korisnika
  try {
    res.clearCookie("jwt-netflix");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function authCheck(req, res) {
  try {
    console.log("req.user:", req.user);
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.log("Error in authCheck controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
