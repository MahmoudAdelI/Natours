import crypto from 'crypto';
import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'user must have a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'user must have an email'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'Role is either: user, guide, lead-guide or admin',
      default: 'user',
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    password: {
      type: String,
      required: [true, 'user must have a password'],
      minlength: [8, 'password must be at least 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'must confirm the password'],
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'password confirm must be the same as password',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      select: false,
      default: true,
    },
  },
  //to apply the virtuals
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre('save', async function (next) {
  // only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // hash tha password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // delete passwordConfirm field
  this.passwordConfirm = undefined;
  // XXX next(); XXX
  // ⚠️ Don't use `next` in async middleware.
  // Mongoose automatically waits for the returned Promise from an async function.
  // Mixing `async` and `next` can cause unexpected behavior (like hanging or double-calling).
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  // the -1000 mls to make sure that changedAt is always before the creation of token
  // because we check for that for protecting routes (if user changed his password the token will be invalid)
  next();
});
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
userSchema.methods.correctPassword = async function (inputPass, userPass) {
  return await bcrypt.compare(inputPass, userPass);
};
userSchema.methods.isPasswordChanged = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passChangeTimeStamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimeStamp < passChangeTimeStamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 60 * 10 * 1000;
  return resetToken;
};
const User = mongoose.model('User', userSchema);
export default User;
