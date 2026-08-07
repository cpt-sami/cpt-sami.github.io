import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.options import Options
import json


OUTPUT_FILE = "courses.json"

# initiate a list of dictionaries containing all courses
course_encyclopedia = []

def save_progress():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(course_encyclopedia, f, indent=2, ensure_ascii=False)

url = "https://ttb.utoronto.ca/"

# options = Options()
# options.add_argument("--headless")

driver = webdriver.Firefox()
driver.get(url)

wait = WebDriverWait(driver, timeout=10)


# select all departments
division_dropdown = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, "#division-combo-top-container"))
)

division_dropdown.click()

divisions = driver.find_elements(By.CSS_SELECTOR, "#division-combo-bottom-container .ttb-option")

for division in divisions:
    division.click()

division_dropdown.click()

time.sleep(0.5)


# click the search button
search = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, ".btn.btn-primary"))
)

search.click()

time.sleep(1)

# loop while the next button is clickable
while True:
    time.sleep(1)

    # find location of all the course buttons
    courses = driver.find_elements(By.CSS_SELECTOR, ".accordion-button")
    for course in courses:

        # initiate the course dictionary
        course_dictionary = {}

        # open the course, and return it's info
        course.click()
        time.sleep(1)

        # Save the course name to the dictionary
        course_dictionary["Course Name"] = course.text


        wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".course-action .toggle-class"))
        ).click()

        labels = driver.find_elements(By.CSS_SELECTOR, ".accordion-body label")
        values = driver.find_elements(By.CSS_SELECTOR, ".accordion-body label ~ span, .accordion-body label ~ div")
        lectures = driver.find_elements(By.CSS_SELECTOR, ".course-section .header")
        j=0
        i_was = 1000

        lecture_list = []
        lecture_dictionary = None
        for i in range(len(labels)):
            label = labels[i].text
            value = values[i].text.replace('\n', ' ').replace('Room Information available on ACORN', '')
            if label == "Day/Time":
                if lecture_dictionary is not None:
                    lecture_list.append(lecture_dictionary)
                lecture_dictionary={"Lecture Code": lectures[j].text}
                j += 1
                lecture_dictionary[label] = value
            elif lecture_dictionary is not None:
                lecture_dictionary[label] = value
            else:
                course_dictionary[label] = value

        if lecture_dictionary is not None:
            lecture_list.append(lecture_dictionary)

        course_dictionary["Lectures"] = lecture_list

        # close the course
        course.click()

        course_encyclopedia.append(course_dictionary)
        save_progress()
        time.sleep(1)

    # find the next button
    next = driver.find_elements(By.CSS_SELECTOR, "ngb-pagination .page-item:not(.active):not(.disabled) [aria-label='Next']")
    if not next:
        break
    next[0].click()

time.sleep(1)

# switch sessions
session_dropdown = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, "#session-combo-top-container"))
)
session_dropdown.click()

sessions = driver.find_elements(By.CSS_SELECTOR, "#session app-ttb-checkbox:not(.checked)")

for session in sessions:
    session.click()

# click the search button
search = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, ".btn.btn-primary"))
)

search.click()


time.sleep(1)

# loop while the next button is clickable
while True:
    time.sleep(1)

    # find location of all the course buttons
    courses = driver.find_elements(By.CSS_SELECTOR, ".accordion-button")
    for course in courses:

        # initiate the course dictionary
        course_dictionary = {}

        # Save the course name to the dictionary
        course_dictionary["Course Name"] = course.text

        # open the course, and return it's info
        course.click()
        time.sleep(1)

        wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".course-action .toggle-class"))
        ).click()

        labels = driver.find_elements(By.CSS_SELECTOR, ".accordion-body label")
        values = driver.find_elements(By.CSS_SELECTOR, ".accordion-body label ~ span, .accordion-body label ~ div")
        lectures = driver.find_elements(By.CSS_SELECTOR, ".course-section .header")
        j=0
        i_was = 1000

        lecture_list = []
        lecture_dictionary = None
        for i in range(len(labels)):
            label = labels[i].text
            value = values[i].text.replace('\n', ' ').replace('Room Information available on ACORN', '')
            if label == "Day/Time":
                if lecture_dictionary is not None:
                    lecture_list.append(lecture_dictionary)
                lecture_dictionary={"Lecture Code": lectures[j].text}
                j += 1
                lecture_dictionary[label] = value
            elif lecture_dictionary is not None:
                lecture_dictionary[label] = value
            else:
                course_dictionary[label] = value

        if lecture_dictionary is not None:
            lecture_list.append(lecture_dictionary)

        course_dictionary["Lectures"] = lecture_list

        # close the course
        course.click()

        course_encyclopedia.append(course_dictionary)
        save_progress()
        time.sleep(1)

    # find the next button
    next = driver.find_elements(By.CSS_SELECTOR, "ngb-pagination .page-item:not(.active):not(.disabled) [aria-label='Next']")
    if not next:
        break
    next[0].click()




time.sleep(2)

driver.quit()
