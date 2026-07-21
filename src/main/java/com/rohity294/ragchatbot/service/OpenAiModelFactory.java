package com.rohity294.ragchatbot.service;

import com.rohity294.ragchatbot.config.OpenAiProperties;
import com.rohity294.ragchatbot.exception.BadRequestException;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import org.springframework.stereotype.Component;

@Component
public class OpenAiModelFactory {

    private final OpenAiProperties openAiProperties;

    public OpenAiModelFactory(OpenAiProperties openAiProperties) {
        this.openAiProperties = openAiProperties;
    }

    public ChatLanguageModel chatModel() {
        String apiKey = requireApiKey();
        return OpenAiChatModel.builder()
                .apiKey(apiKey)
                .modelName(openAiProperties.getChatModel())
                .temperature(openAiProperties.getTemperature())
                .build();
    }

    public EmbeddingModel embeddingModel() {
        String apiKey = requireApiKey();
        return OpenAiEmbeddingModel.builder()
                .apiKey(apiKey)
                .modelName(openAiProperties.getEmbeddingModel())
                .build();
    }

    private String requireApiKey() {
        String apiKey = openAiProperties.getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new BadRequestException("OPENAI_API_KEY is missing. Set it as an environment variable before calling this endpoint.");
        }
        return apiKey;
    }
}
