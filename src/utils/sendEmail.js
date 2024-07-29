const nodemailer = require("nodemailer");

sendEmail = async (email, subject, message) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);

    await transporter.sendMail(mailOptions, async () => {
      try {
       
      } catch (error) {
        res.status(404).send({ message: error.message });
      }
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

module.exports = sendEmail;