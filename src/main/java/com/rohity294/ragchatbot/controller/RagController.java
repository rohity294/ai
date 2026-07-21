package com.rohity294.ragchatbot.controller;

import com.rohity294.ragchatbot.dto.ChatRequest;
import com.rohity294.ragchatbot.dto.ChatResponse;
import com.rohity294.ragchatbot.dto.IngestResponse;
import com.rohity294.ragchatbot.service.ChatService;
import com.rohity294.ragchatbot.service.DocumentIngestionService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
public class RagController {

    private final DocumentIngestionService documentIngestionService;
    private final ChatService chatService;

    public RagController(DocumentIngestionService documentIngestionService,
                         ChatService chatService) {
        this.documentIngestionService = documentIngestionService;
        this.chatService = chatService;
    }

    @GetMapping("/health")
    public String health() {
        return "RAG PDF chatbot is up";
    }

    @PostMapping(value = "/documents/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public IngestResponse uploadDocument(@RequestParam("file") MultipartFile file) {
        return documentIngestionService.ingestPdf(file);
    }

    @PostMapping(value = "/chat", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return chatService.ask(request.getQuestion(), request.getTopK());
    }
}
