const subjects = ["ASDD", "AISC", "SMLD", "WMAD"];

const subjectSummary = document.getElementById("subjectSummary");
const reportContent = document.getElementById("reportContent");

async function getAssignmentStudentRecords(assignment) {
  const response = await fetch(
    `/api/assignments/${assignment.id}/student-statuses`
  );

  const result = await response.json();

  return {
    assignment,
    students: result.students || []
  };
}

async function loadReports() {
  const response = await fetch("/api/assignments");
  const assignments = await response.json();

  const reports = {};

  for (const subject of subjects) {
    const subjectAssignments = assignments.filter(
      (assignment) => assignment.subject === subject
    );

    reports[subject] = await Promise.all(
      subjectAssignments.map(getAssignmentStudentRecords)
    );
  }

  showSummary(reports);
  showSubjectReports(reports);
}

function showSummary(reports) {
  subjectSummary.innerHTML = "";

  subjects.forEach((subject) => {
    const subjectAssignments = reports[subject];

    let submitted = 0;
    let notSubmitted = 0;

    subjectAssignments.forEach((report) => {
      report.students.forEach((student) => {
        if (student.status === "Submitted") {
          submitted++;
        } else {
          notSubmitted++;
        }
      });
    });

    subjectSummary.innerHTML += `
      <article class="summary-card ${subject.toLowerCase()}">
        <h2>${subject}</h2>
        <p>Assignments: ${subjectAssignments.length}</p>
        <span class="count">${submitted} Submitted</span>
        <p>${notSubmitted} Not Submitted</p>
      </article>
    `;
  });
}

function showSubjectReports(reports) {
  reportContent.innerHTML = "";

  subjects.forEach((subject) => {
    const subjectAssignments = reports[subject];

    let subjectHtml = `
      <section class="subject-report">
        <div class="subject-report-header">
          <h3>${subject} Student List</h3>
          <span>${subjectAssignments.length} Assignment(s)</span>
        </div>
    `;

    if (subjectAssignments.length === 0) {
      subjectHtml += `
        <div class="no-assignment">
          No ${subject} assignments have been created yet.
        </div>
      `;
    }

    subjectAssignments.forEach((report) => {
      const submittedCount = report.students.filter(
        (student) => student.status === "Submitted"
      ).length;

      const notSubmittedCount = report.students.length - submittedCount;

      subjectHtml += `
        <article class="assignment-report">
          <h4>${report.assignment.title}</h4>
          <p>
            Due: ${report.assignment.dueDate} ·
            Status: ${report.assignment.status || "Active"}
          </p>

          <div class="report-counts">
            <span class="report-count report-submitted">
              ${submittedCount} Submitted
            </span>
            <span class="report-count report-not-submitted">
              ${notSubmittedCount} Not Submitted
            </span>
          </div>

          <table class="student-report-table">
            <thead>
              <tr>
                <th>Student name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
      `;

      report.students.forEach((student) => {
        const statusClass =
          student.status === "Submitted"
            ? "submitted-text"
            : "not-submitted-text";

        subjectHtml += `
          <tr>
            <td>${student.studentName}</td>
            <td class="${statusClass}">${student.status}</td>
          </tr>
        `;
      });

      subjectHtml += `
            </tbody>
          </table>
        </article>
      `;
    });

    subjectHtml += `</section>`;
    reportContent.innerHTML += subjectHtml;
  });
}

loadReports();