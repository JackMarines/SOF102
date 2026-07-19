// Controller xử lý API home - gom dữ liệu cho trang chủ
package controller;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import dao.TeamDao;
import dao.UserDao;
import entity.User;
import jakarta.persistence.EntityManager;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.JpaUtils;
import util.ResponseUtil;

@WebServlet("/api/v1/home")
public class HomeController extends HttpServlet {

    private UserDao userDao = new UserDao();
    private TeamDao teamDao = new TeamDao();
    private static final Logger logger = LoggerFactory.getLogger(HomeController.class);

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

        if (user.getTeam() != null) {
            int teamId = user.getTeam().getTeamId();

            // Team info + top 6 members
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
                m.put("rank", i + 1);
                topMembers.add(m);
            }
            teamInfo.put("topMembers", topMembers);
            result.put("team", teamInfo);

            // Team completions (weekly + recent) via native query
            EntityManager em = JpaUtils.getEntityManager();
            try {
                // Weekly: last 7 days
                Timestamp weekAgo = new Timestamp(System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000);
                List<Object[]> weeklyRows = em.createNativeQuery(
                    "SELECT u.user_name, pz.puz_title, l.lang_name, pz.puz_difficulty " +
                    "FROM progress pr " +
                    "JOIN user u ON pr.user_id = u.user_id " +
                    "JOIN puzzle pz ON pr.puz_id = pz.puz_id " +
                    "LEFT JOIN language l ON pz.lang_id = l.lang_id " +
                    "WHERE u.team_id = ? AND pr.prog_date >= ? " +
                    "ORDER BY pr.prog_date DESC LIMIT 10")
                    .setParameter(1, teamId)
                    .setParameter(2, weekAgo)
                    .getResultList();

                List<Map<String, Object>> weeklyPuzzles = new ArrayList<>();
                for (Object[] row : weeklyRows) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("displayName", row[0]);
                    item.put("title", row[1]);
                    item.put("language", row[2]);
                    item.put("difficulty", row[3]);
                    weeklyPuzzles.add(item);
                }
                result.put("weeklyPuzzles", weeklyPuzzles);

                // Team recent activity (all members except current user)
                List<Object[]> recentRows = em.createNativeQuery(
                    "SELECT u.user_name, pz.puz_title, l.lang_name, pz.puz_difficulty " +
                    "FROM progress pr " +
                    "JOIN user u ON pr.user_id = u.user_id " +
                    "JOIN puzzle pz ON pr.puz_id = pz.puz_id " +
                    "LEFT JOIN language l ON pz.lang_id = l.lang_id " +
                    "WHERE u.team_id = ? AND u.user_id != ? " +
                    "ORDER BY pr.prog_date DESC LIMIT 10")
                    .setParameter(1, teamId)
                    .setParameter(2, user.getUserId())
                    .getResultList();

                List<Map<String, Object>> teamActivity = new ArrayList<>();
                for (Object[] row : recentRows) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("displayName", row[0]);
                    item.put("title", row[1]);
                    item.put("language", row[2]);
                    item.put("difficulty", row[3]);
                    teamActivity.add(item);
                }
                result.put("teamActivity", teamActivity);

                // User's own recent completions (removed from home page)
            } finally {
                em.close();
            }

        } else {
            result.put("team", null);
            result.put("weeklyPuzzles", Collections.emptyList());
            result.put("teamActivity", Collections.emptyList());
        }

        ResponseUtil.success(resp, result);
    }
}
