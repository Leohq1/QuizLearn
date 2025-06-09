const firebaseConfig = {
  apiKey: "AIzaSyCVsUF-ZT_8lrRQ3fy3f4b8_5CUy0KAfJs",
  authDomain: "quizlearn-f8d05.firebaseapp.com",
  projectId: "quizlearn-f8d05",
  storageBucket: "quizlearn-f8d05.firebasestorage.app",
  messagingSenderId: "203617705229",
  appId: "1:203617705229:web:91dc07b1fa0b1467686444",
  measurementId: "G-Y8NGV2D4Q9"
};

// Initialize Firebase (using the global 'firebase' object from the compat SDK)
firebase.initializeApp(firebaseConfig);

// Get a reference to the Firestore service (using the global 'firebase' object)
const db = firebase.firestore();

// --- Rest of your quiz.js code (unchanged from previous correct version) ---
const QUIZ_DOCUMENT_ID = 'wF4qEndHY4E2nsjNvJ2r'; // <--- CHANGE THIS to your quiz document ID

let loadedQuestions = [];

async function getQuestionsFromQuiz(quizId) {
  try {
    console.log("Attempting to fetch quiz with ID:", quizId);
    const quizDoc = await db.collection('quizes').doc(quizId).get(); 

    if (!quizDoc.exists) {
      console.warn("No such quiz document exists with ID:", quizId);
      return [];
    }

    const quizData = quizDoc.data();
    console.log("Fetched quiz data:", quizData);

    if (quizData && quizData.questions && Array.isArray(quizData.questions)) {
      console.log("Found questions array:", quizData.questions);
      loadedQuestions = quizData.questions;
      return loadedQuestions;
    } else {
      console.warn("Quiz document does not contain a 'questions' array or it's not an array.");
      return [];
    }
  } catch (error) {
    console.error("Error getting questions from quiz:", error);
    return [];
  }
}

async function displayQuiz() {
  const quizForm = document.getElementById('quiz-form');
  quizForm.innerHTML = '<p>Loading quiz...</p>';

  const questions = await getQuestionsFromQuiz(QUIZ_DOCUMENT_ID);

  if (questions.length === 0) {
    quizForm.innerHTML = '<p>No questions found for this quiz.</p>';
    return;
  }

  quizForm.innerHTML = '';

  questions.forEach((question, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');

    const questionText = document.createElement('p');
    questionText.textContent = `${index + 1}. ${question.questionText}`;
    questionDiv.appendChild(questionText);

    const optionsDiv = document.createElement('div');
    optionsDiv.classList.add('options');

    if (question.options && Array.isArray(question.options)) {
      question.options.forEach((option, optionIndex) => {
        const label = document.createElement('label');
        label.classList.add('option-block');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `question_${index}`;
        input.value = option;

        label.appendChild(input);
        label.appendChild(document.createTextNode(` ${option}`));
        optionsDiv.appendChild(label);
      });
    }
    questionDiv.appendChild(optionsDiv);
    quizForm.appendChild(questionDiv);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.id = 'submit-btn';
  submitBtn.textContent = 'Submit';
  quizForm.appendChild(submitBtn);

  const resultP = document.createElement('p');
  resultP.id = 'result';
  quizForm.appendChild(resultP);

  quizForm.addEventListener("submit", handleQuizSubmission);
}

async function handleQuizSubmission(event) {
  event.preventDefault();

  const resultElement = document.getElementById("result");
  const form = event.target;
  let allCorrect = true;
  let answersCount = 0;
  let correctAnswersCount = 0;

  resultElement.textContent = "Checking answers...";
  resultElement.style.color = "gray";

  loadedQuestions.forEach((question, index) => {
    const questionName = `question_${index}`;
    const selectedOption = form.querySelector(`input[name="${questionName}"]:checked`);

    if (!selectedOption) {
      allCorrect = false;
      console.warn(`Question ${index + 1} was not answered.`);
      return;
    }

    answersCount++;
    const userAnswer = selectedOption.value;
    const correctAnswer = question.correctAnswer;

    if (userAnswer === correctAnswer) {
      correctAnswersCount++;
    } else {
      allCorrect = false;
    }
  });

  if (answersCount === 0) {
      resultElement.textContent = "Please answer at least one question.";
      resultElement.style.color = "orange";
      return;
  }

  if (answersCount < loadedQuestions.length) {
    resultElement.textContent = `You answered ${answersCount} out of ${loadedQuestions.length} questions. You got ${correctAnswersCount} correct. Please answer all questions to get full feedback.`;
    resultElement.style.color = "orange";
  } else {
    if (allCorrect) {
      resultElement.textContent = `🎉 Congratulations! You got all ${correctAnswersCount} questions correct!`;
      resultElement.style.color = "green";
    } else {
      resultElement.textContent = `You got ${correctAnswersCount} out of ${loadedQuestions.length} questions correct. Keep practicing!`;
      resultElement.style.color = "red";
    }
  }
}

document.addEventListener('DOMContentLoaded', displayQuiz);