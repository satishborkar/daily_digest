const nodemailer = require("nodemailer");
const { convert } = require("html-to-text");
const pug = require("pug");

module.exports = class Email {
  constructor(user, url) {
    this.firstName = user.name.split(" ")[0];
    this.to = user.email;
    this.from = `Daily Digest <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  //  1 -Create Transporter
  createTransporter(mailOptions) {
    // using same email client for both dev & prod
    return nodemailer
      .createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PWD,
        },
      })
      .sendMail(mailOptions);
  }
  //  2 send email with pug templates

  async send(template, subject) {
    // Render HTML based email template using pug
    const html = pug.renderFile(
      `${__dirname}/../templates/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // Define email options
    const options = {
      wordwrap: 130,
    };
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html, options),
    };

    await this.createTransporter(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Daily Digest family. :)");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset link - valid for 10 min only"
    );
  }
};
