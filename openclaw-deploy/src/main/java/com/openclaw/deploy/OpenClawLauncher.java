package com.openclaw.deploy;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class OpenClawLauncher {

    public static void main(String[] args) throws IOException, InterruptedException {
        String openclawConfigPath = getEnvOrDefault("OPENCLAW_CONFIG_PATH", "/app/config/openclaw.json");
        String healthPort = getEnvOrDefault("PORT", "8080");
        String bindMode = getEnvOrDefault("OPENCLAW_GATEWAY_BIND", "lan");
        String gatewayToken = System.getenv("OPENCLAW_GATEWAY_TOKEN");

        List<String> command = new ArrayList<>();
        command.add("openclaw");
        command.add("gateway");
        command.add("run");
        command.add("--port");
        command.add(healthPort);
        command.add("--bind");
        command.add(bindMode);
        if (gatewayToken != null && !gatewayToken.isBlank()) {
            command.add("--auth");
            command.add("token");
        }
        command.add("--allow-unconfigured");

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        Map<String, String> env = processBuilder.environment();
        env.putIfAbsent("PORT", healthPort);
        processBuilder.redirectErrorStream(true);

        System.out.println("Starting OpenClaw gateway with config hint: " + openclawConfigPath);
        System.out.println("Using PORT=" + env.get("PORT"));
        System.out.println("Using OPENCLAW_GATEWAY_BIND=" + bindMode);

        Process process = processBuilder.start();
        streamOutput(process);
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("OpenClaw exited with code " + exitCode);
        }
    }

    private static String getEnvOrDefault(String key, String fallback) {
        String value = System.getenv(key);
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private static void streamOutput(Process process) throws IOException {
        Thread outputThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println(line);
                }
            } catch (IOException e) {
                System.err.println("Failed to read OpenClaw output: " + e.getMessage());
            }
        });

        outputThread.setDaemon(true);
        outputThread.start();
    }
}
