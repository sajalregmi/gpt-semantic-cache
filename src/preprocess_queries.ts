import fs from 'fs';
import path = require('path');
import dotenv from 'dotenv';

dotenv.config();
const filePath = path.resolve(__dirname, 'QA_Automotive.json');


function preprocessQueries() {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;
    
        // Split the data into lines
        const lines = data.trim().split('\n');
        const jsonData = [];
    
        // Process each line
        for (const line of lines) {
          try {
            // Preprocess the line to make it valid JSON
            let correctedLine = line
              .replace(/'/g, '"') // Replace single quotes with double quotes
              .replace(/u"([^"]*)"/g, '"$1"'); // Remove the 'u' prefix from strings
    
            const jsonObject = JSON.parse(correctedLine);
            jsonData.push(jsonObject);
          } catch (parseError) {
            console.error('Error parsing JSON line:', parseError);
          }
        }
    
        // Process the first 100 items
        const processedData = [];
        for (let i = 0; i < Math.min(100, jsonData.length); i++) {
          const item = jsonData[i];
          const asin = item.asin;
          const questions = [];
    
          if (item.questions && Array.isArray(item.questions)) {
            for (const question of item.questions) {
              if (question.questionText) {
                const questionEntry = {
                  question: question.questionText,
                  answers: []
                };
    
                if (question.answers && Array.isArray(question.answers)) {
                  for (const answer of question.answers) {
                    if (answer.answerText) {
                      questionEntry.answers.push(answer.answerText);
                    }
                  }
                }
    
                questions.push(questionEntry);
              }
            }
          }
    
          // Add the data to the processedData array
          processedData.push({
            asin: asin,
            questions: questions
          });
        }
    
        // Display the processed data
        console.log(JSON.stringify(processedData, null, 2));
    
        // Optionally, write the result to a new JSON file
        fs.writeFile('processedData.json', JSON.stringify(processedData, null, 2), (err) => {
          if (err) throw err;
          console.log('Processed data has been saved to processedData.json');
        });
      });
}
