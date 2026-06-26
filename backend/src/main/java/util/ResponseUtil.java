// Utility giúp gửi response JSON về cho frontend
package util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ResponseUtil {
    private static final ObjectMapper mapper = new ObjectMapper();

    // Gửi response JSON với dữ liệu bất kỳ
    public static void json(HttpServletResponse resp, Object data) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");
        mapper.writeValue(resp.getWriter(), data);
    }

    // Gửi response JSON lỗi kèm mã HTTP
    public static void error(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");
        Map<String, Object> body = new HashMap<>();
        body.put("error", message);
        mapper.writeValue(resp.getWriter(), body);
    }

    // Gửi response JSON thành công (alias của json)
    public static void success(HttpServletResponse resp, Object data) throws IOException {
        json(resp, data);
    }
}