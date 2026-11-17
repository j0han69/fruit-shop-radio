import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '../components/Screen';
import { colors } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';
import { ChatMessage } from '../types';

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    author: 'Марина',
    text: 'Отличный трек для начала вечера!',
    time: '21:14',
  },
  {
    id: '2',
    author: 'Алексей',
    text: 'Привет из Петербурга 👋',
    time: '21:16',
  },
  {
    id: '3',
    author: 'Анна, ведущая',
    text: 'Привет всем! Оставайтесь на связи — дальше ещё интереснее.',
    time: '21:18',
  },
];

export function ChatScreen() {
  const { language, t } = useLanguage();
  // TODO: подключить WebSocket/бэкенд
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    const message: ChatMessage = {
      id: `local-${Date.now()}`,
      author: t('you'),
      text,
      time: new Date().toLocaleTimeString(language, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((currentMessages) => [...currentMessages, message]);
    setDraft('');
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.id.startsWith('local-');

    return (
      <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
        <View style={[styles.avatar, isOwnMessage && styles.ownAvatar]}>
          <Text style={styles.avatarText}>{item.author.charAt(0)}</Text>
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageMeta}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <View style={[styles.bubble, isOwnMessage && styles.ownBubble]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{t('chatEyebrow')}</Text>
            <Text style={styles.title}>{t('chatTitle')}</Text>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{t('online')}</Text>
          </View>
        </View>

        <FlatList
          contentContainerStyle={styles.messagesList}
          data={messages}
          keyExtractor={(item) => item.id}
          ref={listRef}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.composer}>
          <TextInput
            maxLength={500}
            multiline
            onChangeText={setDraft}
            onSubmitEditing={sendMessage}
            placeholder={t('chatPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.accent}
            style={styles.input}
            value={draft}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('send')}
            disabled={!draft.trim()}
            onPress={sendMessage}
            style={({ pressed }) => [
              styles.sendButton,
              !draft.trim() && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}
          >
            <Ionicons name="arrow-up" size={21} color={colors.text} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  title: {
    marginTop: 4,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  onlineText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  messagesList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 18,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ownMessageRow: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  ownAvatar: {
    backgroundColor: 'rgba(255, 98, 62, 0.18)',
  },
  avatarText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  messageContent: {
    maxWidth: '80%',
    flexShrink: 1,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
    paddingHorizontal: 2,
  },
  author: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderTopLeftRadius: 5,
    backgroundColor: colors.surfaceElevated,
  },
  ownBubble: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 5,
    backgroundColor: 'rgba(255, 98, 62, 0.2)',
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: colors.text,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonPressed: {
    backgroundColor: colors.accentPressed,
  },
});
