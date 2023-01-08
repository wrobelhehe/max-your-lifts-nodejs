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
    const category_id = exercise.category_id
    const sets = exercise.sets
    const reps = exercise.reps
    const rpe = exercise.rpe
    const tempo = exercise.tempo
    console.log(category_id, sets, reps, rpe, tempo)
    console.log(exercise.category_id)
    const exerciseQuery = "INSERT INTO exercises (name, description, video_url, status) VALUES (?, ?, ?, 'true')"

    connection.query(exerciseQuery, [exercise.name, exercise.description, exercise.video_url], (error, results) => {
      const exerciseId = results.insertId
      console.log(exerciseId)
      if (error) return res.status(500).json(error);
      console.log(`Successfully inserted ${exercise.name} into the exercise table`);

      const categoryQuery = 'INSERT INTO exercise_categories (exercise_id, category_id) VALUES ?'
      const values = category_id.map(id => [exerciseId, id])
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
  const exerciseQuery = "SELECT e.*, c.name as category_name, ec.category_id, d.* FROM exercises e JOIN exercise_categories ec ON e.id = ec.exercise_id JOIN categories c ON ec.category_id = c.id JOIN exercise_details d ON e.id = d.exercise_id";

  connection.query(exerciseQuery, (error, results) => {
    if (error) return res.status(500).json(error);
    console.log(`Successfully retrieved all exercises from the database`);
    return res.status(200).json(results);
  });
});

router.get("/getByCategory/:id", auth.authenticateToken, (req, res, next) => {
  const id = req.params.id;
  const exerciseQuery = "SELECT e.*, c.name as category_name, d.* FROM exercises e JOIN exercise_categories ec ON e.id = ec.exercise_id JOIN categories c ON ec.category_id = c.id JOIN exercise_details d ON e.id = d.exercise_id WHERE ec.category_id = ? AND e.status = 'true'";

  connection.query(exerciseQuery, [id], (error, results) => {
    if (error) return res.status(500).json(error);
    console.log(`Successfully retrieved exercises with category ID ${id} from the database`);
    return res.status(200).json(results);
  });
});




router.get("/getById/:id", auth.authenticateToken, (req, res, next) => {
  const exerciseId = req.params.id;
  const exerciseQuery = "SELECT c.name as category_name, c.id as category_id FROM categories c JOIN exercise_categories ec ON c.id = ec.category_id WHERE ec.exercise_id = ?";
  connection.query(exerciseQuery, [exerciseId], (error, results) => {
    if (error) return res.status(500).json(error);

    // Extract the category names and IDs into separate arrays
    const category_name = results.map(row => row.category_name);
    const category_id = results.map(row => row.category_id);

    console.log(`Successfully retrieved categories for exercise with ID ${exerciseId} from the database`);
    return res.status(200).json({ category_name, category_id });
  });
});



router.patch("/update", auth.authenticateToken, checkRole.checkRole, (req, res, next) => {
  const exerciseId = req.body.id;
  const exercise = req.body;
  const category_id = exercise.category_id;
  const sets = exercise.sets;
  const reps = exercise.reps;
  const rpe = exercise.rpe;
  const tempo = exercise.tempo;

  let exerciseQuery = "UPDATE exercises SET ";
  let queryParams = [];
  if (exercise.name) {
    exerciseQuery += "name = ?, ";
    queryParams.push(exercise.name);
  }
  if (exercise.description) {
    exerciseQuery += "description = ?, ";
    queryParams.push(exercise.description);
  }
  if (exercise.video_url) {
    exerciseQuery += "video_url = ?, ";
    queryParams.push(exercise.video_url);
  }
  // Remove the trailing comma and space
  exerciseQuery = exerciseQuery.slice(0, -2);
  exerciseQuery += " WHERE id = ?";
  queryParams.push(exerciseId);

  connection.query(exerciseQuery, queryParams, (error, results) => {
    if (error) return res.status(500).json(error);
    console.log(`Successfully updated exercise with ID ${exerciseId}`);

    const deleteCategoriesQuery = "DELETE FROM exercise_categories WHERE exercise_id = ?";
    connection.query(deleteCategoriesQuery, [exerciseId], (error, results) => {
      if (error) return res.status(500).json(error);
      console.log(`Successfully deleted categories for exercise with ID ${exerciseId}`);

      const insertCategoriesQuery = "INSERT INTO exercise_categories (exercise_id, category_id) VALUES ?";
      const values = category_id.map(id => [exerciseId, id]);
      connection.query(insertCategoriesQuery, [values], (error, results) => {
        if (error) return res.status(500).json(error);
        console.log(`Successfully inserted categories for exercise with ID ${exerciseId}`);

        const updateDetailsQuery = "UPDATE exercise_details SET sets = ?, reps = ?, rpe = ?, tempo = ? WHERE exercise_id = ?";
        connection.query(updateDetailsQuery, [sets, reps, rpe, tempo, exerciseId], (error, results) => {
          if (error) return res.status(500).json(error);
          console.log(`Successfully updated details for exercise with ID ${exerciseId}`);
          return res.status(200).json({ message: "Successfully updated exercise" });
        });
      });
    });
  });
});





