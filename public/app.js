const assignmentForm = document.getElementById("assignmentForm");
const assignmentList = document.getElementById("assignmentList");
const assignmentNotifications = document.getElementById("assignmentNotifications");

const recordSubject = document.getElementById("recordSubject");
const recordAssignmentId = document.getElementById("recordAssignmentId");
const studentRecordMessage = document.getElementById("studentRecordMessage");
const studentTable = document.getElementById("studentTable");
const studentTableBody = document.getElementById("studentTableBody");

const attendanceSubject = document.getElementById("attendanceSubject");
const attendanceDate = document.getElementById("attendanceDate");
const attendanceMessage = document.getElementById("attendanceMessage");
const attendanceTable = document.getElementById("attendanceTable");
const attendanceTableBody = document.getElementById("attendanceTableBody");

const toast = document.getElementById("toast");

let assignments = [];

attendanceDate.value = new Date().toISOString().split("T")[0];

function isDueSoon(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);
  const daysRemaining = Math.ceil((due - today) / 86400000);

  return daysRemaining >= 0 && daysRemaining <= 3;
}

function showToast(message) {
  toast.textContent = `✓ ${message}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

async function loadAssignments() {
  const response = await fetch("/api/assignments");
  assignments = await response.json();

  renderAssignments();
  renderAssignmentNotifications();
}

function renderAssignments() {
  assignmentList.innerHTML = "";

  if (assignments.length === 0) {
    assignmentList.innerHTML =
      `<li class="empty-message">No assignments created yet.</li>`;
    return;
  }

  assignments.forEach((assignment) => {
    const assignmentStatus = assignment.status || "Active";
    const dueSoon = isDueSoon(assignment.dueDate);

    assignmentList.innerHTML += `
      <li class="assignment-item">
        <div>
          <strong>${assignment.title}</strong>
          <span class="due-date">
            ${assignment.subject} · Due: ${assignment.dueDate}
          </span>
        </div>

        <div class="assignment-tags">
          <span class="status-badge ${assignmentStatus.toLowerCase()}">
            ${assignmentStatus}
          </span>
          ${dueSoon ? `<span class="due-soon-badge">Due soon</span>` : ""}
        </div>
      </li>
    `;
  });
}

function renderAssignmentNotifications() {
  assignmentNotifications.innerHTML = "";

  if (assignments.length === 0) {
    assignmentNotifications.innerHTML =
      `<p class="empty-message">No assignment notifications yet.</p>`;
    return;
  }

  assignments.forEach((assignment) => {
    const assignmentStatus = assignment.status || "Active";
    const dueSoon = isDueSoon(assignment.dueDate);

    assignmentNotifications.innerHTML += `
      <div class="notification-item">
        <div>
          <strong>${assignment.title}</strong>
          <span>${assignment.subject} · Due: ${assignment.dueDate}</span>
          ${dueSoon ? `<small class="warning-text">Due soon</small>` : ""}
        </div>

        <select
          class="assignment-status-select"
          data-assignment-id="${assignment.id}"
        >
          <option value="Active" ${assignmentStatus === "Active" ? "selected" : ""}>
            Active
          </option>
          <option value="Closed" ${assignmentStatus === "Closed" ? "selected" : ""}>
            Closed
          </option>
        </select>
      </div>
    `;
  });
}

function loadAssignmentsForSubject() {
  const selectedSubject = recordSubject.value;

  recordAssignmentId.innerHTML = "";
  studentTableBody.innerHTML = "";
  studentTable.style.display = "none";

  if (!selectedSubject) {
    recordAssignmentId.disabled = true;
    recordAssignmentId.innerHTML =
      `<option value="">Select a subject first</option>`;
    studentRecordMessage.textContent =
      "Select a subject and assignment to view students.";
    studentRecordMessage.style.display = "block";
    return;
  }

  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.subject === selectedSubject &&
      (assignment.status || "Active") === "Active"
  );

  if (activeAssignments.length === 0) {
    recordAssignmentId.disabled = true;
    recordAssignmentId.innerHTML =
      `<option value="">No active assignment available</option>`;
    studentRecordMessage.textContent =
      `No active ${selectedSubject} assignment is available.`;
    studentRecordMessage.style.display = "block";
    return;
  }

  recordAssignmentId.disabled = false;

  activeAssignments.forEach((assignment) => {
    recordAssignmentId.innerHTML += `
      <option value="${assignment.id}">${assignment.title}</option>
    `;
  });

  loadStudentRecords();
}

async function loadStudentRecords() {
  const assignmentId = recordAssignmentId.value;

  if (!assignmentId) {
    return;
  }

  const response = await fetch(
    `/api/assignments/${assignmentId}/student-statuses`
  );

  const result = await response.json();

  if (!response.ok) {
    studentRecordMessage.textContent = result.message;
    studentRecordMessage.style.display = "block";
    studentTable.style.display = "none";
    return;
  }

  studentTableBody.innerHTML = "";

  result.students.forEach((student) => {
    const submittedClass =
      student.status === "Submitted" ? "selected-submitted" : "";

    const notSubmittedClass =
      student.status === "Not Submitted" ? "selected-not-submitted" : "";

    studentTableBody.innerHTML += `
      <tr>
        <td><strong>${student.studentName}</strong></td>
        <td>
          <div class="status-actions">
            <button
              class="status-button submitted-button ${submittedClass}"
              data-student-id="${student.studentId}"
              data-status="Submitted"
            >
              Submitted
            </button>

            <button
              class="status-button not-submitted-button ${notSubmittedClass}"
              data-student-id="${student.studentId}"
              data-status="Not Submitted"
            >
              Not Submitted
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  studentRecordMessage.style.display = "none";
  studentTable.style.display = "table";
}

