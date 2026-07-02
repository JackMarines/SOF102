// Controller cho các chức năng admin (được bảo vệ bởi AuthFilter)
package controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/v1/admin/dashboard")
public class AdminController extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Welcome, admin!");
        data.put("status", "ok");

        ResponseUtil.success(resp, data);
    }
}
