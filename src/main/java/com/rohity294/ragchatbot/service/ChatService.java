package com.rohity294.ragchatbot.service;

import com.rohity294.ragchatbot.dto.ChatResponse;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.service.AiServices;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatService {

    private static final String INVALID_QUESTION_MESSAGE = "This is not a valid question for me";
    private static final String INSUFFICIENT_INFO_MESSAGE = "I do not have enough information for addressing this question";
    private static final Pattern NUMERIC_OR_CURRENCY = Pattern.compile("(\\$\\s?\\d+[\\d,]*(?:\\.\\d+)?)|(\\d+[\\d,]*(?:\\.\\d+)?\\s?(?:usd|dollars?|eur|inr|%))", Pattern.CASE_INSENSITIVE);

    private final VectorStoreService vectorStoreService;
    private final OpenAiModelFactory openAiModelFactory;
    private final DocumentIngestionService documentIngestionService;
    private final QuestionDomainService questionDomainService;

    public ChatService(VectorStoreService vectorStoreService,
                       OpenAiModelFactory openAiModelFactory,
                       DocumentIngestionService documentIngestionService,
                       QuestionDomainService questionDomainService) {
        this.vectorStoreService = vectorStoreService;
        this.openAiModelFactory = openAiModelFactory;
        this.documentIngestionService = documentIngestionService;
        this.questionDomainService = questionDomainService;
    }

    public ChatResponse ask(String question, int topK) {
        if (!questionDomainService.isValidHrQuestion(question)) {
            return new ChatResponse(INVALID_QUESTION_MESSAGE, 0);
        }

        List<Content> retrievedContent = vectorStoreService.retrieve(question, topK);
        if (retrievedContent.isEmpty()) {
            documentIngestionService.ingestDefaultPdf();
            retrievedContent = vectorStoreService.retrieve(question, topK);
            if (retrievedContent.isEmpty()) {
                return new ChatResponse(INSUFFICIENT_INFO_MESSAGE, 0);
            }
        }

        ContentRetriever retriever = vectorStoreService.contentRetriever(topK);
        PdfRagAssistant assistant = AiServices.builder(PdfRagAssistant.class)
            .chatLanguageModel(openAiModelFactory.chatModel())
            .contentRetriever(retriever)
            .build();

        String answer = assistant.answer(question);
        String retrievedContext = retrievedContent.stream()
                .map(content -> content.textSegment().text())
                .reduce("", (a, b) -> a + "\n" + b);

        if (answer == null || answer.isBlank()) {
            answer = INSUFFICIENT_INFO_MESSAGE;
        }
        if (answer.toLowerCase().contains("i do not have enough information")) {
            answer = INSUFFICIENT_INFO_MESSAGE;
        }

        if (isUnsupportedSpecificClaim(question, answer, retrievedContext)) {
            answer = INSUFFICIENT_INFO_MESSAGE;
        }

        return new ChatResponse(answer, retrievedContent.size());
    }

    private boolean isUnsupportedSpecificClaim(String question, String answer, String context) {
        String q = question == null ? "" : question.toLowerCase(Locale.ROOT);
        boolean asksExactValue = q.contains("exact") || q.contains("limit") || q.contains("how much")
                || q.contains("amount") || q.contains("compensated") || q.contains("reimbursement");

        if (!asksExactValue) {
            return false;
        }

        Matcher matcher = NUMERIC_OR_CURRENCY.matcher(answer);
        if (!matcher.find()) {
            return false;
        }

        String normalizedContext = context == null ? "" : context.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        matcher.reset();
        while (matcher.find()) {
            String claim = matcher.group().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
            if (!normalizedContext.contains(claim)) {
                return true;
            }
        }
        return false;
    }
}
