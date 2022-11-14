const express = require("express");
const connection = require("../connection");
const router = express.Router();
var auth = require("../services/authentication");
var checkRole = require("../services/checkRole");

router.post(
  "/add",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res, next) => {
    let exercise = req.body;
    query =
      "insert into exercise (name,categoryId,description,videoUrl,status) values(?,?,?,?,'true')";
    connection.query(
      query,
      [
        exercise.name,
        exercise.categoryId,
        exercise.description,
        exercise.videoUrl,
      ],
      (err, results) => {
        if (!err) {
          return res
            .status(200)
            .json({ message: "Exercise added successfully" });
        } else {
          return res.status(500).json();
        }
      }
    );
  }
);

router.get("/get", auth.authenticateToken, (req, res, next) => {
  var query =
    "select e.id, e.name, e.description, e.videoUrl, e.status, c.id as categoryId, c.name as categoryName from exercise as e INNER JOIN category as c where e.categoryId = c.id";
  connection.query(query, (err, results) => {
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});

module.exports = router;
