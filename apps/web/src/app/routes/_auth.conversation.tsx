import { createFileRoute } from '@tanstack/react-router';
import { ConversationPage } from '../../pages/conversation/ConversationPage';

export const Route = createFileRoute('/_auth/conversation')({
  component: ConversationPage,
});
