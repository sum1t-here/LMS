import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    fullName: {
      type: 'String',
      required: [true, 'Name is required'],
      minLength: [5, 'Name must be at least 5 characters'],
      maxLength: [50, 'Name should be less than 50 characters'],
      lowercase: true,
      trim: true,
    },
    email: {
      type: 'String',
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi,
        'Please fill in a valid email address',
      ],
    },
    password: {
      type: 'String',
      required: [true, 'Password is required'],
      minLength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: {
      public_id: {
        type: 'String',
      },
      secure_url: {
        type: 'String',
      },
    },
    role: {
      type: 'String',
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    forgotPasswordToken: String,
    fogotPasswordExpiry: Date,
  },
  {
    timestamps: true,
  }
);

const User = model('User', userSchema);

export default User;
