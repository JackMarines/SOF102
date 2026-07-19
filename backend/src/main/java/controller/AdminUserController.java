// Controller xử lý admin user (xem, soft delete, ban, reactivate)
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.UserDao;
import entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/admin/users", "/api/v1/admin/user", "/api/v1/admin/user/ban", "/api/v1/admin/user/reactivate"})
public class AdminUserController extends HttpServlet {

    private UserDao userDao = new UserDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();

        if (uri.endsWith("/users")) {
            handleListUsers(req, resp);
        } else if (uri.endsWith("/user")) {
            handleGetUser(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/ban")) {
            handleBan(req, resp);
        } else if (uri.endsWith("/reactivate")) {
            handleReactivate(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
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
            int userId = Integer.parseInt(idParam.trim());
            userDao.setInactive(userId);
            Map<String, Object> data = new HashMap<>();
            data.put("message", "User deactivated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    // GET /admin/users
    private void handleListUsers(HttpServletRequest req, HttpServletResponse resp)
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

        long total = userDao.countActive();
        int totalPages = (int) Math.ceil((double) total / limit);
        List<User> users = userDao.findActiveAll(page, limit);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> item = new HashMap<>();
            item.put("userId", u.getUserId());
            item.put("userName", u.getUserName());
            item.put("userEmail", u.getUserEmail());
            item.put("userIsadmin", u.getUserIsadmin());
            item.put("userIsactive", u.getUserIsactive());
            item.put("avatar", u.getUserAvatar());
            item.put("bio", u.getUserBio());
            item.put("teamId", u.getTeam() != null ? u.getTeam().getTeamId() : null);
            item.put("groupName", u.getTeam() != null ? u.getTeam().getTeamName() : null);
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

    // GET /admin/user?id= or ?username= or ?email=
    private void handleGetUser(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        String username = req.getParameter("username");
        String email = req.getParameter("email");

        User user = null;
        if (idParam != null && !idParam.trim().isEmpty()) {
            try { user = userDao.findById(Integer.parseInt(idParam.trim())); }
            catch (NumberFormatException e) {}
        } else if (username != null && !username.trim().isEmpty()) {
            user = userDao.findByUsername(username.trim());
        } else if (email != null && !email.trim().isEmpty()) {
            user = userDao.findByEmail(email.trim());
        } else {
            ResponseUtil.error(resp, 400, "Provide id, username, or email");
            return;
        }

        if (user == null) {
            ResponseUtil.error(resp, 404, "User not found");
            return;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getUserId());
        data.put("userName", user.getUserName());
        data.put("userEmail", user.getUserEmail());
        data.put("userIsadmin", user.getUserIsadmin());
        data.put("userIsactive", user.getUserIsactive());
        data.put("avatar", user.getUserAvatar());
        data.put("bio", user.getUserBio());
        data.put("teamId", user.getTeam() != null ? user.getTeam().getTeamId() : null);
        data.put("groupName", user.getTeam() != null ? user.getTeam().getTeamName() : null);
        ResponseUtil.success(resp, data);
    }

    // PUT /admin/user/ban?id=X
    private void handleBan(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int userId = Integer.parseInt(idParam.trim());
            userDao.setInactive(userId);
            Map<String, Object> data = new HashMap<>();
            data.put("message", "User banned");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    // PUT /admin/user/reactivate?id=X
    private void handleReactivate(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int userId = Integer.parseInt(idParam.trim());
            userDao.setActive(userId);
            Map<String, Object> data = new HashMap<>();
            data.put("message", "User reactivated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
