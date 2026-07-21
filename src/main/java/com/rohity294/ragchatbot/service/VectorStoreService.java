package com.rohity294.ragchatbot.service;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VectorStoreService {

    private final InMemoryEmbeddingStore<TextSegment> embeddingStore;
    private final OpenAiModelFactory openAiModelFactory;
    private final DocumentSplitter documentSplitter;

    public VectorStoreService(InMemoryEmbeddingStore<TextSegment> embeddingStore,
                              OpenAiModelFactory openAiModelFactory) {
        this.embeddingStore = embeddingStore;
        this.openAiModelFactory = openAiModelFactory;
        this.documentSplitter = DocumentSplitters.recursive(1000, 120);
    }

    public synchronized int ingestDocumentText(String text) {
        Document document = Document.from(text);
        List<TextSegment> segments = documentSplitter.split(document);

        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                .embeddingModel(openAiModelFactory.embeddingModel())
                .embeddingStore(embeddingStore)
                .documentSplitter(documentSplitter)
                .build();

        ingestor.ingest(document);
        return segments.size();
    }

    public synchronized ContentRetriever contentRetriever(int topK) {
        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(openAiModelFactory.embeddingModel())
                .maxResults(topK)
                .build();
    }

    public synchronized List<Content> retrieve(String question, int topK) {
        ContentRetriever retriever = contentRetriever(topK);
        return retriever.retrieve(Query.from(question));
    }
}
