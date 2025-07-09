const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");           //Gets the Authorization header (e.g., Bearer eyJhbGciOi...), Removes the "Bearer " prefix to extract just the token string.

    if (!token) {
      return res.status(401).json({ message: "No authentication token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");  //Verifies the token using the secret key, decoded will contain the payload — usually { userId: ..., iat: ..., exp: ... }.
    
    // Find user
    const user = await User.findById(decoded.userId);             //Tries to find the user in the database using the userId from the token.
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request object
    req.user = user;                                             //Adds the authenticated user to the req object so that downstream routes/controllers can access it.
    next();                                                      // Calls the next middleware or route handler in the stack.
  } catch (error) {
    res.status(401).json({ message: "Token is invalid" });
  }
};

module.exports = auth; 