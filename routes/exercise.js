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

router.get("/getByCategory/:id", auth.authenticateToken, (req, res, next) => {
  const id = req.params.id;
  var query =
    "select id,name from exercise where categoryId= ? and status= 'true'";
  connection.query(query, [id], (err, results) => {
    if (!err) {
      return res.status(200).json(results);
    } else {
      return res.status(500).json(err);
    }
  });
});

router.get("/getById/:id", auth.authenticateToken, (req, res, next) => {
  const id = req.params.id;
  var query = "select id,name,description,videoUrl from exercise where id = ?";
  connection.query(query, [id], (err, results) => {
    if (!err) {
      return res.status(200).json(results[0]);
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
    let exercise = req.body;
    var query =
      "update exercise set name=?,categoryId=?,description=?,videoUrl=? where id=?";
    connection.query(
      query,
      [
        exercise.name,
        exercise.categoryId,
        exercise.description,
        exercise.videoUrl,
        exercise.id,
      ],
      (err, results) => {
        if (!err) {
          if (results.affectedRows == 0) {
            return res
              .status(404)
              .json({ message: "Exercise id does not found" });
          }
          return res
            .status(200)
            .json({ message: "Exercise updated successfully" });
        } else {
          return res.status(500).json(err);
        }
      }
    );
  }
);

router.delete(
  "/delete/:id",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res, next) => {
    const id = req.params.id;
    var query = "delete from exercise where id=?";
    connection.query(query, [id], (err, results) => {
      if (!err) {
        if (results.affectedRows == 0) {
          return res
            .status(404)
            .json({ message: "Exercise id does not found" });
        }
        return res
          .status(200)
          .json({ message: "Exercise deleted successfully" });
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

router.patch(
  "/updateStatus",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res, next) => {
    let user = req.body;
    var query = "update exercise set status=? where id=?";
    connection.query(query, [user.status, user.id], (err, results) => {
      if (!err) {
        if (results.affectedRows == 0) {
          return res
            .status(404)
            .json({ message: "Exercise id does not found" });
        }
        return res
          .status(200)
          .json({ message: "Exercise status updated successfully" });
      } else {
        return res.status(500).json(err);
      }
    });
  }
);

module.exports = router;
