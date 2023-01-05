const express = require("express");
const connection = require("../connection");
const router = express.Router();
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();
var auth = require("../services/authentication");
var checkRole = require("../services/checkRole");




router.post('/worstLift', (req, res) => {
    const { age, sex, tested, equipment, weight, bench, squat, deadlift } = req.body;
    const query = `
      SELECT AVG(bench) AS bench_avg, AVG(squat) AS squat_avg, AVG(deadlift) AS deadlift_avg
      FROM output_0
      WHERE age BETWEEN ${age - 3} AND ${age + 3}
      AND sex = '${sex}'
      AND tested = '${tested}'
      AND equipment = '${equipment}'
      AND weight BETWEEN ${weight - 3} AND ${weight + 3}
      AND bench > 0 AND squat > 0 AND deadlift > 0
    `;
    connection.query(query, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: 'Error retrieving output_0 from the database' });
            return;
        }
        const { bench_avg, squat_avg, deadlift_avg } = results[0];
        console.log(results[0])
        const benchDiff = Math.abs(bench / bench_avg);
        const squatDiff = Math.abs(squat / squat_avg);
        const deadliftDiff = Math.abs(deadlift / deadlift_avg);
        let worstLift;
        if (benchDiff < squatDiff && benchDiff < deadliftDiff) {
            worstLift = 1;
        } else if (squatDiff < benchDiff && squatDiff < deadliftDiff) {
            worstLift = 2;
        } else {
            worstLift = 3;
        }
        res.json({ worstLift });
    });
});


module.exports = router;