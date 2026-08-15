import * as admin from 'firebase-admin';
import config from '../config';

let firebaseApp: admin.app.App | null = null;

export const initFirebase = () => {
  if (config.firebase.serviceAccountPath) {
    try {
      const serviceAccount = require(config.firebase.serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  } else {
    console.warn('Firebase serviceAccountPath is not configured. Push notifications will be disabled.');
  }
};

export const getFirebaseApp = () => firebaseApp;

export const sendPushNotification = async (token: string, payload: admin.messaging.MessagingPayload) => {
  if (!firebaseApp) {
    console.warn('Firebase not initialized. Cannot send push notification.');
    return;
  }

  try {
    const response = await admin.messaging().sendToDevice(token, payload);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
