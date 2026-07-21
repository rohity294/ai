package com.rohity294.ragchatbot.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class ChatRequest {

    @NotBlank(message = "question is required")
    private String question;

    @Min(value = 1, message = "topK must be at least 1")
    @Max(value = 10, message = "topK must be at most 10")
    private int topK = 4;

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public int getTopK() {
        return topK;
    }

    public void setTopK(int topK) {
        this.topK = topK;
    }
}
