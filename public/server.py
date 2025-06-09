# server.py
from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Set up Gemini
genai.configure(api_key="AIzaSyDCBXUSXr1opnK9hj3wJ8p0ukO32BGzK1E") # Use your actual API key here
model = genai.GenerativeModel("gemini-2.0-flash")

@app.route("/get-feedback", methods=["POST"])
def get_feedback():
    data = request.json
    # The frontend sends quizData as an array of objects
    quiz_data_from_frontend = data.get("quizData")

    if not quiz_data_from_frontend:
        return jsonify({"error": "No quizData provided"}), 400

    # This will store a list of dictionaries, each containing feedback for a question
    detailed_feedback = []

    for i, item in enumerate(quiz_data_from_frontend): # Use enumerate to get the index of each question
        question_text = item.get("questionText")
        user_answer = item.get("userAnswer")
        correct_answer = item.get("correctAnswer")

        ai_feedback_text = ""
        is_correct = (user_answer == correct_answer) # Determine correctness for potential frontend use

        if is_correct:
            prompt = (
                f"The user answered correctly.\n"
                f"Question: {question_text}\n"
                f"User's answer: {user_answer}\n"
                f"Correct answer: {correct_answer}\n"
                f"Explain why this is correct in simple terms, and concisely give some extra/helpful info."
            )
        else:
            prompt = (
                f"The user answered incorrectly.\n"
                f"Question: {question_text}\n"
                f"User's answer: {user_answer}\n"
                f"Correct answer: {correct_answer}\n"
                f"Explain why the user's answer was wrong and why the correct answer is right, concisely."
            )

        try:
            response = model.generate_content(prompt)
            ai_feedback_text = response.text
        except Exception as e:
            # If there's an error for a specific question, note it
            ai_feedback_text = f"Error generating AI feedback for this question: {str(e)}"
            print(f"Error for question '{question_text}': {e}") # Log error on server side

        # Store feedback for this specific question as a dictionary
        detailed_feedback.append({
            "questionIndex": i, # Include the index to help the frontend target the correct div
            "questionText": question_text, # Keep question text for debugging/clarity
            "userAnswer": user_answer,
            "correctAnswer": correct_answer,
            "isCorrect": is_correct, # Useful for styling on the frontend
            "aiFeedback": ai_feedback_text
        })

    # Return the list of detailed feedback dictionaries
    return jsonify({"feedback": detailed_feedback})

if __name__ == "__main__":
    app.run(debug=True)