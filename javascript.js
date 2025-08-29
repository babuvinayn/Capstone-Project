import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Your Firebase configuration goes here
// !!! WARNING: This is a security risk. In a real-world app, use environment variables.
const firebaseConfig = {
    apiKey: "AIzaSyCskC8FgXJxC48XzpCDRVmE9Kng2OyAbpk",
    authDomain: "open-curriculum-de09c.firebaseapp.com",
    projectId: "open-curriculum-de09c",
    storageBucket: "open-curriculum-de09c.appspot.com",
    messagingSenderId: "425347625827",
    appId: "1:425347625827:web:5603db72da26bfe87ad956",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get DOM elements
const placeholder = document.getElementById("placeholder");
const courseContentDiv = document.getElementById("courseContent");
const feedbackSection = document.getElementById("feedbackSection");
const rateUsBtn = document.getElementById("rateUsBtn");
const getCertificateBtn = document.getElementById("getCertificateBtn");
const saveFeedbackBtn = document.getElementById("saveFeedbackBtn");
const cancelBtn = document.getElementById("cancelBtn");
const loader = document.getElementById("loader");
const feedbackTextarea = document.getElementById("feedbackText");
const ratingOutput = document.getElementById("ratingOutput");
const stars = document.querySelectorAll(".star");

let timeSpent = 0;
let interval;
let currentRating = 0;

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    fetchCourseData();
    setupTimeTracker();
});

rateUsBtn.addEventListener("click", toggleFeedbackSection);
cancelBtn.addEventListener("click", toggleFeedbackSection);
saveFeedbackBtn.addEventListener("click", saveFeedback);
getCertificateBtn.addEventListener("click", getCertificate);

stars.forEach(star => {
    star.addEventListener("click", (e) => handleRating(e.target.id));
});

function handleRating(starId) {
    const rating = parseInt(starId.replace('star', ''), 10);
    currentRating = rating;
    ratingOutput.innerHTML = `Rating is: ${rating}/5`;

    stars.forEach(star => {
        const starNum = parseInt(star.id.replace('star', ''), 10);
        if (starNum <= rating) {
            star.classList.add("rated");
        } else {
            star.classList.remove("rated");
        }
    });

    localStorage.setItem("rating", rating);
}


// UI Toggling Functions
function toggleFeedbackSection() {
    const isVisible = feedbackSection.style.display === "block";
    feedbackSection.style.display = isVisible ? "none" : "block";
    rateUsBtn.style.display = isVisible ? "block" : "none";
    saveFeedbackBtn.style.display = isVisible ? "none" : "block";
    cancelBtn.style.display = isVisible ? "none" : "block";
}

// Data Fetching and Rendering
async function fetchCourseData() {
    placeholder.style.display = "block";
    try {
        const courseRef = doc(db, "Teachers", localStorage.getItem("tempDataId"), localStorage.getItem("tempCardId"), "Course");
        const docSnap = await getDoc(courseRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            renderCourseData(data);
            getCertificateBtn.style.display = "block"; // Show button after course loads
        } else {
            console.error("No course document found!");
            courseContentDiv.innerHTML = "<p class='text-danger text-center'>Course not found.</p>";
        }
    } catch (error) {
        console.error("Error fetching course data:", error);
        courseContentDiv.innerHTML = "<p class='text-danger text-center'>Error loading course data. Please try again later.</p>";
    } finally {
        placeholder.style.display = "none";
        courseContentDiv.style.display = "block";
    }
}

function renderCourseData(data) {
    courseContentDiv.innerHTML = `
        <div class="container">
            <h1>${data.courseName}</h1>
            <p>Category: ${data.courseCategory}</p>
            <div class="container border rounded-2 p-3">
                <div class="row">
                    <div class="col-md-8">
                        <h3>Description</h3>
                        <p style="text-align:justify">${data.courseDescription}</p>
                    </div>
                    <div class="col-md-4">
                        <h3>Details</h3>
                        <ul>
                            <li><strong>Duration:</strong> ${data.courseDuration}</li>
                            <li><strong>Difficulty:</strong> ${data.difficultyLevel}</li>
                            <li><strong>Prerequisites:</strong> ${data.prerequisites}</li>
                            <li><strong>Instructor(s):</strong> ${data.instructorNames}</li>
                            <li><strong>Resources:</strong> ${data.resources}</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="container border rounded-2 p-3 mt-3">
                <h3>Course Content</h3>
                ${data.description}
            </div>
            <div class="border rounded-2 p-3 mt-3">
                <h3>Lecture Materials</h3>
                <ul>
                    <li><a href="#">Lecture 1 - ${data.lectureMaterials}</a></li>
                    <li><a href="#">Lecture 2 - Title</a></li>
                </ul>
            </div>
            <div class="container border rounded-2 p-3 mt-3">
                <h3>Video Content</h3>
                <div class="embed-responsive embed-responsive-16by9">
                    <iframe class="embed-responsive-item" width="560" height="315" src="${data.videoContent}" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    `;
}

// Feedback Submission
async function saveFeedback() {
    loader.style.display = "block";
    saveFeedbackBtn.style.display = "none";
    cancelBtn.style.display = "none";
    
    const feedbackData = {
        [`suggestion_${Date.now()}`]: feedbackTextarea.value,
        [`rating_${Date.now()}`]: localStorage.getItem("rating") || currentRating
    };

    try {
        const docRef = doc(db, "Teachers", localStorage.getItem("tempDataId"), localStorage.getItem("tempCardId"), "Course", "CourseFeedback", "Rating&Feedback");
        await setDoc(docRef, feedbackData, { merge: true });
        alert("Thank you for your feedback!"); // Consider a better notification
        window.location.replace("studentDashboard.html");
    } catch (error) {
        console.error("Error saving feedback:", error);
        alert("Failed to save feedback. Please try again."); // Consider a better notification
    } finally {
        loader.style.display = "none";
        toggleFeedbackSection();
    }
}

// Time Tracking
function setupTimeTracker() {
    timeSpent = parseInt(localStorage.getItem('elapsedTime') || 0, 10);
    startTimer();

    window.onbeforeunload = saveTimeAndClearInterval;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveTimeAndClearInterval();
        } else if (document.visibilityState === 'visible') {
            startTimer();
        }
    });
}

function startTimer() {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        timeSpent++;
        localStorage.setItem('elapsedTime', timeSpent.toString());
        // For production, you might want to save to DB less frequently (e.g., every 60 seconds)
        // setTimeSpend(); 
    }, 1000);
}

function saveTimeAndClearInterval() {
    if (interval) clearInterval(interval);
    setTimeSpend();
}

async function setTimeSpend() {
    const courseName = localStorage.getItem("tempCardId");
    const timeSpendData = {
        [courseName]: timeSpent.toString()
    };
    try {
        const docRef = doc(db, "Student", localStorage.getItem("dataId"), "EnrolledCourseTimeSpend", "TimeSpend");
        await setDoc(docRef, timeSpendData, { merge: true });
        console.log("Time saved successfully.");
    } catch (error) {
        console.error('Error saving time: ', error);
    }
}

// Certificate Logic (Needs to be implemented)
function getCertificate() {
    alert("Certificate feature coming soon! Check back after completing the course.");
}