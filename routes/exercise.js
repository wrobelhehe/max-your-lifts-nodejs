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
    const categoryId = exercise.categoryId
    const sets = exercise.sets
    const reps = exercise.reps
    const rpe = exercise.rpe
    const tempo = exercise.tempo
    console.log(categoryId, sets, reps, rpe, tempo)
    console.log(exercise.categoryId)
    const exerciseQuery = "INSERT INTO exercises (name, description, video_url, status) VALUES (?, ?, ?, 'true')"

    connection.query(exerciseQuery, [exercise.name, exercise.description, exercise.video_url], (error, results) => {
      const exerciseId = results.insertId
      console.log(exerciseId)
      if (error) return res.status(500).json(error);
      console.log(`Successfully inserted ${exercise.name} into the exercise table`);

      const categoryQuery = 'INSERT INTO exercise_categories (exercise_id, category_id) VALUES ?'
      const values = categoryId.map(id => [exerciseId, id])
      connection.query(categoryQuery, [values], (error, results) => {
        if (error) return res.status(500).json(error);
        console.log(`Successfully assigned the category "id" to ${exercise.name}`);

        const exerciseDetailsQuery = 'INSERT INTO exercise_details (exercise_id, sets, reps, rpe, tempo) VALUES (?, ?, ?, ?, ?)'
        connection.query(exerciseDetailsQuery, [exerciseId, sets, reps, rpe, tempo])
        if (error) return res.status(500).json(error);
        console.log(`Successfully assigned details to ${exercise.name}`);
        return res
          .status(200)
          .json({ message: "Successfully added exercise" });
      })



    })

  }
);




router.get("/get", auth.authenticateToken, (req, res, next) => {
  const exerciseQuery = "SELECT e.*, c.name as category_name, d.* FROM exercises e JOIN exercise_categories ec ON e.id = ec.exercise_id JOIN categories c ON ec.category_id = c.id JOIN exercise_details d ON e.id = d.exercise_id";

  connection.query(exerciseQuery, (error, results) => {
    if (error) return res.status(500).json(error);
    console.log(`Successfully retrieved all exercises from the database`);
    return res.status(200).json(results);
  });
});

// router.get("/get", auth.authenticateToken, (req, res, next) => {
//   var query =
//     "select e.id, e.name, e.description, e.videoUrl, e.status, c.id as categoryId, c.name as categoryName from exercises as e INNER JOIN categories as c where e.categoryId = c.id";
//   connection.query(query, (err, results) => {
//     if (!err) {
//       return res.status(200).json(results);
//     } else {
//       return res.status(500).json(err);
//     }
//   });
// });

// router.get("/getByCategory/:id", auth.authenticateToken, (req, res, next) => {
//   const id = req.params.id;
//   var query =
//     "select id,name from exercises where categoryId= ? and status= 'true'";
//   connection.query(query, [id], (err, results) => {
//     if (!err) {
//       return res.status(200).json(results);
//     } else {
//       return res.status(500).json(err);
//     }
//   });
// });

router.get("/getByCategory/:id", auth.authenticateToken, (req, res, next) => {
  const exerciseId = req.params.id;
  const exerciseQuery = "SELECT e.*, c.name as category_name, d.* FROM exercises e JOIN exercise_categories ec ON e.id = ec.exercise_id JOIN categories c ON ec.category_id = c.id JOIN exercise_details d ON e.id = d.exercise_id WHERE e.id = ? AND e.status = 'true'";

  connection.query(exerciseQuery, [exerciseId], (error, results) => {
    if (error) return res.status(500).json(error);
    console.log(`Successfully retrieved exercise with ID ${exerciseId} from the database`);
    return res.status(200).json(results[0]);
  });
});




// router.get("/getById/:id", auth.authenticateToken, (req, res, next) => {
//   const id = req.params.id;
//   var query = "select id,name,description,videoUrl from exercise where id = ?";
//   connection.query(query, [id], (err, results) => {
//     if (!err) {
//       return res.status(200).json(results[0]);
//     } else {
//       return res.status(500).json(err);
//     }
//   });
// });

router.get("/getById/:id", auth.authenticateToken, (req, res, next) => {
  const exerciseId = req.params.id;
  const exerciseQuery = "SELECT e.*, c.name as category_name, d.* FROM exercises e JOIN exercise_categories ec ON e.id = ec.exercise_id JOIN categories c ON ec.category_id = c.id JOIN exercise_details d ON e.id = d.exercise_id WHERE e.id = ?";

  connection.query(exerciseQuery, [exerciseId], (error, results) => {
    if (error) return res.status(500).json(error);
    console.log(`Successfully retrieved exercise with ID ${exerciseId} from the database`);
    return res.status(200).json(results[0]);
  });
});

router.patch(
  "/update",
  auth.authenticateToken,
  checkRole.checkRole,
  (req, res, next) => {
    let exercise = req.body;
    var query =
      "update exercises set name=?,categoryId=?,description=?,videoUrl=? where id=?";
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
    var query = "delete from exercises where id=?";
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
    var query = "update exercises set status=? where id=?";
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
