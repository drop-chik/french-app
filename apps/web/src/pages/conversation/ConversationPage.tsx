import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Plus, MessageSquare, AlertCircle, ChevronDown, Trash2, Menu } from 'lucide-react';
import { conversationApi, type ConversationSession, type ChatMessage, type Correction } from '../../features/conversation/api';
import { useAuthStore } from '../../features/auth/authStore';
import { useI18n } from '../../shared/i18n';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import styles from './ConversationPage.module.css';

// Topic value stays in French (sent to GPT) — only the label is translated
const TOPICS = [
  { key: 'intro', value: 'Se présenter — introductions and greetings' },
  { key: 'cafe', value: 'Au café et au restaurant — at the café and restaurant' },
  { key: 'travel', value: 'Les voyages — travel and transport' },
  { key: 'work', value: 'Le travail — professions and work' },
  { key: 'family', value: 'La famille — family and relationships' },
  { key: 'hobbies', value: 'Les loisirs — hobbies and free time' },
  { key: 'weather', value: 'La météo — weather and nature' },
  { key: 'shopping', value: 'Les courses — shops and shopping' },
];

export function ConversationPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { t, lang } = useI18n();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['conversation-sessions'],
    queryFn: () => conversationApi.getSessions(),
  });

  const { data: sessionData } = useQuery({
    queryKey: ['conversation-session', activeSessionId],
    queryFn: () => conversationApi.getSession(activeSessionId!),
    enabled: !!activeSessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: ({ topic, level }: { topic: string; level: string }) =>
      conversationApi.createSession(topic, level),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-sessions'] });
      setActiveSessionId(data.session.id);
      setLocalMessages([]);
      setShowTopicPicker(false);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => conversationApi.deleteSession(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(
        ['conversation-sessions'],
        (old: { sessions: ConversationSession[] } | undefined) =>
          old ? { sessions: old.sessions.filter((s) => s.id !== deletedId) } : old,
      );
      if (activeSessionId === deletedId) {
        setActiveSessionId(null);
        setLocalMessages([]);
      }
      setDeleteConfirmId(null);
    },
    onError: (err) => {
      console.error('Delete session error:', err);
      setDeleteConfirmId(null);
    },
  });

  // Sync local messages from server
  useEffect(() => {
    if (sessionData?.session?.messages) {
      setLocalMessages(sessionData.session.messages);
    }
  }, [sessionData]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, streamingText]);

  const handleSend = async () => {
    if (!activeSessionId || !input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    // Optimistic: add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);

    let rawStream = '';

    await conversationApi.sendMessage(
      activeSessionId,
      userText,
      (chunk) => {
        rawStream += chunk;
        setStreamingText(rawStream);
      },
      () => {
        // Done — parse and add assistant message
        try {
          const parsed: { message: string; corrections: Correction[] } = JSON.parse(rawStream);
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: parsed.message,
            corrections: parsed.corrections ?? [],
            timestamp: new Date().toISOString(),
          };
          setLocalMessages((prev) => [...prev, assistantMsg]);
        } catch {
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: rawStream,
            corrections: [],
            timestamp: new Date().toISOString(),
          };
          setLocalMessages((prev) => [...prev, assistantMsg]);
        }
        setStreamingText('');
        setIsStreaming(false);
        queryClient.invalidateQueries({ queryKey: ['conversation-session', activeSessionId] });
        inputRef.current?.focus();
      },
      (err) => {
        setStreamingText('');
        setIsStreaming(false);
        console.error('Stream error:', err);
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewSession = (topic: string) => {
    const level = user?.level ?? 'A1';
    createSessionMutation.mutate({ topic, level });
    setSidebarOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const sessions = sessionsData?.sessions ?? [];
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className={styles.layout}>
      {deleteConfirmId && (
        <ConfirmDialog
          title={t.conversation.deleteConfirm}
          confirmLabel={t.common.delete ?? 'Удалить'}
          cancelLabel={t.profile.cancel}
          loading={deleteSessionMutation.isPending}
          onConfirm={() => {
            deleteSessionMutation.mutate(deleteConfirmId);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>{t.conversation.sidebarTitle}</span>
          <button
            className={styles.newButton}
            onClick={() => setShowTopicPicker(true)}
            title={t.conversation.newChat}
          >
            <Plus size={16} />
          </button>
        </div>

        {sessionsLoading && <p className={styles.sidebarEmpty}>{t.conversation.loading}</p>}

        {!sessionsLoading && sessions.length === 0 && (
          <p className={styles.sidebarEmpty}>{t.conversation.noSessions}</p>
        )}

        <div className={styles.sessionList}>
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`${styles.sessionItem} ${activeSessionId === s.id ? styles.sessionActive : ''}`}
              onClick={() => { setActiveSessionId(s.id); setSidebarOpen(false); }}
            >
              <MessageSquare size={14} className={styles.sessionIcon} />
              <span className={styles.sessionTopic}>{s.topic}</span>
              <button
                className={styles.deleteSessionBtn}
                onClick={(e) => handleDeleteSession(e, s.id)}
                title={t.conversation.deleteTitle}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat */}
      <main className={styles.chat}>
        {/* Mobile header */}
        <div className={styles.mobileHeader}>
          <button className={styles.mobileMenuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <span className={styles.mobileTitle}>
            {activeSession ? activeSession.topic : t.conversation.sidebarTitle}
          </span>
          <button className={styles.mobileNewBtn} onClick={() => { setShowTopicPicker(true); setSidebarOpen(false); }}>
            <Plus size={18} />
          </button>
        </div>

        {!activeSessionId && !showTopicPicker && (
          <div className={styles.emptyState}>
            <MessageSquare size={48} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>{t.conversation.emptyTitle}</h2>
            <p className={styles.emptySubtitle}>{t.conversation.emptySubtitle}</p>
            <button className={styles.startButton} onClick={() => setShowTopicPicker(true)}>
              {t.conversation.chooseTopic}
            </button>
          </div>
        )}

        {showTopicPicker && (
          <div className={styles.topicPicker}>
            <h2 className={styles.topicTitle}>{t.conversation.pickTopic}</h2>
            <div className={styles.topicGrid}>
              {TOPICS.map((topic) => (
                <button
                  key={topic.key}
                  className={styles.topicCard}
                  onClick={() => startNewSession(topic.value)}
                  disabled={createSessionMutation.isPending}
                >
                  {t.conversation.topics[topic.key as keyof typeof t.conversation.topics]}
                </button>
              ))}
            </div>
            <div className={styles.customTopic}>
              <input
                type="text"
                className={styles.customTopicInput}
                placeholder={t.conversation.customTopicPlaceholder}
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customTopic.trim()) {
                    startNewSession(customTopic.trim());
                    setCustomTopic('');
                  }
                }}
              />
            </div>
            {sessions.length > 0 && (
              <button className={styles.cancelButton} onClick={() => setShowTopicPicker(false)}>
                {t.conversation.cancel}
              </button>
            )}
          </div>
        )}

        {activeSessionId && !showTopicPicker && (
          <>
            <div className={styles.messages}>
              {localMessages.length === 0 && (
                <div className={styles.chatHint}>{t.conversation.chatHint}</div>
              )}

              {localMessages.map((msg, i) => (
                <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
                  {msg.role === 'assistant' ? (
                    <AssistantBubble msg={msg} lang={lang} />
                  ) : (
                    <div className={styles.bubble}>{msg.content}</div>
                  )}
                </div>
              ))}

              {/* Streaming assistant */}
              {isStreaming && streamingText && (
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <StreamingBubble rawText={streamingText} />
                </div>
              )}

              {isStreaming && !streamingText && (
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.bubble}>
                    <span className={styles.typingDots}>
                      <span /><span /><span />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <textarea
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.conversation.inputPlaceholder}
                rows={2}
                disabled={isStreaming}
              />
              <button
                className={styles.sendButton}
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function AssistantBubble({ msg, lang }: { msg: ChatMessage; lang: string }) {
  const { t } = useI18n();
  const [showCorrections, setShowCorrections] = useState(false);
  const corrections = msg.corrections ?? [];
  const count = corrections.length;

  const corrLabel = count === 1
    ? t.conversation.corrections.replace('{n}', String(count))
    : t.conversation.correctionsPlural.replace('{n}', String(count));

  return (
    <div>
      <div className={styles.bubble}>{msg.content}</div>
      {count > 0 && (
        <div className={styles.corrections}>
          <button
            className={styles.correctionsToggle}
            onClick={() => setShowCorrections(!showCorrections)}
          >
            <AlertCircle size={12} />
            {corrLabel}
            <ChevronDown size={12} className={showCorrections ? styles.chevronUp : ''} />
          </button>
          {showCorrections && (
            <div className={styles.correctionList}>
              {corrections.map((c, i) => (
                <div key={i} className={styles.correctionItem}>
                  <span className={styles.correctionWrong}>{c.original}</span>
                  <span className={styles.correctionArrow}>→</span>
                  <span className={styles.correctionRight}>{c.corrected}</span>
                  <span className={styles.correctionNote}>{c.explanation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StreamingBubble({ rawText }: { rawText: string }) {
  let displayText = rawText;
  try {
    const match = rawText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match?.[1]) displayText = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  } catch {
    // show raw
  }
  return <div className={styles.bubble}>{displayText}<span className={styles.cursor} /></div>;
}
