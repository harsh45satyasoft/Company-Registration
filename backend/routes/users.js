const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? "Email already registered"
          : "Username already taken",
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(                                  //Generates a signed JSON Web Token (JWT) using the provided data and secret key.
      { userId: user._id },                                  //This is the data encoded inside the token, which contains the  user's MongoDB _id.
      process.env.JWT_SECRET || "your-secret-key",           //This is the secret used to sign and later verify the token.
      { expiresIn: "1h" }                                    //This sets the token to expire in 1 hours, After this time, the user must log in again or refresh the token.
    );

    res.status(201).json({                                   //201 is the HTTP status code for Created, Sends a JSON response to the frontend.
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Error creating user",
      error: error.message,
    });
  }
});

module.exports = router; 