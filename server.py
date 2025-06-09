# server.py
from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Set up Gemini
genai.configure(api_key="AIzaSyDCBXUSXr1opnK9hj3wJ8p0ukO32BGzK1E")
model = genai.GenerativeModel("gemini-2.0-flash")  # use "gemini-2.0-pro" if you want, both work

@app.route("/get-feedback", methods=["POST"])
def get_feedback():
    data = request.json
    user_answer = data.get("userAnswer")
    correct_answer = "Paris"
    question = "What is the capital of France?"

    if user_answer == correct_answer:
        prompt = f"The user answered correctly.\nQuestion: {question}\nAnswer: {correct_answer}\nExplain why this is correct in simple terms."
    else:
        prompt = f"The user answered incorrectly.\nQuestion: {question}\nUser's answer: {user_answer}\nCorrect answer: {correct_answer}\nExplain why the user's answer is wrong and why the correct answer is right."

    try:
        response = model.generate_content(prompt)
        return jsonify({"feedback": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
