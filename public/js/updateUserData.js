import axios from 'axios';
import showAlert from './alert.js';

const updateUserData = async (data, type) => {
  try {
    const url =
      type === 'data'
        ? 'http://localhost:3000/api/v1/users/me'
        : 'http://localhost:3000/api/v1/users/update-password';

    const res = await axios.patch(url, data);

    if (res.data) {
      showAlert(
        'success',
        `${type === 'data' ? 'Data' : 'Password'} has been updated successfully`,
      );
      window.location.reload(true);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export default updateUserData;
