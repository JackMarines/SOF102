// Controller công khai cho user xem warning đang active của mình
package controller;

import dao.UserDao;
import dao.WarningDao;
import entity.User;
import entity.Warning;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/v1/my-warning")
public class UserWarningController extends HttpServlet {

    private WarningDao warningDao = new WarningDao();
    private UserDao userDao = new UserDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        // Check personal warning
        Warning warning = warningDao.findActiveByUserId(sessionUser.getUserId());

        // If no personal warning and user owns a team, check team warning
        if (warning == null && sessionUser.getTeam() != null) {
            dao.TeamDao teamDao = new dao.TeamDao();
            if (teamDao.isOwner(sessionUser.getTeam().getTeamId(), sessionUser.getUserId())) {
                warning = warningDao.findActiveByTeamId(sessionUser.getTeam().getTeamId());
            }
        }

        if (warning == null) {
            ResponseUtil.success(resp, Map.of("warning", null));
            return;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("warnId", warning.getWarnId());
        data.put("reason", warning.getWarnReason());
        data.put("startDate", warning.getWarnStartdate());
        data.put("endDate", warning.getWarnEnddate());
        data.put("userId", warning.getUserId());
        data.put("teamId", warning.getTeamId());

        // Resolve author name
        User author = userDao.findById(warning.getWarnAuthorid());
        data.put("authorName", author != null ? author.getUserName() : "Unknown");

        ResponseUtil.success(resp, Map.of("warning", data));
    }
}
