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

        // Re-fetch user from DB to get fresh team ban notification fields
        User user = userDao.findById(sessionUser.getUserId());

        Map<String, Object> result = new HashMap<>();

        // Check both personal and team warnings
        Warning personal = warningDao.findActiveByUserId(user.getUserId());
        Warning team = null;
        if (user.getTeam() != null) {
            dao.TeamDao teamDao = new dao.TeamDao();
            if (teamDao.isOwner(user.getTeam().getTeamId(), user.getUserId())) {
                team = warningDao.findActiveByTeamId(user.getTeam().getTeamId());
            }
        }

        // Return the most recent active warning (highest warnId)
        Warning warning = null;
        if (personal != null && team != null) {
            warning = personal.getWarnId() > team.getWarnId() ? personal : team;
        } else {
            warning = personal != null ? personal : team;
        }

        if (warning != null) {
            Map<String, Object> warnData = new HashMap<>();
            warnData.put("warnId", warning.getWarnId());
            warnData.put("reason", warning.getWarnReason());
            warnData.put("startDate", warning.getWarnStartdate());
            warnData.put("endDate", warning.getWarnEnddate());
            warnData.put("userId", warning.getUserId());
            warnData.put("teamId", warning.getTeamId());

            User author = userDao.findById(warning.getWarnAuthorid());
            warnData.put("authorName", author != null ? author.getUserName() : "Unknown");

            result.put("warning", warnData);
        } else {
            result.put("warning", null);
        }

        // Team ban notification — user was removed from a banned team
        if ("TEAM_BANNED".equals(user.getUserLastleaveReason()) && user.getUserLastteamname() != null) {
            Map<String, Object> banMap = new HashMap<>();
            banMap.put("lastTeamName", user.getUserLastteamname());
            banMap.put("reason", user.getUserLastleaveReason());
            result.put("teamBanNotification", banMap);
        }

        ResponseUtil.success(resp, result);
    }
}
