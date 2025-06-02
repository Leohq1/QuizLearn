// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// Import your service account key file
const serviceAccount = require('./serviceAccountKey.json');

// Import your quiz data JSON file
const quizzesData = require('./quiz_data.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get a reference to the Firestore database
const db = admin.firestore();

// Define the collection names
const mainCollectionName = 'quizes'; // Collection for quiz documents
const quizLibraryCollectionName = 'quizLibrary'; // Collection for quiz library index

// Function to upload data
async function uploadQuizzesAndQuestions() {
  console.log(`Starting upload to collection: ${mainCollectionName}...`);

  if (!Array.isArray(quizzesData)) {
    console.error("Error: quizzesData is not an array. Please check your JSON file format.");
    return;
  }

  let batch = db.batch();
  let writeCountInBatch = 0;
  const batchSize = 450; // Adjusted for two writes per quiz
  let totalQuizzesWritten = 0;
  let totalLibraryEntriesWritten = 0;
  let totalQuestionsEmbedded = 0;
  let totalUpdates = 0; // Keep track of updates
  let totalInserts = 0;

  try {
    for (const quiz of quizzesData) {
      if (!quiz.title || !Array.isArray(quiz.questions)) {
        console.warn("Skipping an item in JSON: Missing 'title' or 'questions' array.", quiz);
        continue;
      }

      const quizTitle = quiz.title;

      // --- Write/Update the main Quiz document ---
      const quizDocRef = db.collection(mainCollectionName).doc(); //gets a new doc ref.
      const quizId = quizDocRef.id;

      // Prepare data for the main quiz document
      const quizDocumentData = {
        title: quizTitle,
        description: quiz.description || '',
        questions: quiz.questions,
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add a timestamp
      };

      // --- Write/Update Quiz Library document ---
      const quizLibraryDocRef = db.collection(quizLibraryCollectionName).doc(quizId);
      const quizLibraryDocumentData = {
        title: quizTitle,
        description: quiz.description || '',
        quizId: quizId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Check if a document with the same title exists in main collection
      const existingQuizDoc = await db.collection(mainCollectionName)
        .where('title', '==', quizTitle)
        .limit(1)
        .get();

      if (!existingQuizDoc.empty) {
        // Update existing main quiz document
        const existingDocRef = existingQuizDoc.docs[0].ref;
        await existingDocRef.update(quizDocumentData); // update instead of set.
        writeCountInBatch++;
        totalUpdates++;
        totalQuestionsEmbedded += quiz.questions.length;

         // Update the corresponding quizLibrary document.
         await quizLibraryDocRef.set(quizLibraryDocumentData);
         writeCountInBatch++;
         totalLibraryEntriesWritten++;

        console.log(`Quiz with title "${quizTitle}" updated.`);
      } else {
        // Create new main quiz document
        batch.set(quizDocRef, quizDocumentData);
        writeCountInBatch++;
        totalInserts++;
        totalQuizzesWritten++;
        totalQuestionsEmbedded += quiz.questions.length;

        // Create new quizLibrary document
        batch.set(quizLibraryDocRef, quizLibraryDocumentData);
        writeCountInBatch++;
        totalLibraryEntriesWritten++;
        console.log(`Quiz with title "${quizTitle}" created.`);
      }


      if (writeCountInBatch >= batchSize) {
        await batch.commit();
        console.log(`Batch committed (${writeCountInBatch} writes). Starting a new batch.`);
        batch = db.batch();
        writeCountInBatch = 0;
      }
    }

    if (writeCountInBatch > 0) {
      await batch.commit();
      console.log(`Final batch committed (${writeCountInBatch} writes).`);
    }

    console.log('--------------------------------------');
    console.log('Quiz and Library data upload complete!');
    console.log(`Total Quiz documents written (new): ${totalQuizzesWritten}`);
    console.log(`Total Quiz documents updated: ${totalUpdates}`);
    console.log(`Total Library Entry documents written: ${totalLibraryEntriesWritten}`);
    console.log(`Total Questions embedded across all quizzes: ${totalQuestionsEmbedded}`);
    console.log('--------------------------------------');

  } catch (error) {
    console.error('Error uploading data:', error);
  }
}

// Run the upload function
uploadQuizzesAndQuestions();
