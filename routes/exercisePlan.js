const express = require("express");
const connection = require("../connection");
const router = express.Router();
var auth = require("../services/authentication");
let ejs = require("ejs");
let pdf = require("html-pdf");
let path = require("path");
var fs = require("fs");
var uuid = require("uuid");


router.get("/generatePlan/:planId", auth.authenticateToken, (req, res) => {
  const sql = `SELECT p.name AS plan_name, p.description AS plan_description, pi.sex, pi.age, pi.equipment, pi.weight, pi.squat, pi.bench, pi.deadlift, pi.tested, w.name AS workout_name, w.description AS workout_description, e.id, e.name, e.description, e.video_url, e.status, ed.sets, ed.reps, ed.rpe, ed.tempo
  FROM plans p
  INNER JOIN plan_info pi ON p.id = pi.plan_id
  INNER JOIN workouts w ON p.id = w.plan_id
  INNER JOIN workout_exercises we ON w.id = we.workout_id
  INNER JOIN exercises e ON we.exercise_id = e.id
  INNER JOIN exercise_details ed ON e.id = ed.exercise_id
  WHERE p.user_id = ? AND p.id = ?`;
  const userId = res.locals.userId;
  const planId = req.params.planId;

  connection.query(sql, [userId, planId], (error, rows) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    if (rows.length === 0) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }
    const output = {
      plan_name: rows[0].plan_name,
      plan_description: rows[0].plan_description,
      sex: rows[0].sex,
      age: rows[0].age,
      equipment: rows[0].equipment,
      weight: rows[0].weight,
      squat: rows[0].squat,
      bench: rows[0].bench,
      deadlift: rows[0].deadlift,
      tested: rows[0].tested,
      workouts: []
    };
    const workouts = {};
    rows.forEach(row => {
      if (!workouts[row.workout_name]) {
        workouts[row.workout_name] = {
          workout_name: row.workout_name,
          workout_description: row.workout_description,
          exercises: []
        };
      }
      workouts[row.workout_name].exercises.push({
        id: row.id,
        name: row.name,
        description: row.description,
        video_url: row.video_url,
        status: row.status,
        sets: row.sets,
        reps: row.reps,
        rpe: row.rpe,
        tempo: row.tempo
      });
    });
    output.workouts = Object.values(workouts);
    res.json(output);
  });
});



router.post("/addPlan", auth.authenticateToken, (req, res) => {
  const { planName, planDescription, workouts, sex, age, equipment, weight, squat, bench, deadlift, tested } = req.body;
  const userId = res.locals.userId
  console.log(userId)
  connection.beginTransaction(error => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    connection.query(
      "INSERT INTO plans (name, description, user_id) VALUES (?, ?, ?)",
      [planName, planDescription, userId],
      (error, result) => {
        if (error) {
          console.error(error);
          connection.rollback(() => {
            res.status(500).json({ message: "Internal server error" });
          });
          return;
        }
        const planId = result.insertId;
        connection.query(
          "INSERT INTO plan_info (plan_id, sex, age, equipment, weight, squat, bench, deadlift, tested) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [planId, sex, age, equipment, weight, squat, bench, deadlift, tested],
          (error, result) => {
            if (error) {
              console.error(error);
              connection.rollback(() => {
                res.status(500).json({ message: "Internal server error" });
              });
              return;
            }
            const queries = workouts.map(workout =>
              new Promise((resolve, reject) => {
                connection.query(
                  "INSERT INTO workouts (plan_id, name, description) VALUES (?, ?, ?)",
                  [planId, workout.name, workout.description],
                  (error, result) => {
                    if (error) {
                      console.error(error);
                      reject();
                      return;
                    }
                    const workoutId = result.insertId;
                    const exerciseQueries = workout.exerciseIds.map(exerciseId =>
                      new Promise(
                        (resolve, reject) => {
                          connection.query(
                            "INSERT INTO workout_exercises (workout_id, exercise_id) VALUES (?, ?)",
                            [workoutId, exerciseId],
                            error => {
                              if (error) {
                                console.error(error);
                                reject();
                                return;
                              }
                              resolve();
                            }
                          );
                        }
                      )
                    );
                    Promise.all(exerciseQueries)
                      .then(() => {
                        resolve();
                      })
                      .catch(() => {
                        reject();
                      });
                  }
                );
              })
            );
            Promise.all(queries)
              .then(() => {
                connection.commit(error => {
                  if (error) {
                    console.error(error);
                    connection.rollback(() => {
                      res.status(500).json({ message: "Internal server error" });
                    });
                    return;
                  }
                  res.json({ message: "Plan added successfully" });
                });
              })
              .catch(() => {
                connection.rollback(() => {
                  res.status(500).json({ message: "Internal server error" });
                });
              });
          }
        );
      }
    );
  });
});









