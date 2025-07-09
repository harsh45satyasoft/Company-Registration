const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    openingHours: {
      type: String,
      required: [true, "Opening hours is required"],
    },
    closingHours: {
      type: String,
      required: [true, "Closing hours is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    location: {
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
      },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
companySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Company", companySchema);