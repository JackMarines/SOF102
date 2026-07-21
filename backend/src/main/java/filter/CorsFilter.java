// Cho phép frontend (chạy ở domain khác) gọi API mà không bị chặn bởi CORS
// Đồng thời kiểm tra maintenance mode (chặn non-admin khi bảo trì)
package filter;

import dao.MaintenanceDao;
import entity.Maintenance;
import entity.User;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@WebFilter("/*")
public class CorsFilter implements Filter {

    // Danh sách origin được phép (frontend)
    private static final List<String> ALLOWED_ORIGINS = Arrays.asList(
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://devclimb.online",
        "https://api.devclimb.online"
    );

    // Các đường dẫn luôn được phép truy cập dù đang bảo trì
    private static final List<String> EXEMPT_PATHS = Arrays.asList(
        "/api/v1/announcements",
        "/api/v1/maintenance",
        "/api/v1/admin/",
        "/frontend/assets/",
        "/frontend/pages/common/maintenance/",
        "/frontend/pages/common/login/",
        "/frontend/pages/common/announcement/"
    );

    private MaintenanceDao maintenanceDao = new MaintenanceDao();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse res = (HttpServletResponse) response;
        HttpServletRequest req = (HttpServletRequest) request;

        String origin = req.getHeader("Origin");
        if (origin != null && !origin.isBlank() && ALLOWED_ORIGINS.contains(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Vary", "Origin");
        } else {
            res.setHeader("Access-Control-Allow-Origin", "*");
        }
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Credentials", "true");

        // Nếu là request OPTIONS (preflight) thì trả về OK luôn, không cần xử lý tiếp
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            res.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Kiểm tra maintenance mode — trả về JSON để frontend tự redirect
        if (isMaintenanceActive() && !isAdmin(req) && !isPathExempt(req)) {
            res.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            res.setContentType("application/json; charset=UTF-8");
            res.setCharacterEncoding("UTF-8");
            res.getWriter().write("{\"error\":\"site_under_maintenance\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    // Kiểm tra maintenance có đang bật không
    private boolean isMaintenanceActive() {
        try {
            Maintenance m = maintenanceDao.get();
            return m != null && Boolean.TRUE.equals(m.getMaintEnabled());
        } catch (Exception e) {
            return false;
        }
    }

    // Kiểm tra user có phải admin không
    private boolean isAdmin(HttpServletRequest req) {
        User u = (User) req.getSession().getAttribute("user");
        return u != null && Boolean.TRUE.equals(u.getUserIsadmin());
    }

    // Kiểm tra đường dẫn có được miễn kiểm tra maintenance không
    private boolean isPathExempt(HttpServletRequest req) {
        String uri = req.getRequestURI();
        for (String prefix : EXEMPT_PATHS) {
            if (uri.contains(prefix)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public void init(FilterConfig config) {}

    @Override
    public void destroy() {}
}
