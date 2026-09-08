const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let assignments = [];
let submissions = [];

// Add an assignment
app.post("/api/assignments", (req, res) => {
  const { title, dueDate } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ message: "Title and due date are required." });
  }

  const assignment = {
    id: assignments.length + 1,
    title,
    dueDate
  };

  assignments.push(assignment);
  res.status(201).json(assignment);
});

// View assignments
app.get("/api/assignments", (req, res) => {
  res.json(assignments);
});

// Submit an assignment
app.post("/api/submissions", (req, res) => {
  const { assignmentId, studentName } = req.body;

  if (!assignmentId || !studentName) {
    return res.status(400).json({ message: "Assignment and student name are required." });
  }

  const submission = {
    id: submissions.length + 1,
    assignmentId: Number(assignmentId),
    studentName,
    status: "Submitted"
  };

  submissions.push(submission);
  res.status(201).json(submission);
});

// View all submissions
app.get("/api/submissions", (req, res) => {
  res.json(submissions);
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("App running at http://localhost:3000");
  });
}

module.exports = app;