// this file location will have to be changed before pushing website
const course_list = fetch('Mined courses.json').then(res => res.json());
let courses = [];

// fetches Mined courses.json
async function loadCourses() {
  try {
    const response = await fetch('Mined courses.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    courses = await response.json();
    console.log(`Loaded ${courses.length} courses`);
  } catch (err) {
    console.error('Could not load course data:', err);
  }
}

loadCourses();

// maybe an empty strict field should require that that field exists?
function fieldIs(course, field, query) {
  return (course[field] || "").toLowerCase() === (query.toLowerCase());
}

function fieldContains(course, field, query) {
  return (course[field] || "").toLowerCase().includes(query.toLowerCase());
}

// queryObject should be an object formatted like {field: ['query', boolean]} where boolean = True implies a strict filter, False implies an inclusion filter.
function isCourseTruthy(queryObject, course) {
    for (let field in course) {
        // I'm using a ternary operator aren't I so smart?!
        let isFieldTruthy = queryObject[field][1] ? fieldIs(course, field, queryObject[field][0]): fieldContains(course, field, queryObject[field][0]);
        if (!isFieldTruthy) {
            return false
        }
    }
    return true
}


function filterCourses(queryObject, courses = course_list) {
    return courses.filter((course) => isCourseTruthy(queryObject, course));
}

