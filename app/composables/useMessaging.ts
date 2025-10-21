// composables/useMessaging.ts
export const useMessaging = () => {
  const createConversation = async (
    participantId: string,
    listingId?: number
  ) => {
    const { data, error } = await useFetch(
      "/api/messages/conversations/create",
      {
        method: "POST",
        body: { participantId, listingId },
      }
    );

    if (error.value) throw error.value;
    return data.value;
  };

  const fetchConversations = async () => {
    const { data } = await useFetch("/api/messages/conversations");
    return data.value || [];
  };

  const fetchMessages = async (conversationId: number) => {
    const { data } = await useFetch(`/api/messages/${conversationId}`);
    return data.value || [];
  };

  const sendMessage = async (
    conversationId: number,
    content: string,
    file?: File
  ) => {
    const formData = new FormData();
    formData.append("conversationId", conversationId.toString());
    formData.append("content", content);
    if (file) {
      formData.append("file", file);
    }

    const { data, error } = await useFetch("/api/messages/send", {
      method: "POST",
      body: formData,
    });

    if (error.value) throw error.value;
    return data.value;
  };

  const unlockMessage = async (messageId: number) => {
    const { data, error } = await useFetch("/api/messages/unlock", {
      method: "POST",
      body: { messageId },
    });

    if (error.value) throw error.value;
    return data.value;
  };

  return {
    createConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    unlockMessage,
  };
};
