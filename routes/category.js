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
    let category = req.body;
    query = "insert into categories (name) values(?)";
    connection.query(query, [category.name], (err, results) => {
      if (!err) {
        return res.status(200).json({ message: "Category added successfully" });
      } else {
        return res.status(500).json();
      }
    });
  }
);

router.get("/get", auth.authenticateToken, (req, res, next) => {
  var query = "select *from categories order by name";
  connection.query(query, (err, results) => {
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});

router.patch(
  "/update",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res, next) => {
    let category = req.body;
    console.log(category)
    var query = "update categories set name=? where id=?";
    connection.query(query, [category.name, category.id], (err, results) => {
      console.log(results)
      if (!err) {
        if (results.affectedRows == 0) {
          return res
            .status(404)
            .json({ message: "Category id does not found" });
        }
        return res
          .status(200)
          .json({ message: "Category updated successfully" });
      } else {
        return res.status(500).json();
      }
    });
  }
);

module.exports = router;
