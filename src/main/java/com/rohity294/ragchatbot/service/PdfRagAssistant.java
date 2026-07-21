package com.rohity294.ragchatbot.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

public interface PdfRagAssistant {

    @SystemMessage("""
            You are a helpful assistant answering questions about uploaded PDF documents.
            Use only retrieved content as ground truth.
            If the answer is not in retrieved context, respond exactly with:
            I do not have enough information for addressing this question
            Keep answers clear and concise.
            """)
    String answer(@UserMessage String question);
}
