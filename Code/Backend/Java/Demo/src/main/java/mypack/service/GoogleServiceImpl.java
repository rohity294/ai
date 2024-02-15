package mypack.service;

import java.io.IOException;
import org.springframework.stereotype.Service;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;

import mypack.MainApplication;
import mypack.utilities.Utilities;

import java.io.FileNotFoundException;
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

@Service
public class GoogleServiceImpl implements GoogleService {
	//private BookRepository bookRepository;

	// @Autowired can be avoided because this Spring bean has only 1 constructor
	public GoogleServiceImpl(
			//BookRepository bookRepository
			) {
		super();
		//this.bookRepository = bookRepository;
	}
	
	
	static String API_ENDPOINT = "";

    static String PROJECT_ID = "";
    
    static String LOCATION_ID = "";
    
    static String PUBLISHER = "";
    
    static String MODEL_ID = "";
    
    static String CANDIDATE_COUNT = "";
   
    static String MAX_OUTPUT_TOKENS = "";
    
    static String TEMPERATURE = "";
    
    static String TOP_P = "";
    
    static String TOP_K = "";
 
    static String SCOPES = "";
    
    static String CONTEXT = "";
   
    static String SERVICE_ACCOUNT_FILE_PATH = "";
   
	static {
		API_ENDPOINT = System.getenv("API_ENDPOINT"); ////northamerica-northeast1-aiplatform.googleapis.com

	    PROJECT_ID = System.getenv("PROJECT_ID");////nodal-skein-412018
	    
	    LOCATION_ID = System.getenv("LOCATION_ID"); ////northamerica-northeast1
	    
	    PUBLISHER = System.getenv("PUBLISHER"); //google
	  
	    MODEL_ID = System.getenv("MODEL_ID");//text-bison
	    
	    CANDIDATE_COUNT = System.getenv("CANDIDATE_COUNT");//1
	   
	    MAX_OUTPUT_TOKENS = System.getenv("MAX_OUTPUT_TOKENS");//1024
	    
	    TEMPERATURE = System.getenv("TEMPERATURE");//0.2
	    
	    TOP_P = System.getenv("TOP-P");//0.8
	    
	    TOP_K = System.getenv("TOP-K");//40
	 
	    SCOPES = System.getenv("SCOPES");//https://www.googleapis.com/auth/cloud-platform
	    
	    CONTEXT = System.getenv("CONTEXT");
	    /*
	    You are a financial advisor in a bank.You advise customers how to make smart investment decisions, maximize savings and be overall financially aware. You also suggest tips on how to file tax returns, taking advantage of tax concessions, making tax free investments as well as suggestions to invest in stocks and mutual funds. Your language is polite, professional and transparent. You provide a logical answer to the queries asked from you. Customer benefit is your important concern.
	    */
	    
	    SERVICE_ACCOUNT_FILE_PATH = System.getenv("SERVICE_ACCOUNT_FILE_PATH");
	    //nodal-skein-412018-47b18c3a2ffd.json
	}
	
	
	
	
	
	
	@Override
	public Object consumePromptAndFetchAllGoogleApiData(String prompt) {
		String result = processVendorGoogleAI(prompt);
		System.out.println(result);
		//System.out.println(Utilities.stringToJSONObjectConverter(result));
		return Utilities.stringToJSONObjectConverter(result);
	}
	
	//**************** GoogleAI related begins ****************
	
    private static String processVendorGoogleAI(String prompt){
//    	List<String> fetchedApiContent = new ArrayList<>(); // 0 index has full content with metadata, 1 index has predicted content
//        fetchedApiContent.add("empty");
//        fetchedApiContent.add("empty");
    	
    	String result = "";
        
        try {
        	HttpClient client = HttpClient.newBuilder().build();
            String accessToken = getAccessToken();

            String jsonRequestBody = String.format("""
                        {
                            "instances": [ { "content": "%s" } ],
                            "parameters": %s
                        }
                        """, getContentValue(prompt), getParameters());


            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(String.format("https://%s/v1/projects/%s/locations/%s/publishers/%s/models/%s:predict",
                            API_ENDPOINT,
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
            /*fetchedApiContent.set(0,response.body()); //0 index is set with full response with meta data
              
            //Organizing content received from GoogleAI
            Type mapType = new TypeToken<Map<String, Object>>(){
				private static final long serialVersionUID = 1L;
			}.getType();
			
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
            */
            result = response.body();
        }
        catch(Exception e) {
        	e.printStackTrace();
        }
        return result;
    }

    public static String getContentValue(String prompt) throws IOException {
        String context = System.getenv("CONTEXT");
        try (InputStream inputStream = MainApplication.class.getClassLoader().getResourceAsStream("examples.json")) {
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
                return String.format("%s\n\n%sinput: %s\noutput:\n", context, inputOutputInstances, prompt);
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

    private static String getAccessToken() throws IOException {
        try(InputStream serviceAccountStream = MainApplication.class.getClassLoader().getResourceAsStream(System.getenv("SERVICE_ACCOUNT_FILE_PATH"))){
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


}
