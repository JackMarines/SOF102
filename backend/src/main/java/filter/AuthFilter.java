// Bộ lọc kiểm tra đăng nhập + quyền admin trước khi cho vào trang admin
package filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import entity.User;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebFilter("/api/v1/admin/*")
public class AuthFilter implements Filter {

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        // Kiểm tra session có user không
        User user = (User) req.getSession().getAttribute("user");
        if (user == null) {
            writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated");
            return;
        }

        // Kiểm tra quyền admin
        if (user.getUserIsadmin() == null || !user.getUserIsadmin()) {
            writeError(resp, HttpServletResponse.SC_FORBIDDEN, "Forbidden. Admin access required.");
            return;
        }

        // Đã đăng nhập + là admin → cho đi tiếp
        chain.doFilter(request, response);
    }

    // Gửi response JSON lỗi
    private void writeError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");
        Map<String, Object> body = new HashMap<>();
        body.put("error", message);
        mapper.writeValue(resp.getWriter(), body);
    }

    @Override
    public void init(FilterConfig config) {}

    @Override
    public void destroy() {}
}
