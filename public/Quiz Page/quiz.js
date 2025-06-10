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

// --- Rest of your quiz.js code ---
const QUIZ_DOCUMENT_ID = 'wF4qEndHY4E2nsjNvJ2r'; 

// Algebra Quiz: QuXdfitxKgAPYtKOoGMS
// World's Capitals Quiz doc Id: wF4qEndHY4E2nsjNvJ2r

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
    questionDiv.id = `question-container-${index}`; // Assign a unique ID to each question container

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
        input.name = `question_${index}`; // Use a unique name for each question's radio buttons
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

  // --- Start of existing quiz logic for checking answers ---
  loadedQuestions.forEach((question, index) => {
    const questionName = `question_${index}`;
    const selectedOption = form.querySelector(`input[name="${questionName}"]:checked`);

    if (!selectedOption) {
      allCorrect = false;
      console.warn(`Question ${index + 1} was not answered.`);
      return; // Skip if not answered for scoring purposes
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

  // Display initial scoring feedback
  if (answersCount < loadedQuestions.length) {
    resultElement.textContent = `You answered ${answersCount} out of ${loadedQuestions.length} questions. You got ${correctAnswersCount} correct. Please answer all questions to get full feedback.`;
    resultElement.style.color = "orange";
  } else {
    if (allCorrect) {
      resultElement.textContent = `🎉 Congratulations! You got all ${correctAnswersCount} questions correct!`;
      resultElement.style.color = "green";
    } else {
      resultElement.textContent = `You got ${correctAnswersCount} out of ${loadedQuestions.length} questions correct. Now, let's get some AI feedback!`;
      resultElement.style.color = "red";
    }
  }

  // --- Flask server integration for AI feedback ---
  // If the user answered all questions, proceed to get AI feedback
  if (answersCount === loadedQuestions.length) {
    // Update main result message to show AI feedback is loading
    resultElement.textContent = `You got ${correctAnswersCount} out of ${loadedQuestions.length} questions correct. Thinking... 🤖 Getting AI feedback...`;
    resultElement.style.color = "gray";

    // IMPORTANT: Clear any previously displayed AI feedback for individual questions
    // This prevents duplicated feedback if the user submits multiple times
    document.querySelectorAll('.ai-feedback-per-question').forEach(el => el.remove());

    // Collect all user answers to send to the backend
    const userAnswers = loadedQuestions.map((question, index) => {
      const questionName = `question_${index}`;
      const selectedOption = form.querySelector(`input[name="${questionName}"]:checked`);
      return {
        questionText: question.questionText,
        userAnswer: selectedOption ? selectedOption.value : null,
        correctAnswer: question.correctAnswer
      };
    });

    try {
      const response = await fetch("http://localhost:5000/get-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ quizData: userAnswers })
      });

      const data = await response.json();

      // After fetching, revert resultElement to previous score, or show general status
      if (allCorrect) {
        resultElement.textContent = `🎉 Congratulations! You got all ${correctAnswersCount} questions correct!`;
        resultElement.style.color = "green";
      } else {
        resultElement.textContent = `You got ${correctAnswersCount} out of ${loadedQuestions.length} questions correct. Scroll up for AI feedback!`;
        resultElement.style.color = "red";
      }


      if (data.feedback && Array.isArray(data.feedback)) {
        // Iterate through the array of feedback objects from the backend
        data.feedback.forEach(item => {
          const questionIndex = item.questionIndex;      // Get the index of the question
          const aiFeedbackText = item.aiFeedback;        // Get the actual feedback text
          const isCorrect = item.isCorrect;              // Get correctness for styling

          // Find the corresponding question div using its ID (from displayQuiz)
          const questionDiv = document.getElementById(`question-container-${questionIndex}`);

          if (questionDiv) {
            const feedbackP = document.createElement('p');
            feedbackP.classList.add('ai-feedback-per-question'); // Add a class for styling and easy removal

            // Add 'correct' or 'incorrect' class based on the feedback from the backend
            if (isCorrect) {
              feedbackP.classList.add('correct');
            } else {
              feedbackP.classList.add('incorrect');
            }

            // Set the innerHTML using the actual AI feedback text
            feedbackP.innerHTML = `<strong>AI Feedback:</strong> ${aiFeedbackText}`;
            questionDiv.appendChild(feedbackP); // Append to the specific question's div
          } else {
            console.warn(`Could not find question div with ID 'question-container-${questionIndex}'.`);
          }
        });
      } else {
        // This block handles cases where 'data.feedback' is not an array (e.g., an error from backend)
        resultElement.innerHTML = resultElement.innerHTML + "<br><br>⚠️ No structured AI response. Backend error or unexpected format.";
        resultElement.style.color = "red";
        console.warn("Backend response did not contain structured feedback or was empty:", data);
      }
    } catch (error) {
      console.error("Fetch error contacting Python server:", error);
      resultElement.innerHTML = resultElement.innerHTML + "<br><br>❌ Error contacting Python server.";
      resultElement.style.color = "red";
    }
  }
}

document.addEventListener('DOMContentLoaded', displayQuiz);