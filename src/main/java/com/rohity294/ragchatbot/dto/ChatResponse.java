package com.rohity294.ragchatbot.dto;

public class ChatResponse {

    private final String answer;
    private final int retrievedChunks;

    public ChatResponse(String answer, int retrievedChunks) {
        this.answer = answer;
        this.retrievedChunks = retrievedChunks;
    }

    public String getAnswer() {
        return answer;
    }

    public int getRetrievedChunks() {
        return retrievedChunks;
    }
}
