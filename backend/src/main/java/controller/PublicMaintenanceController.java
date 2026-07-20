// Controller công khai cho biết maintenance có bật không
package controller;

import dao.MaintenanceDao;
import entity.Maintenance;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/v1/maintenance")
public class PublicMaintenanceController extends HttpServlet {

    private MaintenanceDao maintenanceDao = new MaintenanceDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Maintenance m = maintenanceDao.get();
        Map<String, Object> data = new HashMap<>();
        data.put("enabled", m != null && m.getMaintEnabled());
        ResponseUtil.success(resp, data);
    }
}
