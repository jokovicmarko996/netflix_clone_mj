import express from "express";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import movieRoutes from "./routes/movie.route.js";
import tvRoutes from "./routes/tv.route.js";
import searchRoutes from "./routes/search.route.js";

import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import { protectRoute } from "./middleware/protectRoute.js";

const app = express(); // Create an instance of the Express application

const PORT = ENV_VARS.PORT;
const __dirname = path.resolve(); // Get the current directory name

app.use(express.json()); // Middleware to parse JSON request bodies (parse req.body)
app.use(cookieParser()); // Middleware to parse cookies from the request

app.use("/api/v1/auth", authRoutes);
// ne dozvoljavas search filmovam i serija bez autentifikacije => protectRoute
app.use("/api/v1/movie", protectRoute, movieRoutes);
app.use("/api/v1/tv", protectRoute, tvRoutes);
app.use("/api/v1/search", protectRoute, searchRoutes);

// Serve static files from the frontend build directory in production
if (ENV_VARS.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist"))); 

  // any other route that is not an API route will serve the index.html file
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server started at http://localhost:" + PORT);
  connectDB();
});
