package com.rohity294.ragchatbot.dto;

public class IngestResponse {

    private final String filename;
    private final int chunksIndexed;

    public IngestResponse(String filename, int chunksIndexed) {
        this.filename = filename;
        this.chunksIndexed = chunksIndexed;
    }

    public String getFilename() {
        return filename;
    }

    public int getChunksIndexed() {
        return chunksIndexed;
    }
}
