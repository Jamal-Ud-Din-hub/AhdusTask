import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/loginScreen';
import SignupScreen from './src/screens/signupScreen';
import ChatScreen from './src/screens/chatScreen';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(async user => {
      setUser(user);
      if (user) {
        await saveFcmToken(user);
      }
      if (initializing) setInitializing(false);
    });

    createNotificationChannel();

    const unsubscribeMsg = messaging().onMessage(onMessageReceived);

    // Token refresh listener
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
      if (user) {
        await firestore().collection('users').doc(user.uid).set({ fcmToken: token }, { merge: true });
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMsg();
      unsubscribeTokenRefresh();
    };
  }, [initializing, user]);

  const saveFcmToken = async (currentUser) => {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken && currentUser) {
        await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .set({ fcmToken }, { merge: true });
        console.log('FCM token saved:', fcmToken);
      }
    } catch (error) {
      console.error('Failed to save FCM token:', error);
    }
  };

  const onMessageReceived = async (remoteMessage) => {
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: {
        channelId: 'default',
      },
    });
  };

  const createNotificationChannel = async () => {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
  };

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={"#000"} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? 'Chat' : 'Login'}
        screenOptions={{ headerShown: true }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <Stack.Screen name="Chat" component={ChatScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