router.delete("/delete/:id", auth.authenticateToken, (req, res, next) => {
  const exerciseId = req.params.id;
  console.log(exerciseId)
  const deleteWorkoutExercisesQuery = "DELETE FROM workout_exercises WHERE exercise_id = ?";
  const deleteCategoriesQuery = "DELETE FROM exercise_categories WHERE exercise_id = ?";
  const deleteDetailsQuery = "DELETE FROM exercise_details WHERE exercise_id = ?";
  const deleteExerciseQuery = "DELETE FROM exercises WHERE id = ?";

  connection.query(deleteWorkoutExercisesQuery, [exerciseId], (error, results) => {
    if (error) return res.status(500).json(error);
    console.log(`Successfully deleted rows from workout_exercises for exercise with ID ${exerciseId}`);

    connection.query(deleteCategoriesQuery, [exerciseId], (error, results) => {
      if (error) return res.status(500).json(error);
      console.log(`Successfully deleted categories for exercise with ID ${exerciseId} from the database`);

      connection.query(deleteDetailsQuery, [exerciseId], (error, results) => {
        if (error) return res.status(500).json(error);
        console.log(`Successfully deleted details for exercise with ID ${exerciseId} from the database`);

        connection.query(deleteExerciseQuery, [exerciseId], (error, results) => {
          if (error) return res.status(500).json(error);
          console.log(`Successfully deleted exercise with ID ${exerciseId} from the database`);

          // Reset the autoincrement value in the exercise table to the last index
          connection.query("SELECT MAX(id) as max_id FROM exercises", (error, results) => {
            if (error) return res.status(500).json(error);
            const maxId = results[0].max_id;
            connection.query(`ALTER TABLE exercises AUTO_INCREMENT = ${maxId + 1}`, (error, results) => {
              if (error) return res.status(500).json(error);
              console.log(`Successfully reset the autoincrement value in the exercise table to ${maxId + 1}`);

              // Reset the autoincrement value in the exercise_details table to the last index
              connection.query("SELECT MAX(id) as max_id FROM exercise_details", (error, results) => {
                if (error) return res.status(500).json(error);
                const maxId = results[0].max_id;
                connection.query(`ALTER TABLE exercise_details AUTO_INCREMENT = ${maxId + 1}`, (error, results) => {
                  if (error) return res.status(500).json(error);
                  console.log(`Successfully reset the autoincrement value in the exercise_details table table to ${maxId + 1}`);
                  return res.status(200).json({ message: "Successfully deleted exercise and related rows" });
                });
              });
            });
          });
        });
      });
    });
  });
});


router.patch("/updateStatus", auth.authenticateToken, (req, res, next) => {
  const { id, status } = req.body;

  const updateStatusQuery = "UPDATE exercises SET status = ? WHERE id = ?";
  connection.query(updateStatusQuery, [status, id], (error, results) => {
    if (error) return res.status(500).json(error);
    console.log(`Successfully updated status for exercise with ID ${id} in the database`);
    return res.status(200).json({ message: "Successfully updated exercise status" });
  });
});

module.exports = router;
