import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  FlatList,
  TextInput,
  Keyboard,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import EmojiKeyboard from 'rn-emoji-keyboard';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const flatListRef = useRef();
  const currentUser = auth().currentUser;
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => auth().signOut()}>
          <Text style={{ color: 'red', marginRight: 15, fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const fetchedMessages = snapshot.docs.map(doc => {
          const firebaseData = doc.data();
          return {
            id: doc.id,
            text: firebaseData.text,
            createdAt: firebaseData.createdAt.toDate(),
            user: firebaseData.user,
          };
        });
        setMessages(fetchedMessages);
      });

    return () => unsubscribe();
  }, []);

  const onSend = useCallback(() => {
    if (text.trim().length === 0) return;

    const newMessage = {
      text,
      createdAt: new Date(),
      user: {
        _id: currentUser.uid,
        name: currentUser.email,
        avatar: 'https://placekitten.com/140/140',
      },
    };

    firestore().collection('chats').add(newMessage);
    setText('');
    Keyboard.dismiss();
  }, [text, currentUser]);

  const renderItem = ({ item }) => {
    const isCurrentUser = item.user._id === currentUser.uid;
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.messageRight : styles.messageLeft,
        ]}
      >
        <Text style={[styles.messageText, { color: isCurrentUser ? '#fff' : '#000' }]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={{ padding: 10 }}
      />

      <View style={styles.inputRow}>
        <TouchableOpacity onPress={() => setShowEmojiPicker(true)}>
          <Icon name="emoji-emotions" size={28} color="#666" style={{ marginHorizontal: 5 }} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
          multiline
        />
        <TouchableOpacity onPress={onSend} style={styles.sendButton}>
          <Icon name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <EmojiKeyboard
        onEmojiSelected={emoji => setText(prev => prev + emoji.emoji)}
        open={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageContainer: {
    maxWidth: '75%',
    marginVertical: 4,
    padding: 10,
    borderRadius: 10,
  },
  messageLeft: {
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  messageRight: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#ddd',
    textAlign: 'right',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 8,
  },
});

export default ChatScreen;
