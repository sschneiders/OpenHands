import React from "react";
import { WsClientProvider } from "#/context/ws-client-provider";
import { ConversationWebSocketProvider } from "#/contexts/conversation-websocket-context";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useSubConversations } from "#/hooks/query/use-sub-conversations";

interface WebSocketProviderWrapperProps {
  children: React.ReactNode;
  conversationId: string;
  version: 0 | 1;
}

/**
 * A wrapper component that conditionally renders either the old v0 WebSocket provider
 * or the new v1 WebSocket provider based on the version prop.
 *
 * @param version - 0 for old WsClientProvider, 1 for new ConversationWebSocketProvider
 * @param conversationId - The conversation ID to pass to the provider
 * @param children - The child components to wrap
 *
 * @example
 * // Use the old v0 provider
 * <WebSocketProviderWrapper version={0} conversationId="conv-123">
 *   <ChatComponent />
 * </WebSocketProviderWrapper>
 *
 * @example
 * // Use the new v1 provider
 * <WebSocketProviderWrapper version={1} conversationId="conv-123">
 *   <ChatComponent />
 * </WebSocketProviderWrapper>
 */
export function WebSocketProviderWrapper({
  children,
  conversationId,
  version,
}: WebSocketProviderWrapperProps) {
  // Get conversation data for V1 provider
  const { data: conversation } = useActiveConversation();
  // Get sub-conversation data for V1 provider
  const { data: subConversations } = useSubConversations(
    conversation?.sub_conversation_ids ?? [],
  );

  // Filter out null sub-conversations
  const filteredSubConversations = subConversations?.filter(
    (subConversation) => subConversation !== null,
  );

  if (version === 0) {
    return (
      <WsClientProvider conversationId={conversationId}>
        {children}
      </WsClientProvider>
    );
  }

  if (version === 1) {
    // For V1 conversations, use the V1 app conversation's conversation_url if available
    const v1AppConversation = filteredSubConversations?.find(
      conv => conv.id === conversationId
    );

    const v1ConversationUrl = v1AppConversation?.conversation_url || conversation?.url;
    const v1SessionApiKey = v1AppConversation?.session_api_key || conversation?.session_api_key;
    console.log("conversation_url: ", v1AppConversation?.conversation_url);
    console.log("url: ", conversation?.url);
    console.log("v1ConversationUrl: ", v1ConversationUrl);

    const urlToUse = v1ConversationUrl.replace("localhost", "sheepintry.com");
    return (
      <ConversationWebSocketProvider
        conversationId={conversationId}
        conversationUrl={urlToUse}
        sessionApiKey={v1SessionApiKey}
        subConversationIds={conversation?.sub_conversation_ids}
        subConversations={filteredSubConversations}
      >
        {children}
      </ConversationWebSocketProvider>
    );
  }

  throw new Error(
    `Unsupported WebSocket provider version: ${version}. Supported versions are 0 and 1.`,
  );
}
