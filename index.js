const express = require("express");
var cors = require("cors");
const connection = require("./connection");
const userRoute = require("./routes/user");
const categoryRoute = require("./routes/category");
const exerciseRoute = require("./routes/exercise");
const planRoute = require("./routes/exercisePlan");
const powerliftingRoute = require("./routes/powerlifting")
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/user", userRoute);
app.use("/category", categoryRoute);
app.use("/exercise", exerciseRoute);
app.use("/plan", planRoute);
app.use("/powerlifting", powerliftingRoute)

// const fs = require('fs');
// const readline = require('readline');

// // Array of columns to keep (indexes start at 0)
// const columnsToKeep = [0, 1, 3, 4, 5, 6, 8, 9, 14, 19, 24, 27, 31];

// // Read the input file line by line
// const rl = readline.createInterface({
//     input: fs.createReadStream('input.csv')
// });

// // Output the modified file
// const output = fs.createWriteStream('output.csv');

// rl.on('line', (line) => {
//     // Split the line into an array of values
//     const values = line.split(',');

//     // Keep only the values at the specified indexes
//     const keptValues = values.filter((_, i) => columnsToKeep.includes(i));

//     // Join the values into a single line and write to the output file
//     output.write(keptValues.join(',') + '\n');
// });

// rl.on('close', () => {
//     console.log('Done');
// });
// const fs = require('fs');
// const readline = require('readline');

// let lineCount = 0;
// let outputCount = 0;

// // Read the input file line by line
// const rl = readline.createInterface({
//     input: fs.createReadStream('output.csv')
// });

// // Output the modified file
// let output = fs.createWriteStream(`output-${outputCount}.csv`);

// rl.on('line', (line) => {
//     lineCount++;

//     // If the current file has reached the maximum number of lines,
//     // close it and open a new one
//     if (lineCount > 10000) {
//         lineCount = 0;
//         output.end();
//         outputCount++;
//         output = fs.createWriteStream(`output-${outputCount}.csv`);
//     }

//     // Write the line to the current output file
//     output.write(line + '\n');
// });

// rl.on('close', () => {
//     output.end();
//     console.log('Done');
// });

module.exports = app;
