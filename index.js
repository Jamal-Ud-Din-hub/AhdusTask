/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

LogBox.ignoreAllLogs();

const requestPermission = async () => {
  const res = await notifee.requestPermission();
};

requestPermission();

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await notifee.displayNotification({
    title: remoteMessage.notification?.title,
    body: remoteMessage.notification?.body,
    android: {
      channelId: 'default',
    },
  });
});

AppRegistry.registerComponent(appName, () => App);
