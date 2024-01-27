import com.google.api.client.util.Lists;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

//Vendor Choice: \n 1:GoogleAI \n 2:ChatGPT");
public class Main {
    static String aiVendor = "";
    static List<String> fetchedApiContent = new ArrayList<>(); // 0 index has full content with metadata, 1 index has predicted content

    static{
        fetchedApiContent.add("empty");
        fetchedApiContent.add("empty");
    }

    public static void main(String args[]) throws IOException, InterruptedException {
        System.out.println("Main is running");
        aiVendor = getAIVendor();

        while(aiVendor.equals("invalid")){
            aiVendor = getAIVendor();
        }

        switch (aiVendor){
            case "GoogleAI":{
                processVendorGoogleAI();
                break;
            }
            case "ChatGPT":{
                processVendorChatGPT();
                break;
            }
            default:;
        }

        display();//for testing results on consolde
    }

    private static void display(){
        System.out.println("Displaying results fetched from: " +  aiVendor);
        System.out.println(fetchedApiContent.get(1));
    }

    private static String getAIVendor() {
        System.out.println("Enter Vendor Choice: \n 1:GoogleAI \n 2:ChatGPT");
        Scanner sc = new Scanner(System.in);
        String userChoice = sc.nextLine();
        int userChoiceNumeric = -1;
        try{
            userChoiceNumeric = Integer.parseInt(userChoice);
        }catch(NumberFormatException nfe){
            System.out.println("Invalid Input! Please enter a valid integer as your choice.");
        }
        if(userChoiceNumeric == -1){
            return "invalid";
        }
        switch (userChoiceNumeric){
            case 1: return "GoogleAI";
            case 2: return "ChatGPT";
            default : return "invalid";
        }
    }

    //**************** GoogleAI related begins ****************
    private static void processVendorGoogleAI() throws IOException, InterruptedException {
        try (HttpClient client = HttpClient.newBuilder().build()) {
            String accessToken = getAccessToken();

            String jsonRequestBody = String.format("""
                        {
                            "instances": [ { "content": "%s" } ],
                            "parameters": %s
                        }
                        """, getContentValue(), getParameters());


            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(String.format("https://%s/v1/projects/%s/locations/%s/publishers/%s/models/%s:predict",
                            System.getenv("API_ENDPOINT"),
                            System.getenv("PROJECT_ID"),
                            System.getenv("LOCATION_ID"),
                            System.getenv("PUBLISHER"),
                            System.getenv("MODEL_ID")
                    )))
                    .header("Content-Type", "application/json")
                    .header("Authorization", String.format("Bearer %s", accessToken))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            fetchedApiContent.set(0,response.body()); //0 index is set with full response with meta data


            //Organizing content received from GoogleAI
            Type mapType = new TypeToken<Map<String, Object>>(){}.getType();
            Map<String, Object> contentMap = new Gson().fromJson(fetchedApiContent.get(0), mapType);

            String predictedContent = "";
            for( Map.Entry<String, Object> me: contentMap.entrySet()){
                String key = me.getKey();
                String value = me.getValue().toString();
                if(key.equals("predictions")){
                    String tokens[] = value.split(":");
                    for(int i=1; i<tokens.length; i++){
                        predictedContent = predictedContent + tokens[i] + "\n";
                    }
                }
            }

            fetchedApiContent.set(1, predictedContent.trim());//1 index is set with predicted content
        }
    }

    public static String getContentValue() throws IOException {
        String context = System.getenv("CONTEXT");
        try (InputStream inputStream = Main.class.getClassLoader().getResourceAsStream("examples.json")) {
            if (inputStream == null) {
                throw new IOException("Resource not found: examples.json");
            }
            try (InputStreamReader reader = new InputStreamReader(inputStream)) {
                Gson gson = new Gson();
                Map<String, Object>[] examples = gson.fromJson(reader, TypeToken.of(Map[].class).getType());
                StringBuilder inputOutputInstances = new StringBuilder();
                for (Map<String, Object> example : examples) {
                    String inputValue = (String) example.get("input");
                    String outputValue = (String) example.get("output");
                    inputOutputInstances.append(String.format("input: %s\noutput: %s\n\n", inputValue, outputValue));
                }
                return String.format("%s\n\n%sinput: %s\noutput:\n", context, inputOutputInstances, getPrompt());
            }
        }
    }

    private static String getParameters() {
        Map<String, Object> parameterMap = new HashMap<>();
        parameterMap.put("candidateCount", Integer.parseInt(System.getenv("CANDIDATE_COUNT")));
        parameterMap.put("maxOutputTokens", Integer.parseInt(System.getenv("MAX_OUTPUT_TOKENS")));
        parameterMap.put("temperature", Double.parseDouble(System.getenv("TEMPERATURE")));
        parameterMap.put("topP", Double.parseDouble(System.getenv("TOP-P")));
        parameterMap.put("topK", Integer.parseInt(System.getenv("TOP-K")));
        return new Gson().toJson(parameterMap);
    }

    private static String getPrompt() {
        System.out.println("Type a prompt:");
        Scanner in = new Scanner(System.in);
        return in.nextLine();
    }

    private static String getAccessToken() throws IOException {
        try(InputStream serviceAccountStream = Main.class.getClassLoader().getResourceAsStream(System.getenv("SERVICE_ACCOUNT_FILE_PATH"))){
            if (serviceAccountStream == null) {
                throw new FileNotFoundException("Service account file not found");
            }

            ArrayList<String> scopeArrayList = new ArrayList<>();
            scopeArrayList.add(System.getenv("SCOPES"));
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccountStream)
                    .createScoped(scopeArrayList);
            credentials.refreshIfExpired();
            return credentials.getAccessToken().getTokenValue();
        }
    }
   //**************** GoogleAI related ends ****************





    //**************** ChatGPT related begins ****************
    private static void processVendorChatGPT(){
        fetchedApiContent.set(0, "processing ChatGPT...");
        fetchedApiContent.set(1, "processing ChatGPT...");
    }
    //**************** ChatGPT related ends ****************
}