router.delete("/deletePlan/:id", auth.authenticateToken, (req, res) => {
  const planId = req.params.id;
  connection.beginTransaction(error => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    connection.query("DELETE FROM plan_info WHERE plan_id = ?", [planId], error => {
      if (error) {
        console.error(error);
        connection.rollback(() => {
          res.status(500).json({ message: "Internal server error" });
        });
        return;
      }
      connection.query(
        "SELECT id FROM workouts WHERE plan_id = ?",
        [planId],
        (error, rows) => {
          if (error) {
            console.error(error);
            connection.rollback(() => {
              res.status(500).json({ message: "Internal server error" });
            });
            return;
          }
          const workoutIds = rows.map(row => row.id);
          const queries = workoutIds.map(workoutId =>
            new Promise((resolve, reject) => {
              connection.query(
                "DELETE FROM workout_exercises WHERE workout_id = ?",
                [workoutId],
                error => {
                  if (error) {
                    console.error(error);
                    reject();
                    return;
                  }
                  resolve();
                }
              );
            })
          );
          Promise.all(queries).then(() => {
            connection.query(
              "DELETE FROM workouts WHERE plan_id = ?",
              [planId],
              error => {
                if (error) {
                  console.error(error);
                  connection.rollback(() => {
                    res.status(500).json({ message: "Internal server error" });
                  });
                  return;
                }
                connection.query(
                  "DELETE FROM plans WHERE id = ?",
                  [planId],
                  error => {
                    if (error) {
                      console.error(error);
                      connection.rollback(() => {
                        res.status(500).json({ message: "Internal server error" });
                      });
                      return;
                    }
                    connection.commit(error => {
                      if (error) {
                        console.error(error);
                        connection.rollback(() => {
                          res.status(500).json({ message: "Internal server error" });
                        });
                        return;
                      }
                      connection.query("SELECT MAX(id) as max_id FROM workouts", (error, results) => {
                        if (error) return res.status(500).json(error);
                        const maxId = results[0].max_id;
                        connection.query(`ALTER TABLE workouts AUTO_INCREMENT = ${maxId + 1}`, (error, results) => {
                          if (error) return res.status(500).json(error);
                          console.log(`Successfully reset the autoincrement value in the workouts table to ${maxId + 1}`);

                          // Reset the autoincrement value in the exercise_details table to the last index
                          connection.query("SELECT MAX(id) as max_id FROM plans", (error, results) => {
                            if (error) return res.status(500).json(error);
                            const maxId = results[0].max_id;
                            connection.query(`ALTER TABLE plans AUTO_INCREMENT = ${maxId + 1}`, (error, results) => {
                              if (error) return res.status(500).json(error);
                              console.log(`Successfully reset the autoincrement value in the plans table to ${maxId + 1}`);

                              connection.query("SELECT MAX(id) as max_id FROM plan_info", (error, results) => {
                                if (error) return res.status(500).json(error);
                                const maxId = results[0].max_id;
                                connection.query(`ALTER TABLE plan_info AUTO_INCREMENT = ${maxId + 1}`, (error, results) => {
                                  if (error) return res.status(500).json(error);
                                  console.log(`Successfully reset the autoincrement value in the plan_info table to ${maxId + 1}`);



                                  return res.status(200).json({ message: "Successfully deleted exercise and related rows" });
                                });
                              });

                            });
                          });
                        });
                      });
                    });
                  }
                );
              }
            );
          })
            .catch(() => {
              connection.rollback(() => {
                res.status(500).json({ message: "Internal server error" });
              });
            });
        }
      );
    });
  });
});

router.get("/getPlans", auth.authenticateToken, (req, res) => {
  const userId = res.locals.userId
  const sql = `SELECT p.id AS plan_id, p.name AS plan_name, p.description AS plan_description, pi.squat, pi.bench, pi.deadlift
  FROM plans p
  INNER JOIN plan_info pi ON p.id = pi.plan_id
  WHERE p.user_id = ?`;
  connection.query(sql, [userId], (error, rows) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    if (rows.length === 0) {
      res.status(200).json([]);
      return;
    }
    res.json(rows);
  });
});



module.exports = router;