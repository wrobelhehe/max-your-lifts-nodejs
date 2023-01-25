const express = require("express");
const connection = require("../connection");
const router = express.Router();
var auth = require("../services/authentication");
var checkRole = require("../services/checkRole");

router.post("/add", auth.authenticateToken, checkRole.checkRole, (req, res, next) => {
  let category = req.body;
  query = "SELECT COUNT(*) as count FROM categories WHERE name = ?";
  connection.query(query, [category.name], (err, results) => {
    if (err) {
      return res.status(500).json();
    }
    if (results[0].count > 0) {
      return res.status(400).json({ message: "Category already exists" });
    } else {
      query = "INSERT INTO categories (name) VALUES (?)";
      connection.query(query, [category.name], (err, results) => {
        if (!err) {
          return res.status(200).json({ message: "Category added successfully" });
        } else {
          return res.status(500).json();
        }
      });
    }
  });
})

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

router.patch("/update", auth.authenticateToken, checkRole.checkRole, (req, res, next) => {
  let category = req.body;
  console.log(category)
  var checkQuery = "SELECT * FROM categories where name = ?";
  connection.query(checkQuery, [category.name], (err, results) => {
    if (!err) {
      if (results.length > 0) {
        return res.status(409).json({ message: "category with this name already exists" });
      } else {
        var updateQuery = "update categories set name=? where id=?";
        connection.query(updateQuery, [category.name, category.id], (err, results) => {
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
    } else {
      return res.status(500).json();
    }
  });
});

module.exports = router;
