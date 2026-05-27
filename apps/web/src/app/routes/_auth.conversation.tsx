import { createFileRoute } from '@tanstack/react-router';
import { lazyPage } from '../../shared/components/LazyRoute';

// Code-split: ConversationPage drags SSE streaming logic + markdown rendering
// + the AI tutor image. Loaded only when the user opens the chat tab.
const ConversationPage = lazyPage(
  () => import('../../pages/conversation/ConversationPage'),
  'ConversationPage',
);

export const Route = createFileRoute('/_auth/conversation')({
  component: ConversationPage,
});
