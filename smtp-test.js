const nodemailer = require('nodemailer');

async function main() {
 const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com',
   port: 587,
   secure: false,
   auth: {
     user: config.emailSender.email,
     pass: config.emailSender.app_pass,
   },
 });

  try {
    await transporter.verify();
    console.log('✅ SMTP credentials are valid and server reachable');
  } catch (err) {
    console.error('❌ SMTP verify failed:', err.message);
  }
}

main();
