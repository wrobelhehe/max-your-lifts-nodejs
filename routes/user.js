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
  const hashPassword = await bcrypt.hash(user.password, 13);
  const emailQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(emailQuery, [user.email], (error, results) => {
    if (error) return res.status(500).json(error);
    if (results.length > 0) {
      return res.status(400).json({ message: "Email already exist" });
    } else {
      // Insert the new user into the users table
      const userQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      connection.query(userQuery, [user.name, user.email, hashPassword], (error, results) => {
        const userId = results.insertId
        if (error) return res.status(500).json(error);
        console.log(`Successfully inserted ${user.name} into the users table`);

        // Assign the role "user" to the new user
        const roleQuery = 'SELECT id FROM roles WHERE name = "user"';
        connection.query(roleQuery, (error, results) => {
          if (error) return res.status(500).json(error);
          const roleId = results[0].id;
          const userRoleQuery = 'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)';
          connection.query(userRoleQuery, [userId, roleId], (error, results) => {
            if (error) return res.status(500).json(error);
            console.log(`Successfully assigned the role "user" to ${user.name}`);
            return res
              .status(200)
              .json({ message: "Successfully registered" });
          });
        });
      });
    }
  });
})





router.post("/login", async (req, res) => {
  const user = req.body;
  const emailQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(emailQuery, [user.email], async (err, results) => {
    const userId = results[0]?.id
    const email = results[0]?.email
    if (!err) {
      if (typeof user.password === "undefined") {
        return res
          .status(400)
          .json({ message: "Password is required" });
      }

      // Check if the hashed password is retrieved correctly from the database
      if (typeof results[0]?.password === "undefined") {
        return res
          .status(400)
          .json({ message: "Hashed password not found in the database" });
      }
      const validPassword = await bcrypt.compare(user.password, results[0]?.password)

      if (results.length <= 0 || !validPassword) {
        return res
          .status(400)
          .json({ message: "Incorrect username or password" });
      } else if (validPassword) {

        const roleQuery = 'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?';

        connection.query(roleQuery, [results[0].id], (err, results) => {
          if (!err) {
            const role = results[0].name;
            const refreshToken = jwt.sign(
              { userId: userId, role, email: email },
              process.env.REFRESH_TOKEN,
              { expiresIn: "14d" }
            );
            const accessToken = jwt.sign(
              { userId: userId, role, email: email },
              process.env.ACCESS_TOKEN,
              { expiresIn: "10s" }
            );
            const refreshTokenQuery = 'INSERT INTO refresh_tokens (token, user_id) VALUES (?, ?)';
            connection.query(refreshTokenQuery, [refreshToken, userId], (err, results) => {
              if (err) {
                return res.status(500).json({ message: "Error saving refresh token" });
              }
            });

            res.status(200).json({ accessToken, refreshToken });

          } else {
            return res.status(500).json(err);

          }
        })
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


router.post("/token", (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken == null) {
    return res.status(401).send({ message: "User not authenticated" });
  } else {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {

      if (err) {
        return res.sendStatus(403);
      } else {
        const userId = user.userId
        const role = user.role
        const email = user.email
        const accessToken = jwt.sign(
          { userId, role, email },
          process.env.ACCESS_TOKEN,
          { expiresIn: "10s" }
        );
        res.status(201).json({ accessToken: accessToken });
      }
    });
  }
});


var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

router.post("/forgotPassword", (req, res) => {
  const user = req.body;
  console.log(user)
  query = "select email,password from users where email=?";
  connection.query(query, [user.email], (err, results) => {
    console.log(results)
    if (!err) {
      if (results.length <= 0) {
        return res.status(400).json({ error: "No user found with this email" });
      } else {
        var mailOptions = {
          from: process.env.EMAIL,
          to: results[0].email,
          subject: "Password by MaxYourLifts",
          // html:
          // "<p><b>Your login details for MaxYourLifts</b><br><b>Email: </b>" +
          // results[0].email +
          // "<br><b>Password: </b>" +
          // results[0].password +
          // '<br><a href="http://localhost:4200/">Click here to login</a></p>',
          html:
            "<p>A password reset request has been made for your MaxYourLifts account. If you did not make this request, please ignore this email.</p>" +
            "<p>Your login details: <br><b>Email: </b>" +
            results[0].email +
            "<br><b>Password: </b>" +
            results[0].password +
            '<br><a href="http://localhost:4200/">Click here to login</a></p>' +

            "<p>The MaxYourLifts team</p>",
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

  var query = "select * from users where email=?";
  connection.query(query, [email], (err, results) => {
    const isOldPasswordCorrect = bcrypt.compareSync(user.oldPassword, results[0]?.password)
    if (!err) {
      if (results.length <= 0) {
        return res.status(400).json({ message: "Incorrect old password" });
      } else if (isOldPasswordCorrect) {
        query = "update users set password=? where email=?";
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
