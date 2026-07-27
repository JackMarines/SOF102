// Controller xử lý API team - chỉ đọc (danh sách + chi tiết)
package controller;

import dao.TeamDao;
import dao.UserDao;
import dao.WarningDao;
import entity.Team;
import entity.Warning;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/teams", "/api/v1/teams/stats"})
public class TeamBrowseController extends HttpServlet {

    private TeamDao teamDao = new TeamDao();
    private WarningDao warningDao = new WarningDao();
    private UserDao userDao = new UserDao();
    private static final Logger logger = LoggerFactory.getLogger(TeamBrowseController.class);

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();

        // GET /api/v1/teams/stats?id=X — thống kê biểu đồ team
        if (uri.endsWith("/stats")) {
            handleStats(req, resp);
            return;
        }

        // GET /api/v1/teams?id=X — chi tiết team
        String idParam = req.getParameter("id");
        if (idParam != null && !idParam.trim().isEmpty()) {
            handleTeamDetail(req, resp, idParam.trim());
        } else {
            handleTeamList(req, resp);
        }
    }

    // GET /api/v1/teams — danh sách team (có phân trang + tìm kiếm + sắp xếp)
    private void handleTeamList(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int page = 1, limit = 10;
        String search = req.getParameter("search");
        String sortBy = req.getParameter("sortBy");
        String order = req.getParameter("order");

        if (req.getParameter("page") != null) {
            try { page = Integer.parseInt(req.getParameter("page"));
                  if (page < 1) page = 1;
            } catch (NumberFormatException e) { }
        }
        if (req.getParameter("limit") != null) {
            try { limit = Integer.parseInt(req.getParameter("limit"));
                  if (limit < 1) limit = 1; if (limit > 100) limit = 100;
            } catch (NumberFormatException e) { }
        }

        long total = teamDao.count(search);
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Object[]> rows = teamDao.findAllWithStats(page, limit, search, sortBy, order);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", row[0]);
            item.put("name", row[1]);
            item.put("avatar", row[2]);
            item.put("ownerId", row[3]);
            item.put("isPublic", row[4]);
            item.put("memberCount", row[5]);
            item.put("totalSolved", row[6]);
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

        logger.info("Team list: page={}, search={}", page, search);
        ResponseUtil.success(resp, result);
    }

    // GET /api/v1/teams?id=X — chi tiết team (kèm members, top 6, stats)
    private void handleTeamDetail(HttpServletRequest req, HttpServletResponse resp,
                                   String idParam) throws IOException {
        int teamId;
        try {
            teamId = Integer.parseInt(idParam);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid teamId format");
            return;
        }

        Team team = teamDao.findById(teamId);
        if (team == null) {
            ResponseUtil.error(resp, 404, "Team not found");
            return;
        }

        // Lazy team ban check
        Warning teamWarn = warningDao.findActiveByTeamId(teamId);
        if (teamWarn != null && teamWarn.getWarnEnddate() != null
                && !teamWarn.getWarnEnddate().after(new java.util.Date())) {
            String teamName = team.getTeamName();
            for (Object[] m : teamDao.getMembers(teamId, null)) {
                userDao.setLastTeamInfo(((Number) m[0]).intValue(), teamName, "TEAM_BANNED");
            }
            teamDao.setInactive(teamId);
            warningDao.deactivate(teamWarn.getWarnId());
            ResponseUtil.error(resp, 404, "Team not found");
            return;
        }

        if (Boolean.FALSE.equals(team.getTeamIsactive())) {
            ResponseUtil.error(resp, 404, "Team not found");
            return;
        }

        long memberCount = teamDao.countMembers(teamId);
        long totalSolved = teamDao.getTotalSolvedByTeam(teamId);
        long participated = teamDao.getParticipatedMemberCount(teamId);
        double throughput = memberCount > 0
            ? Math.round(((double) participated / memberCount) * 1000.0) / 10.0
            : 0.0;

        String memberSearch = req.getParameter("search");
        List<Object[]> memberRows = teamDao.getMembers(teamId, memberSearch);

        List<Map<String, Object>> members = new ArrayList<>();
        for (Object[] row : memberRows) {
            Map<String, Object> m = new HashMap<>();
            m.put("userId", row[0]);
            m.put("displayName", row[1]);
            m.put("avatar", row[2]);
            m.put("totalScore", row[3]);
            m.put("totalPuzzles", row[4]);
            m.put("isAdmin", Boolean.TRUE.equals(row[5]));
            members.add(m);
        }

        List<Object[]> topRows = teamDao.getTopMembers(teamId, 6);
        List<Map<String, Object>> topMembers = new ArrayList<>();
        for (int i = 0; i < topRows.size(); i++) {
            Object[] row = topRows.get(i);
            Map<String, Object> m = new HashMap<>();
            m.put("userId", row[0]);
            m.put("displayName", row[1]);
            m.put("avatar", row[2]);
            m.put("totalScore", row[3]);
            m.put("rank", i + 1);
            topMembers.add(m);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", team.getTeamId());
        data.put("name", team.getTeamName());
        data.put("avatar", team.getTeamAvatar());
        data.put("ownerId", team.getTeamOwnerId());
        data.put("shoutout", team.getTeamShoutout());
        data.put("isPublic", team.getTeamIsPublic());
        data.put("memberCount", memberCount);
        data.put("totalSolved", totalSolved);
        data.put("throughput", throughput);
        data.put("members", members);
        data.put("topMembers", topMembers);

        logger.info("Team detail: id={}, members={}", teamId, memberCount);
        ResponseUtil.success(resp, data);
    }

    // GET /api/v1/teams/stats?id=X — thống kê số puzzle giải theo ngày
    private void handleStats(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "Missing team id");
            return;
        }

        int teamId;
        try {
            teamId = Integer.parseInt(idParam.trim());
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid team id");
            return;
        }

        List<Object[]> rows = teamDao.getSolvedByDay(teamId, 90);
        List<Map<String, Object>> data = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("date", row[0] != null ? row[0].toString() : null);
            item.put("solves", ((Number) row[1]).intValue());
            data.add(item);
        }

        ResponseUtil.success(resp, Map.of("period", "daily", "data", data));
    }
}
