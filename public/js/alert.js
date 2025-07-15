const hideAlert = () => {
  const alert = document.querySelector('.alert');
  if (alert) alert.parentElement.removeChild(alert);
};
const showAlert = (type, msg) => {
  // to clear previous alert
  hideAlert();
  const alert = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', alert);
  window.setTimeout(hideAlert, 5000);
};
export default showAlert;
