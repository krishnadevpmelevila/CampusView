const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionNumber: String,
  coNumber: String,
  bloomsTaxonomy: String,
  maxMarks: String,
});

const ToolSchema = new mongoose.Schema({
  toolName: String,
  questions: [QuestionSchema],
});

const AssessmentSchema = new mongoose.Schema({
  branch: String,
  subject: String,
  semester: String,
  courseCode: String,
  batch: String,
  numCOs: String,
  numStudents: String,
  numPOs: String,
  numPSOs: String,
  universityExam: String,
  assessmentYear: String,
  facultyName: String,
  tools: [ToolSchema],
});

const Assessment = mongoose.model('Assessment', AssessmentSchema);

module.exports = Assessment;