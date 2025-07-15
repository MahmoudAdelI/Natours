import '@babel/polyfill';
import {
  forgotPassword,
  login,
  logout,
  resetPassword,
  signup,
} from './auth.js';
import { displayMap } from './mapbox.js';
import updateUserData from './updateUserData.js';
import { bookTour } from './stripe.js';
// DOM ELEMENTS
const mapBox = document.getElementById('map');
const signupForm = document.querySelector('.form--signup');
const loginForm = document.querySelector('.form--login');
const ForgotPasswordForm = document.querySelector('.form--forgotPassword');
const ResetPasswordForm = document.querySelector('.form--ResetPassword');
const logoutBtn = document.querySelector('.nav__el.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const passwordForm = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');

// DELEGTION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('signup').textContent = 'Signing up...';
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password--confirm').value;
    await signup({ name, email, password, passwordConfirm });
    document.getElementById('signup').textContent = 'Sign up';
    signupForm.reset();
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('login').textContent = 'Loging in...';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login({ email, password });
    document.getElementById('login').textContent = 'Login';
    loginForm.reset();
  });
}
if (ForgotPasswordForm) {
  ForgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('send').textContent = 'Sending...';
    const email = document.getElementById('email').value;
    await forgotPassword(email);
  });
}
if (ResetPasswordForm) {
  ResetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = new URLSearchParams(window.location.search).get('token');
    document.getElementById('reset').textContent = 'Resetting...';
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password--confirm').value;
    await resetPassword({ password, passwordConfirm }, token);
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    logout();
  });
}
if (userDataForm) {
  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-settings').textContent = 'Updating...';
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await updateUserData(form, 'data');

    document.querySelector('.btn--save-settings').textContent = 'Save settings';
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateUserData(
      { currentPassword, newPassword, passwordConfirm },
      'password',
    );
    document.querySelector('.btn--save-password').textContent = 'Save password';
    passwordForm.reset();
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    const { tourId } = e.target.dataset;
    console.log(tourId);
    /*eslint-disable */
    const stripe = Stripe(
      'pk_test_51RjSkR2LKNiX0QHcNdHHoOfTdKPiOXxVopaPfyeIhliY50kmuUsi7YrCEiFybOhzTvKMEGW4P3OI05XvoKhcKBuf00CdTIZRHd',
    );
    bookTour(tourId, stripe);
  });
}
