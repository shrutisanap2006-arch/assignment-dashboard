const assignmentForm = document.getElementById("assignmentForm");
const submissionForm = document.getElementById("submissionForm");
const assignmentList = document.getElementById("assignmentList");
const submissionList = document.getElementById("submissionList");
const assignmentSelect = document.getElementById("assignmentId");

async function loadAssignments() {
  const response = await fetch("/api/assignments");
  const assignments = await response.json();

  assignmentList.innerHTML = "";
  assignmentSelect.innerHTML = `<option value="">Choose an assignment</option>`;

  assignments.forEach((assignment) => {
    assignmentList.innerHTML += `<li>${assignment.title} — Due: ${assignment.dueDate}</li>`;
    assignmentSelect.innerHTML += `<option value="${assignment.id}">${assignment.title}</option>`;
  });
}

async function loadSubmissions() {
  const response = await fetch("/api/submissions");
  const submissions = await response.json();

  submissionList.innerHTML = "";

  submissions.forEach((submission) => {
    submissionList.innerHTML += `<li>${submission.studentName} — ${submission.status}</li>`;
  });
}

assignmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await fetch("/api/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("title").value,
      dueDate: document.getElementById("dueDate").value
    })
  });

  assignmentForm.reset();
  loadAssignments();
});

submissionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await fetch("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignmentId: assignmentSelect.value,
      studentName: document.getElementById("studentName").value
    })
  });

  submissionForm.reset();
  loadSubmissions();
});

loadAssignments();
loadSubmissions();