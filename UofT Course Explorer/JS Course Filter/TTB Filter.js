// Translation key for HTML to JSON
const fieldToJsonKey = {
    courseName: "Course Name",
    department: "Department:",
    facultyDivision: "Faculty / Division:",
    session: "Session",
    campus: "Campus",
    deliveryMode: "Delivery Mode",
    instructors: "Instructor(s)",
    lectures: "Lectures",
    firstTermDayTime: "First Term\nDay/Time",
    firstTermLocation: "First Term\nLocation",
    creditValue: "Credit Value:",
    preRequisites: "Pre-requisites:",
    coRequisites: "Co-requisites:",
    exclusions: "Exclusions:",
    recommendedPreparation: "Recommended Preparation:",
    description: "Description:",
    enrolmentControls: "Enrolment Controls",
    availability: "Availability",
    waitlist: "Waitlist",
    secondTermDayTime: "Second Term\nDay/Time",
    secondTermLocation: "Second Term\nLocation",
    architectureBreadthCategory: "Architecture Breadth Category:",
    artsScienceBreadthCategory: "Arts & Science Breadth Category:",
    engineeringElectiveCategory: "Engineering Elective Category:",
    utmDistributionCategory: "University of Toronto Mississauga Distribution Category:",
    utscBreadthCategory: "University of Toronto Scarborough Breadth Category:",
    note: "Note:",
    notes: "Notes:"
};


// Code to get user input
function courseFilterObjectMaker() {
    const formData = new FormData(document.getElementById("courseForm"));
    const values = Object.fromEntries(formData.entries());
    const courseObject = {};
    for (let field in values) {
        if (!field.endsWith('Toggle')) {
            courseObject[field] = [values[field], values[field+'Toggle'], 0];
        }
    };
    return courseObject
};

function lectureFilterObjectMaker() {
    const formData = new FormData(document.getElementById("lectureForm"));
    const values = Object.fromEntries(formData.entries());
    const lectureObject = {};
    for (let field in values) {
        if (!field.endsWith('Toggle')) {
            lectureObject[field] = [values[field], values[field+'Toggle'], 1];
        }
    };
    return lectureObject;
};


// Code to load course json
let course_list = [];
async function loadCourses() {
  try {
    const response = await fetch('../Scraped Data/Mined courses.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    course_list = await response.json();
    console.log(`Loaded ${course_list.length} courses`);
  } catch (err) {
    console.error('Could not load course data:', err);
  }
}
loadCourses();


// Code to check whether a course passes the filters
function fieldIs(course, field, query) {
    const jsonKey = fieldToJsonKey[field];
    return (course[jsonKey] || "").toLowerCase() === query.toLowerCase();
}

function fieldContains(course, field, query) {
    const jsonKey = fieldToJsonKey[field];
    return (course[jsonKey] || "").toLowerCase().includes(query.toLowerCase());
}

function isFieldTruthy(course, field, queryObject) {
    return queryObject[field][1] ? fieldIs(course, field, queryObject[field][0]): fieldContains(course, field, queryObject[field][0]);
}

function isCourseTruthy(queryObject, course) {
    for (let depth in queryObject) {
        for (let field in queryObject[depth]){
            if (depth === '1'){
                if (!course.Lectures.some((lecture) => isFieldTruthy(lecture, field, queryObject[depth]))) {
                    return false;
                }
            } else {
                if (!isFieldTruthy(course, field, queryObject[depth])) {
                    return false;
                }
            }
        }
    }
    return true
}

function filterCourses(queryObject, courses = course_list) {
    return courses.filter((course) => isCourseTruthy(queryObject, course));
}


// Code to render course accordions
function labelFor(field) {
    return field.endsWith(":") ? field : `${field}:`;
}

function renderCourses(courses) {
    const container = document.getElementById("results");
    if (!container) {
        console.error("No element with id 'results' found in the page.");
        return;
    }
    container.innerHTML = "";

    courses.forEach((course) => {
        const details = document.createElement("details");
        details.className = "course-item";

        const summary = document.createElement("summary");
        summary.textContent = course["Course Name"];
        details.appendChild(summary);

        const body = document.createElement("div");
        body.className = "course-body";

        for (const field in course) {
            if (field === "Course Name" || field === "Lectures") continue;
            const p = document.createElement("p");
            p.innerHTML = `<strong>${labelFor(field)}</strong> ${course[field]}`;
            body.appendChild(p);
        }

        course.Lectures.forEach((lecture, i) => {
            const lectureDetails = document.createElement("details");
            lectureDetails.className = "lecture-item";

            const lectureSummary = document.createElement("summary");
            lectureSummary.textContent = `Lecture ${i + 1}`;
            lectureDetails.appendChild(lectureSummary);

            for (const field in lecture) {
                const p = document.createElement("p");
                p.innerHTML = `<strong>${labelFor(field)}</strong> ${lecture[field]}`;
                lectureDetails.appendChild(p);
            }

            body.appendChild(lectureDetails);
        });

        details.appendChild(body);
        container.appendChild(details);
    });
}


// Code to listen for a click, and run the above functions.
document.getElementById("submit").onclick = function() {
    const courseObject = courseFilterObjectMaker();
    const lectureObject = lectureFilterObjectMaker();
    const queryObject = {0: courseObject, 1:lectureObject};
    const coursesToRender = filterCourses(queryObject);
    renderCourses(coursesToRender)
};
