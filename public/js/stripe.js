/*eslint-disable */
import axios from 'axios';
import showAlert from './alert.js';

/* 
 Do NOT initialize Stripe globally!
 Initializing Stripe here causes background requests (e.g., r.stripe.com)
 that interfere with authentication cookies on localhost.
 This results in login cookie being dropped or not sent, breaking login.

 Solution: Initialize Stripe only inside a click handler or after login.
*/
export const bookTour = async (tourId, stripe) => {
  try {
    const res = await axios.get(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`,
    );
    await stripe.redirectToCheckout({ sessionId: res.data.session.id });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
