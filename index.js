import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

const questionsArray = [
      "What aspect of today's workflow do you think went really well?",
      "Were there any processes today that you felt could be improved?",
      "How effective do you think our current task prioritization method is based on today's work?",
      "Did you notice any time of day when the team seemed most productive?",
      "Were there any tools or software that particularly helped or hindered your work today?",
      "How did you handle any distractions or interruptions you faced today?",
      "What was the most challenging task today, and how did you approach it?",
      "Is there anything about today's workflow that you would change for tomorrow?",
      "How well did you/we balance urgent tasks with ongoing projects today?",
      "How did your morning routine set you up for today's work?",
      "Were there any productivity techniques you tried today that you found effective or ineffective?",
      "How do you plan to unwind after work, and do you think it will be effective?",
      "How well did you manage work-life balance today?",
      "Did any of your recent habits positively impact your work today?",
      "How did your fitness or wellness routine affect your work performance?",
      "What part of the workday today did you enjoy the most?",
      "What was the biggest challenge you faced at work today?",
      "How did you adapt to any unexpected challenges or changes today?",
      "Did you notice any inefficient processes today that we could streamline?",
      "Were there any specific obstacles related to remote or hybrid work today?",
      "What kind of support or resources would have helped you with today’s roadblocks?",
      "How did you manage any stress or pressure experienced today?",
      "Please share how you overcame a significant challenge at work today?",
      "What problem-solving strategies did you use today, and how effective were they?",
      "What was the most frequent roadblock you encountered in your tasks today?",
      "What kept you motivated today?",
      "What did you accomplish today that you feel proud of?",
      "Can you share a specific success story from your work today?",
      "How did you or how should we celebrate today’s successes?",
      "What feedback did you receive today that helped you improve?",
      "What skills did you utilize today that contributed to your success?",
      "How did you work towards your professional goals today?",
      "Was there a project you worked on today that you found particularly rewarding?",
      "What piece of advice did you follow today that helped in your professional performance?",
      "How did you read or listen to something recently that positively influenced your work today?",
      "How did any hobbies or interests outside of work help you in your job today?",
      "Is there a new skill you wish you had today to make your work more effective?",
      "If you could have discussed today’s work with any historical figure, who would it be and why?",
      "What are you looking forward to at work tomorrow or in the coming days?",
      "Did any recent media (movies, TV shows) provide you with a new perspective or relaxation for today's work?",
      "If today's workday was a movie genre, what would it be and why?",
      "If you could have used a magic wand to solve any problem at work today, what would you have magically fixed?",
      "Imagine today’s tasks were a video game. Which level was the hardest to beat and why?",
      "If our team were a band, what would be the title of the song about today’s workday?",
      "If you could choose a superhero power to tackle today's challenges, what would it be and how would you use it?",
      "Which emoji best represents how you felt about today's work and why?",
      "What GIF best represents how you felt about today's work and why?",
      "If today’s workday was a dish at a restaurant, what would it be called and how spicy would it be?",
      "Pretend you're a sports commentator. How would you describe today's biggest accomplishment in an exciting play-by-play?",
      "If you could time travel and give one piece of advice to yourself at the start of the day, what would it be?",
      "Imagine our office is a sitcom. What funny or unexpected plot twist happened today?"
];

let currentRandomIndex = -1; // Initialize with an invalid index

// Function to check if it's time to show a notification (between 9 AM and 6 PM)
const checkNotificationTime = (randomNotificationHour) => {
  const currentHour = new Date().getHours();
  const startHour = 9; // 9 AM
  const endHour = 18; // 6 PM
  return currentHour >= startHour && currentHour <= endHour && currentHour === randomNotificationHour;
};


// Function to generate a random integer between min and max (inclusive)
const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to check if it's the next working day
const isNextWorkingDay = (currentDate) => {
  const day = currentDate.getDay();
  return day >= 1 && day <= 5; // Assuming Monday to Friday as working days
};

// Function to choose a random question and save it to Firestore
const chooseRandomQuestionAndSave = async (userId, randomIndex) => {
  try {
    // Get the question using the provided randomIndex
    const randomQuestion = questionsArray[randomIndex];
    console.log('randomQuestion:', randomQuestion);

    // Save the random question to Firestore
    await updateDoc(doc(firestore, 'users', userId), {
      randomQuestion: randomQuestion,
    });

    console.log(`Random question for user ${userId}: ${randomQuestion}`);
  } catch (error) {
    console.error('Error choosing random question and saving to Firestore:', error);
  }
};

// Function to update randomNotificationHour and isNotificationTime for all users
const updateNotificationTimes = async () => {
  try {
    // Fetch all users from Firestore
    const usersCollection = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);

    // Check if it's the next working day
    const currentDate = new Date();
    const isNextDay = isNextWorkingDay(currentDate);

    // If it's the next day, generate a new random notification hour
    if (currentRandomIndex === -1 || isNextDay) {
      currentRandomIndex = getRandomIntInclusive(0, questionsArray.length - 1);
    }

    // Choose a random question using the shared randomIndex
    const randomQuestion = questionsArray[currentRandomIndex];

    // Create an object to store updates for all users
    const usersUpdates = {};

    // Get the current server hour
    const currentHour = new Date().getHours();

    // Loop through each user document and add updates to the object
    usersSnapshot.docs.forEach((userDoc) => {
      const userId = userDoc.id;

      // Check if isSubmited is true
      if (userDoc.data().isSubmited) {
        return; // Skip to the next user if isSubmited is true
      }

      // Get the stored random notification hour for the user
      const storedRandomHour = userDoc.data().randomNotificationHour;

      // Use the stored random hour if it exists; otherwise, generate a new one
      const randomHour = storedRandomHour !== undefined ? storedRandomHour : getRandomIntInclusive(10, 16);

      // Update user document with the new randomNotificationHour, reset lastNotificationDate, and set isNotificationTime
      const isNotificationTime = currentHour === randomHour;
      usersUpdates[userId] = {
        randomNotificationHour: randomHour,
        lastNotificationDate: new Date(),
        isNotificationTime: isNotificationTime,
        randomQuestion: randomQuestion, // Set the same randomQuestion for all users
      };

      console.log(`Random notification hour for user ${userId}: ${randomHour}`);
    });

    // Update all users in a single call
    for (const userId in usersUpdates) {
      await updateDoc(doc(firestore, 'users', userId), usersUpdates[userId]);
    }

    console.log(`Random question for all users: ${randomQuestion}`);
  } catch (error) {
    console.error('Error updating notification times:', error);
  }
};

// Set up interval to run the updateNotificationTimes function every 10 minutes (adjust as needed)
setInterval(updateNotificationTimes, 10 * 60 * 1000);
//setInterval(updateNotificationTimes, 10000);
