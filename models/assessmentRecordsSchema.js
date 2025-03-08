const mongoose = require("mongoose");

// Define Question Schema (Includes marks obtained)
const QuestionSchema = new mongoose.Schema({
  questionNumber: String,
  coNumber: String,
  bloomsTaxonomy: String,
  maxMarks: String,
  marksObtained: String, // <-- Added field
});

// Define Tool Schema (Each tool has questions)
const ToolSchema = new mongoose.Schema({
  toolName: String,
  questions: [QuestionSchema],
});

// Define Student Schema (Each student has their tools)
const StudentSchema = new mongoose.Schema({
  name: String,
  roll: String,
  tools: [ToolSchema],  
});

// Define Assessment Schema (Includes students)
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
  students: [StudentSchema], // <-- Added students here
});
// Assessment Records Schema
const AssessmentRecordsSchema = new mongoose.Schema({
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
  students: [StudentSchema], // Store student data separately
  createdAt: { type: Date, default: Date.now } // Timestamp for records
});

const AssessmentRecords = mongoose.model("AssessmentRecords", AssessmentRecordsSchema);
module.exports = AssessmentRecords;