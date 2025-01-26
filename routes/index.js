var express = require('express');
var router = express.Router();
const Assessment = require('../models/assessmentSchema');
const multer = require('multer');

const upload = multer(); // Initialize multer

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/submit',upload.none(), async (req, res) => {
  try {
    // console.log(req.body);
    const finalData = {
      branch: req.body.branch,
      subject: req.body.subject,
      semester: req.body.semester,
      courseCode: req.body.courseCode,
      batch: req.body.batch,
      numCOs: req.body.numCOs,
      numStudents: req.body.numStudents,
      numPOs: req.body.numPOs,
      numPSOs: req.body.numPSOs,
      universityExam: req.body.universityExam,
      assessmentYear: req.body.assessmentYear,
      facultyName: req.body.facultyName,
      tools: (req.body.tool || []).map((tool, index) => {
        const questionsPerTool = Math.floor(req.body.questions.length / req.body.tool.length);
        const start = index * questionsPerTool;
        const end = start + questionsPerTool;

        return {
          toolName: tool,
          questions: req.body.questions.slice(start, end).map((_, i) => ({
            questionNumber: req.body.questions[start + i],
            coNumber: req.body.coNumber[start + i],
            bloomsTaxonomy: req.body.bloomsTaxonomy[start + i],
            maxMarks: req.body.maxMarks[start + i],
          })),
        };
      }),
    };

    // Save the finalData to MongoDB
    const newAssessment = new Assessment(finalData);
    await newAssessment.save();

    console.log("Final Data Saved:", JSON.stringify(finalData, null, 2));
    res.status(201).json({ message: "Data successfully saved!" });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.get("/step2", function (req, res) {
  res.render("step2");
})
router.post("/step2", function (req, res) {
  const data = req.body;
  console.log(data);

  res.send(data)
})
module.exports = router;

