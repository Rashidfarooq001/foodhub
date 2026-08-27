const field = ['deliveryOtp'];
try {
  console.log(field.replace(/_/g, ' '));
} catch (err) {
  console.log('Error:', err.message);
}
