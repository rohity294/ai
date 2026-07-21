package com.rohity294.ragchatbot.service;

import com.rohity294.ragchatbot.dto.IngestResponse;
import com.rohity294.ragchatbot.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

@Service
public class DocumentIngestionService {

    private static final Path DEFAULT_PDF_PATH = Path.of("resources", "document.pdf");

    private final PdfTextExtractor pdfTextExtractor;
    private final VectorStoreService vectorStoreService;

    public DocumentIngestionService(PdfTextExtractor pdfTextExtractor,
                                    VectorStoreService vectorStoreService) {
        this.pdfTextExtractor = pdfTextExtractor;
        this.vectorStoreService = vectorStoreService;
    }

    public IngestResponse ingestPdf(MultipartFile file) {
        String text = pdfTextExtractor.extractText(file);
        int indexed = vectorStoreService.ingestDocumentText(text);
        if (indexed <= 0) {
            throw new BadRequestException("No text chunks generated from PDF");
        }
        return new IngestResponse(file.getOriginalFilename(), indexed);
    }

    public int ingestDefaultPdf() {
        String text = pdfTextExtractor.extractText(DEFAULT_PDF_PATH);
        int indexed = vectorStoreService.ingestDocumentText(text);
        if (indexed <= 0) {
            throw new BadRequestException("No text chunks generated from default PDF");
        }
        return indexed;
    }
}
