const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],  ///^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {                    //This registers a pre-save hook on the userSchema,It runs before a User document is saved
  if (!this.isModified("password")) return next();                //this refers to the document being saved, isModified() checks if the password field has been modified, If the password hasn't changed (e.g., you're just updating email), skip hashing and continue saving.
  
  try {
    const salt = await bcrypt.genSalt(10);                        // Generate a salt with 10 rounds
    this.password = await bcrypt.hash(this.password, salt);       //hashes the plaintext password using the generated salt.
    next();                                                       //Calls the next middleware or completes the save operation.
  } catch (error) {
    next(error);                                                  //If something goes wrong (e.g., bcrypt fails), it passes the error to Mongoose’s error handler.
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {    //This method allows you to compare a candidate password(user password during login) with the hashed password in the database during login attempts.
  try {
    return await bcrypt.compare(candidatePassword, this.password);           //bcrypt.compare() hashes the candidatePassword internally and compares it with the stored hashed password(this.password).
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User; 

//^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)
//@
//(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+
//[a-zA-Z]{2,}$