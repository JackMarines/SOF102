// Controller xử lý API home - gom dữ liệu cho trang chủ
package controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dao.TeamDao;
import dao.UserDao;
import entity.User;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

@WebServlet("/api/v1/home")
public class HomeController extends HttpServlet {

    private UserDao userDao = new UserDao();
    private TeamDao teamDao = new TeamDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
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

        Map<String, Object> result = new HashMap<>();
        result.put("displayName", user.getUserName());
        result.put("isAdmin", Boolean.TRUE.equals(user.getUserIsadmin()));

        if (user.getTeam() != null) {
            int teamId = user.getTeam().getTeamId();

            Map<String, Object> teamInfo = new HashMap<>();
            teamInfo.put("teamId", teamId);
            teamInfo.put("name", user.getTeam().getTeamName());

            List<Object[]> topRows = teamDao.getTopMembers(teamId, 6);
            List<Map<String, Object>> topMembers = new ArrayList<>();
            for (int i = 0; i < topRows.size(); i++) {
                Object[] row = topRows.get(i);
                Map<String, Object> m = new HashMap<>();
                m.put("userId", ((Number) row[0]).intValue());
                m.put("displayName", row[1]);
                m.put("avatar", row[2]);
                m.put("totalScore", ((Number) row[3]).intValue());
                m.put("isAdmin", Boolean.TRUE.equals(row[4]));
                m.put("rank", i + 1);
                topMembers.add(m);
            }
            teamInfo.put("topMembers", topMembers);
            result.put("team", teamInfo);

            result.put("weeklyPuzzles", teamDao.getWeeklyPuzzles(teamId));
            result.put("teamActivity", teamDao.getTeamActivity(teamId, user.getUserId()));
        } else {
            result.put("team", null);
            result.put("weeklyPuzzles", Collections.emptyList());
            result.put("teamActivity", Collections.emptyList());
        }

        ResponseUtil.success(resp, result);
    }
}
