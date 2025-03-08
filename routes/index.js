var express = require('express');
var router = express.Router();
const Assessment = require('../models/assessmentSchema');
const multer = require('multer');
const User = require('../models/userSchema');
const upload = multer(); // Initialize multer
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticateToken = require('../middlewares/auth');
const calculateAssessment = require('../utils/calculateAssessment');
const AssessmentRecord = require('../models/assessmentRecordsSchema');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('/dashboard');
});
router.get('/assessment-tools', authenticateToken, function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/login', function (req, res, next) {
  res.render('login')
})
router.get('/register', function (req, res, next) {
  res.render('register')
})

router.post('/register', upload.none(), async (req, res) => {
  console.log(req.body);

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Check if the username already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Generate a JWT token for the new user
    const token = jwt.sign(
      { username: newUser.email }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: '1h' } // Token expiration time
    );

    res.status(201).json({ token, message: 'User registered successfully!' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { email: user.email }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: '1h' } // Token expiration time
    );

    // Set the token in an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    // Add the token to the response headers
    res.setHeader('Authorization', `Bearer ${token}`);

    res.redirect('/')
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});
router.get('/logout', (req, res) => {
  // Clear the cookie named 'token'
  res.clearCookie('token', { path: '/' }); // Ensure the path matches the cookie's path
  res.redirect('/login');
});
router.get("/get-filtered-assessment-data",authenticateToken, async (req, res) => {
  try {
    const { branch, semester, subject, courseCode, batch, numCOs, numPOs, numPSOs, faculty, assessmentYear } = req.query;

    // Build query object dynamically
    const query = {};
    if (branch) query.branch = branch;
    if (semester) query.semester = semester;
    if (subject) query.subject = subject;
    if (courseCode) query.courseCode = courseCode;
    if (batch) query.batch = batch;
    if (numCOs) query.numCOs = numCOs;
    if (numPOs) query.numPOs = numPOs;
    if (numPSOs) query.numPSOs = numPSOs;
    if (faculty) query.facultyName = faculty;
    if (assessmentYear) query.assessmentYear = assessmentYear;

    // Fetch assessments based on query filters
    const assessments = await Assessment.find(query);

    // Format Data as Required
    const formattedData = {
      tools: assessments.flatMap(assessment =>
        assessment.tools.map(tool => ({
          name: tool.toolName,
          questions: tool.questions.map((q, index) => ({
            id: `Q${index + 1}`, // Auto-generate Q1, Q2, etc.
            co: q.coNumber,
            blooms: q.bloomsTaxonomy,
            maxMarks: parseInt(q.maxMarks, 10) || 0
          }))
        }))
      )
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching filtered assessment data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// API to get all unique dropdown values
router.get("/get-dropdown-data",authenticateToken, async (req, res) => {
  try {
    // Fetch unique values for dropdowns
    const branches = await Assessment.distinct("branch");

    // Fetch branch-wise mapping of data
    const branchData = await Assessment.aggregate([
      {
        $group: {
          _id: "$branch",
          semesters: { $addToSet: "$semester" },
          subjects: { $addToSet: "$subject" },
          courseCodes: { $addToSet: "$courseCode" },
          batches: { $addToSet: "$batch" },
          numCOs: { $addToSet: "$numCOs" },
          numPOs: { $addToSet: "$numPOs" },
          numPSOs: { $addToSet: "$numPSOs" },
          assessmentYears: { $addToSet: "$assessmentYear" },
          faculty: { $addToSet: "$facultyName" },
        },
      },
    ]);

    res.json({ branches, branchData });
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post('/submit',authenticateToken, upload.none(), async (req, res) => {



  try {
    if (!req.body.tool || !Array.isArray(req.body.tool) || req.body.tool.length === 0) {
      return res.status(400).json({ message: "Invalid assessment tools data." });
    }

    // Utility function to ensure arrays are properly formatted
    const parseArray = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      return Object.values(data); // Convert object to array (Fixes multer issue)
    };

    const finalData = {
      branch: req.body.branch || "",
      subject: req.body.subject || "",
      semester: req.body.semester || "",
      courseCode: req.body.courseCode || "",
      batch: req.body.batch || "",
      numCOs: req.body.numCOs || 0,
      numStudents: req.body.numStudents || 0,
      numPOs: req.body.numPOs || 0,
      numPSOs: req.body.numPSOs || 0,
      universityExam: req.body.universityExam || "No",
      assessmentYear: req.body.assessmentYear || "Unknown",
      facultyName: req.body.facultyName || "Unknown",
      tools: req.body.tool.map((tool, index) => {
        const questions = parseArray(req.body.questions?.[index]);
        const coNumbers = parseArray(req.body.coNumber?.[index]);
        const bloomsTaxonomy = parseArray(req.body.bloomsTaxonomy?.[index]);
        const maxMarks = parseArray(req.body.maxMarks?.[index]);

        return {
          toolName: tool,
          questions: questions.map((q, i) => ({
            questionNumber: q || "N/A",
            coNumber: coNumbers[i] || "N/A",
            bloomsTaxonomy: bloomsTaxonomy[i] || "N/A",
            maxMarks: maxMarks[i] || "0",
          })),
        };
      }),
    };

    // Save to MongoDB
    try {
      const newAssessment = new Assessment(finalData);
      await newAssessment.save();

      console.log("Final Data Saved:", JSON.stringify(finalData, null, 2));
      res.status(201).json({ message: "Data successfully saved!" });
    } catch (error) {
      console.error("Error saving data:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }

  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});
router.get('/attaintmentCalculation',authenticateToken, function (req, res) {
  res.render('assessment')
})


router.get('/calculate-assessment/:assessmentId',authenticateToken, async (req, res) => {
  const { assessmentId } = req.params;
  const result = await calculateAssessment(assessmentId);
  res.json(result);
});


router.get("/dashboard", authenticateToken,function (req, res) {
  // from all assessment records count all students 

  
  res.render("home");
})

router.get("/student-data", authenticateToken,function (req, res) {
  res.render("step2");
})
router.post("/step2", authenticateToken,async function (req, res) {
  try {
    const data = req.body;
    console.log(data);
    
    if (!data || !data.students) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    // Convert students object into an array
    const students = Object.values(data.students).map((student) => ({
      name: student.name,
      roll: student.roll,
      tools: Object.entries(student.tools).map(([toolName, toolData]) => ({
        toolName: toolName,
        questions: toolData.questions.map((q) => ({
          questionNumber: q.questionId,
          coNumber: q.co,
          bloomsTaxonomy: q.blooms,
          maxMarks: q.maxMarks,
          marksObtained: q.marksObtained, // Store marks obtained
        })),
      })),
    }));

    // Create and save in AssessmentRecords collection
    const assessmentRecord = new AssessmentRecord({
      branch: data.branch,
      subject: data.subject,
      semester: data.semester,
      courseCode: data.courseCode.trim(),
      batch: data.batch,
      numCOs: data.numCOs || "N/A",
      numStudents: data.numStudents || students.length.toString(), // Auto count students
      numPOs: data.numPOs || "N/A",
      numPSOs: data.numPSOs || "N/A",
      universityExam: data.universityExam || "N/A",
      assessmentYear: data.assessmentYear || "N/A",
      facultyName: data.facultyName || "N/A",
      students: students, // Store student data
    });

    await assessmentRecord.save(); // Save to MongoDB

    res.status(201).json({ message: "Assessment record saved successfully!" });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/attainment', authenticateToken,async (req, res) => {
  try {
      const { semester, batch, courseCode } = req.query;

      // Step 1: Fetch the relevant assessment
      // const assessment = await AssessmentRecord.findOne({ semester, batch, courseCode });
      // fetch only latest
      const assessment = await AssessmentRecord.findOne({ semester,batch, courseCode }).sort({ createdAt: -1 });

      if (!assessment) {
          return res.status(404).json({ message: "Assessment not found" });
      }

      // Step 2: Process student marks grouped by CO
      const studentMarks = {};

      assessment.students.forEach(student => {
          studentMarks[student.roll] = {
              name: student.name,
              roll: student.roll,
              marksByCO: {},
              totalMarksByCO: {},
              percentageByCO: {}
          };

          student.tools.forEach(tool => {
              tool.questions.forEach(question => {
                  const co = question.coNumber;
                  const obtainedMarks = parseFloat(question.marksObtained) || 0;
                  const maxMarks = parseFloat(question.maxMarks) || 0;

                  if (!studentMarks[student.roll].marksByCO[co]) {
                      studentMarks[student.roll].marksByCO[co] = 0;
                      studentMarks[student.roll].totalMarksByCO[co] = 0;
                  }

                  studentMarks[student.roll].marksByCO[co] += obtainedMarks;
                  studentMarks[student.roll].totalMarksByCO[co] += maxMarks;
              });
          });

          // Step 3: Calculate Percentage for each CO
          Object.keys(studentMarks[student.roll].marksByCO).forEach(co => {
              const obtained = studentMarks[student.roll].marksByCO[co];
              const total = studentMarks[student.roll].totalMarksByCO[co];
              studentMarks[student.roll].percentageByCO[co] = total > 0 ? ((obtained / total) * 100).toFixed(2) : 0;
          });
      });

      return res.json({ students: Object.values(studentMarks) });

  } catch (error) {
      console.error("Error fetching attainment data:", error);
      res.status(500).json({ message: "Server Error" });
  }
});
module.exports = router;

