// Controller xử lý API profile user (xem, sửa, xem public, danh sách đã giải)
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.ProgressDao;
import dao.UserDao;
import entity.Puzzle;
import entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet({"/api/v1/profile", "/api/v1/profile/completed", "/api/v1/profile/activity"})
public class ProfileController extends HttpServlet {

    private UserDao userDao = new UserDao();
    private ProgressDao progressDao = new ProgressDao();
    private ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();

        // /api/v1/profile/activity
        if (uri.endsWith("/activity")) {
            handleActivity(req, resp);
            return;
        }

        // /api/v1/profile/completed
        if (uri.endsWith("/completed")) {
            handleCompletedPuzzles(req, resp);
            return;
        }

        // /api/v1/profile
        String idParam = req.getParameter("id");
        if (idParam != null && !idParam.trim().isEmpty()) {
            handlePublicProfile(req, resp, idParam.trim());
        } else {
            handleOwnProfile(req, resp);
        }
    }

    // Gom chung logic build response profile (dùng cho cả own + public)
    private Map<String, Object> buildProfileResponse(User user, int rank, long totalCompleted, int totalScore) {
        Map<String, Object> data = new HashMap<>();
        data.put("displayName", user.getUserName());
        data.put("avatar", user.getUserAvatar());
        data.put("bio", user.getUserBio());
        data.put("groupName", user.getTeam() != null ? user.getTeam().getTeamName() : null);
        data.put("teamId", user.getTeam() != null ? user.getTeam().getTeamId() : null);
        data.put("groupAvatar", user.getTeam() != null ? user.getTeam().getTeamAvatar() : null);
        data.put("rank", rank);
        data.put("totalScore", totalScore);
        data.put("totalCompletedPuzzles", totalCompleted);
        data.put("isAdmin", user.getUserIsadmin());
        return data;
    }

    // Lấy profile của chính user đang đăng nhập
    private void handleOwnProfile(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        User user = userDao.findById(sessionUser.getUserId());
        if (user == null) {
            ResponseUtil.error(resp, 404, "User not found");
            return;
        }

        int totalScore = progressDao.getTotalScore(user.getUserId());
        long totalCompleted = progressDao.countByUser(user.getUserId());

        int rank = 0;
        if (user.getTeam() != null) {
            rank = progressDao.getRankInTeam(
                user.getTeam().getTeamId(), user.getUserId(), totalScore);
        }

        ResponseUtil.success(resp, buildProfileResponse(user, rank, totalCompleted, totalScore));
    }

    // Xem profile public của user khác (không cần đăng nhập)
    private void handlePublicProfile(HttpServletRequest req, HttpServletResponse resp,
                                      String idParam) throws IOException {
        int userId;
        try {
            userId = Integer.parseInt(idParam);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid userId format");
            return;
        }

        User user = userDao.findById(userId);
        if (user == null) {
            ResponseUtil.error(resp, 404, "User not found");
            return;
        }

        int totalScore = progressDao.getTotalScore(user.getUserId());
        long totalCompleted = progressDao.countByUser(user.getUserId());

        int rank = 0;
        if (user.getTeam() != null) {
            rank = progressDao.getRankInTeam(
                user.getTeam().getTeamId(), user.getUserId(), totalScore);
        }

        ResponseUtil.success(resp, buildProfileResponse(user, rank, totalCompleted, totalScore));
    }

    // Lấy danh sách puzzle đã hoàn thành (có phân trang + lọc)
    // Nếu có ?id=X → xem public profile của user khác (không cần auth)
    // Nếu không có ?id → xem của chính mình (cần auth)
    private void handleCompletedPuzzles(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String targetIdParam = req.getParameter("id");
        int targetUserId;

        if (targetIdParam != null && !targetIdParam.trim().isEmpty()) {
            try {
                targetUserId = Integer.parseInt(targetIdParam.trim());
            } catch (NumberFormatException e) {
                ResponseUtil.error(resp, 400, "Invalid userId format");
                return;
            }
        } else {
            User sessionUser = (User) req.getSession().getAttribute("user");
            if (sessionUser == null) {
                ResponseUtil.error(resp, 401, "Not authenticated");
                return;
            }
            targetUserId = sessionUser.getUserId();
        }

        int page = 1;
        int limit = 10;
        String search = req.getParameter("search");
        String difficulty = req.getParameter("difficulty");
        String language = req.getParameter("language");

        if (req.getParameter("page") != null) {
            try {
                page = Integer.parseInt(req.getParameter("page"));
                if (page < 1) page = 1;
            } catch (NumberFormatException e) { }
        }
        if (req.getParameter("limit") != null) {
            try {
                limit = Integer.parseInt(req.getParameter("limit"));
                if (limit < 1) limit = 1;
                if (limit > 100) limit = 100;
            } catch (NumberFormatException e) { }
        }

        long total = progressDao.countCompletedPuzzles(
            targetUserId, search, difficulty, language);
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Puzzle> puzzles = progressDao.getCompletedPuzzles(
            targetUserId, page, limit, search, difficulty, language);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Puzzle p : puzzles) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", p.getPuzId());
            item.put("title", p.getPuzTitle());
            item.put("language", p.getLanguage() != null ? p.getLanguage().getLangName() : null);
            item.put("difficulty", p.getPuzDifficulty());
            item.put("score", p.getPuzScore());
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

    // GET /api/v1/profile/activity?id=X — số puzzle giải theo ngày của user
    private void handleActivity(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        User sessionUser = (User) req.getSession().getAttribute("user");
        int userId;
        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                userId = Integer.parseInt(idParam.trim());
            } catch (NumberFormatException e) {
                ResponseUtil.error(resp, 400, "Invalid userId");
                return;
            }
        } else if (sessionUser != null) {
            userId = sessionUser.getUserId();
        } else {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        List<Object[]> rows = progressDao.getUserActivityByDay(userId, 100);
        List<Map<String, Object>> data = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("date", row[0] != null ? row[0].toString() : null);
            item.put("solves", ((Number) row[1]).intValue());
            data.add(item);
        }

        ResponseUtil.success(resp, Map.of("period", "daily", "data", data));
    }

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

        String email = (String) body.get("email");
        String displayName = (String) body.get("displayName");
        String bio = (String) body.get("bio");
        String avatar = (String) body.get("avatar");

        if (email != null && (!email.contains("@") || email.length() > 255)) {
            ResponseUtil.error(resp, 400, "Invalid email format");
            return;
        }
        if (displayName != null && (displayName.trim().isEmpty() || displayName.length() > 50)) {
            ResponseUtil.error(resp, 400, "Display name must be 1-50 characters");
            return;
        }
        if (bio != null && bio.length() > 500) {
            ResponseUtil.error(resp, 400, "Bio must be at most 500 characters");
            return;
        }

        userDao.update(sessionUser.getUserId(), displayName, bio, avatar, email);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated");
        ResponseUtil.success(resp, response);
    }
}
