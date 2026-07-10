package util;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;

public class Judge0Util {
    private static final String BASE_URL = "https://ce.judge0.com";
    private static final HttpClient client = HttpClient.newHttpClient();
    private static final ObjectMapper mapper = new ObjectMapper();

    public static List<Map<String, Object>> callJudge0(List<Map<String, Object>> submissions)
            throws Exception {
        String body = mapper.writeValueAsString(Map.of("submissions", submissions));

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/submissions/batch?base64_encoded=true"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());

        return mapper.readValue(res.body(),
            new TypeReference<List<Map<String, Object>>>() {});
    }

    public static Map<String, Object> getJudge0(String tokens) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/submissions/batch?tokens="
                          + tokens + "&base64_encoded=true"))
            .GET()
            .build();

        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());

        @SuppressWarnings("unchecked")
        Map<String, Object> parsed = mapper.readValue(res.body(), Map.class);
        return parsed;
    }

    public static String base64Decode(String encoded) {
        if (encoded == null || encoded.isBlank()) return "";
        return new String(Base64.getDecoder().decode(encoded));
    }

    public static String base64Encode(String raw) {
        return Base64.getEncoder().encodeToString(raw.getBytes());
    }
}
