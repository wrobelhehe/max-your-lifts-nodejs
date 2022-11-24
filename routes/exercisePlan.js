const express = require("express");
const connection = require("../connection");
const router = express.Router();
var auth = require("../services/authentication");
let ejs = require("ejs");
let pdf = require("html-pdf");
let path = require("path");
var fs = require("fs");
var uuid = require("uuid");

router.post("/generatePlan", auth.authenticateToken, (req, res) => {
  const generatedUuid = uuid.v1();
  const planDetails = req.body;
  var exerciseInfoPlan = JSON.parse(planDetails.exerciseInfo);
  console.log(exerciseInfoPlan);

  var query =
    "insert into plan (name,uuid,squat,benchpress,deadlift,exerciseInfo) values(?,?,?,?,?,?)";
  connection.query(
    query,
    [
      planDetails.name,
      generatedUuid,
      planDetails.squat,
      planDetails.benchpress,
      planDetails.deadlift,
      planDetails.exerciseInfo,
    ],
    (err, results) => {
      if (!err) {
        ejs.renderFile(
          path.join(__dirname, "", "plan.ejs"),
          {
            exerciseInfo: exerciseInfoPlan,
            name: planDetails.name,
            squat: planDetails.squat,
            benchpress: planDetails.benchpress,
            deadlift: planDetails.deadlift,
          },
          (err, results) => {
            if (err) {
              return res.status(500).json(err);
            } else {
              pdf
                .create(results)
                .toFile(
                  "./generated_pdf/" + generatedUuid + ".pdf",
                  function (err, data) {
                    if (err) {
                      console.log(err);
                      return res.status(500).json(err);
                    } else {
                      return res.status(200).json({ uuid: generatedUuid });
                    }
                  }
                );
            }
          }
        );
      } else {
        return res.status(500).json(err);
      }
    }
  );
});

module.exports = router;
