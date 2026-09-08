const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const dataFile = path.join(__dirname, "data.json");

const subjects = ["ASDD", "AISC", "SMLD", "WMAD"];

const students = [
  { id: 1, name: "Aditi Sharma" },
  { id: 2, name: "Aman Patil" },
  { id: 3, name: "Priya Joshi" },
  { id: 4, name: "Rahul More" },
  { id: 5, name: "Shruti Sanap" },
  { id: 6, name: "Vedant Kulkarni" }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function loadData() {
  if (!fs.existsSync(dataFile)) {
    return {
      assignments: [],
      submissions: [],
      attendance: []
    };
  }

  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  return {
    assignments: data.assignments || [],
    submissions: data.submissions || [],
    attendance: data.attendance || []
  };
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.get("/api/students", (req, res) => {
  res.json(students);
});

app.post("/api/assignments", (req, res) => {
  const { title, subject, dueDate } = req.body;

  if (!title || !subject || !dueDate) {
    return res.status(400).json({
      message: "Title, subject, and due date are required."
    });
  }

  if (!subjects.includes(subject)) {
    return res.status(400).json({
      message: "Invalid subject."
    });
  }

  const data = loadData();

  const assignment = {
    id: Date.now(),
    title,
    subject,
    dueDate,
    status: "Active"
  };

  data.assignments.push(assignment);
  saveData(data);

  res.status(201).json(assignment);
});

app.get("/api/assignments", (req, res) => {
  const data = loadData();
  res.json(data.assignments);
});

app.patch("/api/assignments/:id/status", (req, res) => {
  const assignmentId = Number(req.params.id);
  const { status } = req.body;

  if (!["Active", "Closed"].includes(status)) {
    return res.status(400).json({
      message: "Status must be Active or Closed."
    });
  }

  const data = loadData();

  const assignment = data.assignments.find(
    (item) => item.id === assignmentId
  );

  if (!assignment) {
    return res.status(404).json({
      message: "Assignment was not found."
    });
  }

  assignment.status = status;
  saveData(data);

  res.json({
    message: "Assignment status updated successfully.",
    assignment
  });
});

app.get("/api/assignments/:id/student-statuses", (req, res) => {
  const assignmentId = Number(req.params.id);
  const data = loadData();

  const assignment = data.assignments.find(
    (item) => item.id === assignmentId
  );

  if (!assignment) {
    return res.status(404).json({
      message: "Assignment was not found."
    });
  }

  const studentStatuses = students.map((student) => {
    const submission = data.submissions.find(
      (item) =>
        item.assignmentId === assignmentId &&
        item.studentId === student.id
    );

    return {
      studentId: student.id,
      studentName: student.name,
      status: submission ? submission.status : "Not Submitted"
    };
  });

  res.json({
    assignment,
    students: studentStatuses
  });
});

app.put("/api/assignments/:id/student-statuses", (req, res) => {
  const assignmentId = Number(req.params.id);
  const { studentId, status } = req.body;
  const data = loadData();

  const assignment = data.assignments.find(
    (item) => item.id === assignmentId
  );

  if (!assignment) {
    return res.status(404).json({
      message: "Assignment was not found."
    });
  }

  if (assignment.status === "Closed") {
    return res.status(400).json({
      message: "This assignment is closed."
    });
  }

  const student = students.find((item) => item.id === Number(studentId));

  if (!student) {
    return res.status(404).json({
      message: "Student was not found."
    });
  }

  if (!["Submitted", "Not Submitted"].includes(status)) {
    return res.status(400).json({
      message: "Invalid submission status."
    });
  }

  const existingSubmission = data.submissions.find(
    (item) =>
      item.assignmentId === assignmentId &&
      item.studentId === Number(studentId)
  );

  if (existingSubmission) {
    existingSubmission.status = status;
    existingSubmission.updatedAt = new Date().toLocaleString();
  } else {
    data.submissions.push({
      id: Date.now(),
      assignmentId,
      studentId: Number(studentId),
      studentName: student.name,
      assignmentTitle: assignment.title,
      subject: assignment.subject,
      status,
      updatedAt: new Date().toLocaleString()
    });
  }

  saveData(data);

  res.json({
    message: "Student submission status updated successfully."
  });
});

app.get("/api/attendance", (req, res) => {
  const { subject, date } = req.query;

  if (!subject || !date) {
    return res.status(400).json({
      message: "Subject and date are required."
    });
  }

  const data = loadData();

  const attendanceList = students.map((student) => {
    const attendanceRecord = data.attendance.find(
      (item) =>
        item.subject === subject &&
        item.date === date &&
        item.studentId === student.id
    );

    return {
      studentId: student.id,
      studentName: student.name,
      status: attendanceRecord ? attendanceRecord.status : "Not Marked"
    };
  });

  res.json({
    subject,
    date,
    students: attendanceList
  });
});

app.put("/api/attendance", (req, res) => {
  const { subject, date, studentId, status } = req.body;

  if (!subjects.includes(subject)) {
    return res.status(400).json({
      message: "Invalid subject."
    });
  }

  if (!date || !studentId || !["Present", "Absent"].includes(status)) {
    return res.status(400).json({
      message: "Date, student, and valid attendance status are required."
    });
  }

  const student = students.find((item) => item.id === Number(studentId));

  if (!student) {
    return res.status(404).json({
      message: "Student was not found."
    });
  }

  const data = loadData();

  const existingAttendance = data.attendance.find(
    (item) =>
      item.subject === subject &&
      item.date === date &&
      item.studentId === Number(studentId)
  );

  if (existingAttendance) {
    existingAttendance.status = status;
    existingAttendance.updatedAt = new Date().toLocaleString();
  } else {
    data.attendance.push({
      id: Date.now(),
      subject,
      date,
      studentId: Number(studentId),
      studentName: student.name,
      status,
      updatedAt: new Date().toLocaleString()
    });
  }

  saveData(data);

  res.json({
    message: "Attendance updated successfully."
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("App running at http://localhost:3000");
  });
}

module.exports = app;