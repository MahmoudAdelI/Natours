import axios from 'axios';
import showAlert from './alert.js';

export const signup = async (data) => {
  try {
    console.log(data);
    const res = await axios.post(
      'http://localhost:3000/api/v1/users/signup',
      data,
    );

    if (res.data) {
      showAlert('success', 'Signed up successfully');
      window.location.assign('/login');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const forgotPassword = async (email) => {
  try {
    const res = await axios.post(
      'http://localhost:3000/api/v1/users/forgot-password',
      {
        email,
      },
    );
    if (res.data) {
      showAlert('success', 'Check your email');
      window.location.assign('/');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const resetPassword = async (data, token) => {
  try {
    const res = await axios.patch(
      `http://localhost:3000/api/v1/users/reset-password/${token}`,
      data,
    );
    if (res.data) {
      showAlert('success', 'Password has been resetted successfully');
      window.location.assign('/');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
export const login = async (data) => {
  try {
    const res = await axios.post(
      'http://localhost:3000/api/v1/users/login',
      data,
    );
    if (res.data) {
      showAlert('success', 'Logged In');
      window.location.assign('/');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
export const logout = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/v1/users/logout');
    if (res.data) window.location.assign('/login');
  } catch (err) {
    showAlert('error', 'Error logging out, Try again!');
  }
};
