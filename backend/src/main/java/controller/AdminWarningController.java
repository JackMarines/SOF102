// Controller xử lý admin warning
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.UserDao;
import dao.WarningDao;
import entity.User;
import entity.Warning;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;

@WebServlet({"/api/v1/admin/warnings", "/api/v1/admin/warning"})
public class AdminWarningController extends HttpServlet {

    private WarningDao warningDao = new WarningDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/warnings")) {
            handleListWarnings(req, resp);
        } else if (uri.endsWith("/warning")) {
            handleGetWarning(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleCreateWarning(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleUpdateWarning(req, resp);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            warningDao.deactivate(Integer.parseInt(idParam.trim()));
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Warning deactivated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    // GET /admin/warnings
    private void handleListWarnings(HttpServletRequest req, HttpServletResponse resp)
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

        long total = warningDao.count();
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Warning> warnings = warningDao.findAll(page, limit);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Warning w : warnings) {
            Map<String, Object> item = new HashMap<>();
            item.put("warnId", w.getWarnId());
            item.put("isActive", w.getWarnIsactive());
            item.put("reason", w.getWarnReason());
            item.put("authorId", w.getWarnAuthorid());
            item.put("startDate", w.getWarnStartdate());
            item.put("endDate", w.getWarnEnddate());
            item.put("userId", w.getUserId());
            item.put("teamId", w.getTeamId());
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

    // GET /admin/warning?id=X
    private void handleGetWarning(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int wid = Integer.parseInt(idParam.trim());
            Warning w = warningDao.findById(wid);
            if (w == null) {
                ResponseUtil.error(resp, 404, "Warning not found");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("warnId", w.getWarnId());
            data.put("isActive", w.getWarnIsactive());
            data.put("reason", w.getWarnReason());
            data.put("authorId", w.getWarnAuthorid());
            data.put("startDate", w.getWarnStartdate());
            data.put("endDate", w.getWarnEnddate());
            data.put("userId", w.getUserId());
            data.put("teamId", w.getTeamId());
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

    // POST /admin/warning (+?instant=true) — create warning or instant ban
    private void handleCreateWarning(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        Map<String, Object> body = readJsonBody(req);
        String reason = (String) body.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "reason is required");
            return;
        }

        String instantParam = req.getParameter("instant");
        boolean instant = "true".equalsIgnoreCase(instantParam);

        Warning warning = new Warning();
        warning.setWarnReason(reason.trim());
        warning.setWarnAuthorid(sessionUser.getUserId());
        warning.setWarnIsactive(true);

        if (body.containsKey("userId")) {
            warning.setUserId(((Number) body.get("userId")).intValue());
        } else if (body.containsKey("teamId")) {
            warning.setTeamId(((Number) body.get("teamId")).intValue());
        } else {
            ResponseUtil.error(resp, 400, "Provide userId or teamId");
            return;
        }

        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            if (instant) {
                warning.setWarnStartdate(new java.util.Date());
                warning.setWarnEnddate(new java.util.Date());
            } else {
                warning.setWarnStartdate(sdf.parse((String) body.get("startDate")));
                warning.setWarnEnddate(sdf.parse((String) body.get("endDate")));
            }
        } catch (Exception e) {
            if (!instant) {
                ResponseUtil.error(resp, 400, "Invalid date format. Use yyyy-MM-dd");
                return;
            }
        }

        warningDao.create(warning);

        // If instant, also deactivate the user/team immediately
        if (instant) {
            UserDao userDao = new UserDao();
            dao.TeamDao teamDao = new dao.TeamDao();
            if (warning.getUserId() != null) {
                userDao.setInactive(warning.getUserId());
            } else if (warning.getTeamId() != null) {
                entity.Team team = teamDao.findById(warning.getTeamId());
                if (team != null) {
                    String tn = team.getTeamName();
                    for (Object[] m : teamDao.getMembers(warning.getTeamId(), null)) {
                        userDao.setLastTeamInfo(((Number) m[0]).intValue(), tn, "TEAM_BANNED");
                    }
                    teamDao.setInactive(warning.getTeamId());
                }
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("warnId", warning.getWarnId());
        data.put("message", instant ? "Instant ban applied" : "Warning created");
        ResponseUtil.success(resp, data);
    }

    // PUT /admin/warning?id=X — update warning
    private void handleUpdateWarning(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int wid = Integer.parseInt(idParam.trim());
            Warning w = warningDao.findById(wid);
            if (w == null) {
                ResponseUtil.error(resp, 404, "Warning not found");
                return;
            }

            Map<String, Object> body = readJsonBody(req);
            if (body.containsKey("reason")) w.setWarnReason((String) body.get("reason"));
            if (body.containsKey("isActive")) w.setWarnIsactive((Boolean) body.get("isActive"));

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            try {
                if (body.containsKey("startDate")) w.setWarnStartdate(sdf.parse((String) body.get("startDate")));
                if (body.containsKey("endDate")) w.setWarnEnddate(sdf.parse((String) body.get("endDate")));
            } catch (Exception e) {
                ResponseUtil.error(resp, 400, "Invalid date format");
                return;
            }

            warningDao.deactivate(wid);
            // Re-create with updated values
            w.setWarnIsactive(true);
            warningDao.create(w);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Warning updated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
