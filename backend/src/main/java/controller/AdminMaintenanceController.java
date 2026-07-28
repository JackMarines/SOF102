// Controller xử lý admin maintenance mode
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.MaintenanceDao;
import entity.Maintenance;
import entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/v1/admin/maintenance")
public class AdminMaintenanceController extends HttpServlet {

    private MaintenanceDao maintenanceDao = new MaintenanceDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        Maintenance m = maintenanceDao.get();
        if (m == null) {
            Map<String, Object> data = new HashMap<>();
            data.put("enabled", false);
            ResponseUtil.success(resp, data);
            return;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("enabled", m.getMaintEnabled());
        data.put("enabledBy", m.getMaintEnabledby());
        data.put("enabledAt", m.getMaintEnabledat());
        ResponseUtil.success(resp, data);
    }

    @SuppressWarnings("unchecked")
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getReader(), Map.class);
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid JSON");
            return;
        }

        Boolean enabled = (Boolean) body.get("enabled");
        if (enabled == null) {
            ResponseUtil.error(resp, 400, "enabled is required");
            return;
        }

        // Maintenance mode chỉ có 1 row trong DB (maintId = 1)
        // Khi bật: tất cả request API không phải admin sẽ bị chặn với 503
        // Kiểm tra ở CorsFilter.java → maintenance gate
        // Lưu lịch sử ai bật/tắt và thời gian để audit
        Maintenance m = maintenanceDao.get();
        if (m == null) {
            m = new Maintenance();
            m.setMaintId(1);
        }
        m.setMaintEnabled(enabled);
        if (enabled) {
            m.setMaintEnabledby(sessionUser.getUserId());
            m.setMaintEnabledat(new Timestamp(System.currentTimeMillis()));
        } else {
            m.setMaintEnabledby(sessionUser.getUserId());
            m.setMaintEnabledat(new Timestamp(System.currentTimeMillis()));
        }

        maintenanceDao.update(m);

        Map<String, Object> data = new HashMap<>();
        data.put("message", enabled ? "Maintenance enabled" : "Maintenance disabled");
        ResponseUtil.success(resp, data);
    }
}
