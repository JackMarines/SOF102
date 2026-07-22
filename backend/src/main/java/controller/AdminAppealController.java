// Controller xử lý admin appeal
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.AppealDao;
import dao.WarningDao;
import entity.Appeal;
import entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/admin/appeals", "/api/v1/admin/appeal"})
public class AdminAppealController extends HttpServlet {

    private AppealDao appealDao = new AppealDao();
    private WarningDao warningDao = new WarningDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/appeals")) {
            handleListAppeals(req, resp);
        } else if (uri.endsWith("/appeal")) {
            handleGetAppeal(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleReviewAppeal(req, resp);
    }

    // GET /admin/appeals
    private void handleListAppeals(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int page = 1, limit = 10;
        if (req.getParameter("page") != null) {
            try { page = Integer.parseInt(req.getParameter("page"));
                  if (page < 1) page = 1;
            } catch (NumberFormatException e) {}
        }
        if (req.getParameter("limit") != null) {
            try { limit = Integer.parseInt(req.getParameter("limit"));
                  if (limit < 1) limit = 1; if (limit > 100) limit = 100;
            } catch (NumberFormatException e) {}
        }

        String status = req.getParameter("status");
        if (status != null && status.trim().isEmpty()) status = null;

        long total = appealDao.countByStatus(status);
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Appeal> appeals = appealDao.findAllByStatus(page, limit, status);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Appeal a : appeals) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.getAppId());
            item.put("appealId", a.getAppId());
            item.put("applicantId", a.getAppByid());
            item.put("message", a.getAppContent());
            item.put("createdDate", a.getAppDate());
            item.put("status", a.getAppStatus());
            item.put("reviewerId", a.getAppReviewedby());
            item.put("reviewDate", a.getAppReviewdate());
            // Look up applicant user info
            var em = util.JpaUtils.getEntityManager();
            try {
                User u = em.find(User.class, a.getAppByid());
                item.put("userName", u != null ? u.getUserName() : "Unknown");
                item.put("avatar", u != null ? u.getUserAvatar() : null);
            } finally {
                em.close();
            }
            dataList.add(item);
        }

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", total);
        pagination.put("totalPages", totalPages);

        Map<String, Object> result = new HashMap<>();
        result.put("data", dataList);
        result.put("pagination", pagination);
        ResponseUtil.success(resp, result);
    }

    // GET /admin/appeal?id=X
    private void handleGetAppeal(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            Appeal a = appealDao.findById(Integer.parseInt(idParam.trim()));
            if (a == null) {
                ResponseUtil.error(resp, 404, "Appeal not found");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("appealId", a.getAppId());
            data.put("applicantId", a.getAppByid());
            data.put("message", a.getAppContent());
            data.put("createdDate", a.getAppDate());
            data.put("status", a.getAppStatus());
            data.put("reviewerId", a.getAppReviewedby());
            data.put("reviewDate", a.getAppReviewdate());
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readJsonBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (java.io.BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }
        if (sb.length() == 0) return new HashMap<>();
        return objectMapper.readValue(sb.toString(), Map.class);
    }

    // PUT /admin/appeal?id=X { "status": "APPROVED" or "REJECTED" }
    // Admin xét duyệt appeal của user. Có 2 hướng:
    //   - APPROVED: chấp nhận appeal → deactivate (xoá) warning của user đó
    //   - REJECTED: từ chối appeal, giữ nguyên warning
    // Khi APPROVED, phải chủ động tìm warning đang active của user (findActiveByUserId)
    // và deactivate warning đó, vì warning có thể là warning cá nhân hoặc cảnh báo từ team
    private void handleReviewAppeal(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }

        try {
            int appealId = Integer.parseInt(idParam.trim());
            Appeal appeal = appealDao.findById(appealId);
            if (appeal == null) {
                ResponseUtil.error(resp, 404, "Appeal not found");
                return;
            }

            Map<String, Object> body = readJsonBody(req);
            String status = (String) body.get("status");
            if (status == null || (!"APPROVED".equals(status) && !"REJECTED".equals(status))) {
                ResponseUtil.error(resp, 400, "status must be APPROVED or REJECTED");
                return;
            }

            if ("APPROVED".equals(status)) {
                appealDao.approve(appealId, sessionUser.getUserId());
                // Khi chấp nhận appeal, phải deactivate warning của user luôn
                // Tìm warning đang active của user này bằng findActiveByUserId
                // Nếu không deactivate, user vẫn bị cảnh báo dù appeal đã được duyệt
                entity.Warning w = warningDao.findActiveByUserId(appeal.getAppByid());
                if (w != null) {
                    warningDao.deactivate(w.getWarnId());
                }
            } else {
                appealDao.reject(appealId, sessionUser.getUserId());
            }

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Appeal " + status);
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
