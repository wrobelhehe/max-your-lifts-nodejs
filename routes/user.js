const express = require("express");
const connection = require("../connection");
const router = express.Router();
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
var auth = require("../services/authentication");
var checkRole = require("../services/checkRole");

router.post("/signup", async (req, res) => {
  let user = req.body;
  const hashPassword = await bcrypt.hash(user.password, 13)
  query = "select email,password,role from user where email=?";
  connection.query(query, [user.email], (err, result) => {
    if (!err) {
      if (result.length <= 0) {
        query =
          "insert into user(name,email,password,role) values(?,?,?,'user')";

        connection.query(
          query,
          [user.name, user.email, hashPassword],
          (err, results) => {
            if (!err) {
              return res
                .status(200)
                .json({ message: "Successfully registered" });
            } else {
              return res.status(500).json(err);
            }
          }
        );
      } else {
        return res.status(400).json({ message: "Email already exist" });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

router.post("/login", async (req, res) => {
  const user = req.body;
  query = "select email,password,role from user where email=?";
  connection.query(query, [user.email], async (err, results) => {

    const validPassword = await bcrypt.compare(user.password, results[0]?.password)
    console.log(validPassword)
    if (!err) {
      if (results.length <= 0 || !validPassword) {
        return res
          .status(401)
          .json({ message: "Incorrect username or password" });
      } else if (validPassword) {
        const response = { email: results[0].email, role: results[0].role };

        const accessToken = generateAccessToken(response)
        const refreshToken = jwt.sign(response, process.env.REFRESH_TOKEN)
        res.status(200).json({ accessToken, refreshToken });
      } else {
        return res
          .status(400)
          .json({ message: "Something went wrong. Please try again later" });
      }
    } else {
      return res.status(500).json(err);
    }
  });

  function generateAccessToken(response) {

    return jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: "1h" })
  }
});


router.post("/token", (req, res) => {
  const refreshToken = req.body.token
  if (refreshToken == null) return res.sendStatus(401).json({ message: "User not authenticated" })

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ email: user.email, role: user.role })
    res.sendStatus(201).json({ accessToken: accessToken })
  })
})

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

router.post("/forgotPassword", (req, res) => {
  const user = req.body;
  query = "select email,password from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        return res
          .status(200)
          .json({ message: "Password send successfully to your email" });
      } else {
        var mailOptions = {
          from: process.env.EMAIL,
          to: results[0].email,
          subject: "Password by MaxYourLifts",
          html:
            "<p><b>Your login details for MaxYourLifts</b><br><b>Email: </b>" +
            results[0].email +
            "<br><b>Password: </b>" +
            results[0].password +
            '<br><a href="http://localhost:4200/">Click here to login</a></p>',
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email send: " + info.response);
          }
        });
        return res
          .status(200)
          .json({ message: "Password send successfully to your email" });
      }
    }
    else {
      return res.status(500).json(err)
    }
  });
});

router.get("/get", auth.authenticateToken, checkRole.checkRole, (req, res) => {
  var query = "select id,name,email from user where role='user'";
  connection.query(query, (err, results) => {
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});

router.get("/checkToken", auth.authenticateToken, (req, res) => {
  return res.status(200).json({ message: true });
});

router.post("/changePassword", auth.authenticateToken, async (req, res) => {

  const user = req.body;
  const email = res.locals.email;

  const newHashPassword = await bcrypt.hash(user.newPassword, 13)

  var query = "select *from user where email=?";
  connection.query(query, [email], (err, results) => {
    const isOldPasswordCorrect = bcrypt.compareSync(user.oldPassword, results[0]?.password)
    if (!err) {
      if (results.length <= 0) {
        return res.status(400).json({ message: "Incorrect old password" });
      } else if (isOldPasswordCorrect) {
        query = "update user set password=? where email=?";
        connection.query(query, [newHashPassword, email], (err, results) => {
          if (!err) {
            return res.status(200).json({ message: "Password updated" });
          } else {

            return res.status(500).json(err);
          }
        });
      } else {
        return res
          .status(400)
          .json({ message: "Something went wrong. Please try again later" });
      }
    } else {
      return res.status(500).json(err);
    }
  });
});

module.exports = router;
