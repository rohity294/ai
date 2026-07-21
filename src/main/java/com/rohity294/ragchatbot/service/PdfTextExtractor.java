package com.rohity294.ragchatbot.service;

import com.rohity294.ragchatbot.exception.BadRequestException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class PdfTextExtractor {

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Only .pdf files are supported");
        }

        try (PDDocument document = PDDocument.load(file.getBytes())) {
            PDFTextStripper pdfTextStripper = new PDFTextStripper();
            String text = pdfTextStripper.getText(document);
            if (text == null || text.isBlank()) {
                throw new BadRequestException("No readable text found in the PDF");
            }
            return text;
        } catch (IOException e) {
            throw new BadRequestException("Unable to read PDF: " + e.getMessage());
        }
    }

    public String extractText(Path filePath) {
        if (filePath == null || !Files.exists(filePath)) {
            throw new BadRequestException("Default PDF not found at: " + filePath);
        }

        String filename = filePath.getFileName() != null ? filePath.getFileName().toString() : "";
        if (!filename.toLowerCase().endsWith(".pdf")) {
            throw new BadRequestException("Default file must be a .pdf");
        }

        try (PDDocument document = PDDocument.load(filePath.toFile())) {
            PDFTextStripper pdfTextStripper = new PDFTextStripper();
            String text = pdfTextStripper.getText(document);
            if (text == null || text.isBlank()) {
                throw new BadRequestException("No readable text found in the default PDF");
            }
            return text;
        } catch (IOException e) {
            throw new BadRequestException("Unable to read default PDF: " + e.getMessage());
        }
    }
}
