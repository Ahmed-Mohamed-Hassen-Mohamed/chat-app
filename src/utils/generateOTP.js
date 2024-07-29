const generateOTP = (length) => {
  if (length <= 0) {
    throw new Error("Length must be a positive integer.");
  }
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
};

module.exports = generateOTP;
