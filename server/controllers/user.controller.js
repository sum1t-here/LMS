import User from '../models/user.models.js';
import AppError from '../utils/error.util.js';
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import sendEmail from '../utils/sendEmail.util.js';

const cookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  secure: true,
};

const register = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return next(new AppError('All fields are required', 400));
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return next(new AppError('Email already exists', 400));
  }

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url: 'bdjscjhdbcjhabdjkshcbebv',
    },
  });

  if (!user) {
    return next(new AppError('User registration failed, please try again'));
  }
  console.log(req.file);
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'lms',
        width: 250,
        height: 250,
        gravity: faces,
        crop: 'fill',
      });

      if (result) {
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.seccure_url;

        // Remove file from server
        fs.rm(`public/temp/${req.file.filename}`);
      }
    } catch (err) {
      return next(
        new AppError(err || 'File not uploaded, please try again', 500)
      );
    }
  }

  await user.save();

  user.password = undefined;

  const token = await user.generateJWTToken();

  res.cookie('token', token, cookieOptions);

  res.status(201).json({
    success: true,
    messages: 'User registered successfullly',
    user,
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('All fields are required', 400));
    }

    const user = await User.findOne({
      email,
    }).select('+password'); // explicitly calling password

    if (!user || !user.comparePassword(password)) {
      return next(new AppError('Email or password doesnot match', 400));
    }

    const token = await user.generateJWTToken();
    user.password = undefined;

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      user,
    });
  } catch (err) {
    return next(new AppError(e.message, 500));
  }
};

const logout = (req, res) => {
  res.cookie('token', null, {
    secure: true,
    maxAge: 0,
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: 'User details',
      user,
    });
  } catch (err) {
    return next(new AppError('Failed to fetch profile', 501));
  }
};

const forgotPassword = async (req, res, next) => {
  // Email > Validate in db > generate new token > send email with new url containing token
  // Get token from query param > verify token in db

  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('Email not registered', 400));
  }

  const resetToken = await user.generatePasswordResetToken;

  await user.save();

  const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const subject = 'Reset Password';
  const message = `You can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

  try {
    await sendEmail(email, subject, message);

    res.status(200).json({
      success: true,
      message: `Reset password token has been sent to ${email} successfully`,
    });
  } catch (err) {
    user.fogotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    await user.save();
    return next(new AppError(e.message, 500));
  }
};

const resetPassword = async (req, res) => {
  const { resetToken } = req.params;

  const { password } = req.body;

  const forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    forgotPasswordToken,
    fogotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or exppired.Try again', 400));
  }

  user.password = password;

  user.fogotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
};
export { register, login, logout, getProfile, forgotPassword, resetPassword };