async function loadAttendance() {
  const subject = attendanceSubject.value;
  const date = attendanceDate.value;

  attendanceTableBody.innerHTML = "";
  attendanceTable.style.display = "none";

  if (!subject || !date) {
    attendanceMessage.textContent =
      "Select a subject and date to mark attendance.";
    attendanceMessage.style.display = "block";
    return;
  }

  const response = await fetch(
    `/api/attendance?subject=${encodeURIComponent(subject)}&date=${date}`
  );

  const result = await response.json();

  if (!response.ok) {
    attendanceMessage.textContent = result.message;
    attendanceMessage.style.display = "block";
    return;
  }

  result.students.forEach((student) => {
    const presentClass =
      student.status === "Present" ? "selected-present" : "";

    const absentClass =
      student.status === "Absent" ? "selected-absent" : "";

    attendanceTableBody.innerHTML += `
      <tr>
        <td>
          <strong>${student.studentName}</strong>
          <span class="attendance-status-text">${student.status}</span>
        </td>
        <td>
          <div class="status-actions">
            <button
              class="status-button present-button ${presentClass}"
              data-student-id="${student.studentId}"
              data-attendance-status="Present"
            >
              Present
            </button>

            <button
              class="status-button absent-button ${absentClass}"
              data-student-id="${student.studentId}"
              data-attendance-status="Absent"
            >
              Absent
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  attendanceMessage.style.display = "none";
  attendanceTable.style.display = "table";
}

assignmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const response = await fetch("/api/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("title").value,
      subject: document.getElementById("subject").value,
      dueDate: document.getElementById("dueDate").value
    })
  });

  if (!response.ok) {
    alert("Please complete all assignment details.");
    return;
  }

  assignmentForm.reset();
  await loadAssignments();
  showToast("Assignment created as Active.");
});

assignmentNotifications.addEventListener("change", async (event) => {
  const select = event.target.closest(".assignment-status-select");

  if (!select) {
    return;
  }

  const response = await fetch(
    `/api/assignments/${select.dataset.assignmentId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: select.value })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    alert(result.message);
    return;
  }

  await loadAssignments();

  if (recordSubject.value) {
    loadAssignmentsForSubject();
  }

  showToast(`Assignment changed to ${select.value}.`);
});

recordSubject.addEventListener("change", loadAssignmentsForSubject);
recordAssignmentId.addEventListener("change", loadStudentRecords);

studentTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest(".status-button");

  if (!button || !button.dataset.status) {
    return;
  }

  const response = await fetch(
    `/api/assignments/${recordAssignmentId.value}/student-statuses`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: button.dataset.studentId,
        status: button.dataset.status
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    alert(result.message);
    return;
  }

  showToast(`Student marked as ${button.dataset.status}.`);
  loadStudentRecords();
});

attendanceSubject.addEventListener("change", loadAttendance);
attendanceDate.addEventListener("change", loadAttendance);

attendanceTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest(".status-button");

  if (!button || !button.dataset.attendanceStatus) {
    return;
  }

  const response = await fetch("/api/attendance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: attendanceSubject.value,
      date: attendanceDate.value,
      studentId: button.dataset.studentId,
      status: button.dataset.attendanceStatus
    })
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.message);
    return;
  }

  showToast(`Attendance marked as ${button.dataset.attendanceStatus}.`);
  loadAttendance();
});

loadAssignments();