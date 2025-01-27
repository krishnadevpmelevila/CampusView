var express = require('express');
var router = express.Router();
const Assessment = require('../models/assessmentSchema');
const multer = require('multer');
const User = require('../models/userSchema');
const upload = multer(); // Initialize multer
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticateToken = require('../middlewares/auth');

/* GET home page. */
router.get('/', authenticateToken, function (req, res, next) {
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

    res.json({ message: 'Login successful!' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});
router.post('/logout', (req, res) => {
  // Clear the cookie named 'token'
  res.clearCookie('token', { path: '/' }); // Ensure the path matches the cookie's path
  res.redirect('/login');
});

router.post('/submit', upload.none(), async (req, res) => {
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

