// Controller xử lý admin team
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.TeamDao;
import dao.UserDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/admin/teams", "/api/v1/admin/team", "/api/v1/admin/team/ban", "/api/v1/admin/team/reactivate"})
public class AdminTeamController extends HttpServlet {

    private TeamDao teamDao = new TeamDao();
    private UserDao userDao = new UserDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/teams")) {
            handleListTeams(req, resp);
        } else if (uri.endsWith("/team")) {
            handleGetTeam(req, resp);
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

    // GET /admin/teams
    private void handleListTeams(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int page = 1, limit = 10;
        String search = req.getParameter("search");
        String sortBy = req.getParameter("sortBy");
        String order = req.getParameter("order");
        String status = req.getParameter("status");
        if (status == null || status.trim().isEmpty()) status = "active";

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

        long total = teamDao.countFiltered(status);
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Object[]> rows = teamDao.findWithStats(page, limit, search, sortBy, order, status);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", row[0]);
            item.put("name", row[1]);
            item.put("avatar", row[2]);
            item.put("ownerId", row[3]);
            item.put("isPublic", row[4]);
            item.put("isActive", row[5]);
            item.put("memberCount", row[6]);
            item.put("totalSolved", row[7]);
            item.put("ownerName", row[8]);
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

    // GET /admin/team?id= or ?name=
    private void handleGetTeam(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        String name = req.getParameter("name");

        entity.Team team = null;
        if (idParam != null && !idParam.trim().isEmpty()) {
            try { team = teamDao.findById(Integer.parseInt(idParam.trim())); }
            catch (NumberFormatException e) {}
        } else if (name != null && !name.trim().isEmpty()) {
            team = teamDao.findByName(name.trim());
        } else {
            ResponseUtil.error(resp, 400, "Provide id or name");
            return;
        }

        if (team == null) {
            ResponseUtil.error(resp, 404, "Team not found");
            return;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", team.getTeamId());
        data.put("name", team.getTeamName());
        data.put("avatar", team.getTeamAvatar());
        data.put("ownerId", team.getTeamOwnerId());
        data.put("shoutout", team.getTeamShoutout());
        data.put("isPublic", team.getTeamIsPublic());
        data.put("isActive", team.getTeamIsactive());
        ResponseUtil.success(resp, data);
    }

    // PUT /admin/team/ban?id=X
    // Ban team: set team_isactive=false, ghi "TEAM_BANNED" vào mọi thành viên
    // Quan trọng: members bị setLastTeamInfo để khi họ login sẽ thấy notification
    // Nếu chỉ setInactive team mà không xoá members, user vẫn còn trong team nhưng team đã khoá
    private void handleBan(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int teamId = Integer.parseInt(idParam.trim());
            entity.Team team = teamDao.findById(teamId);
            if (team == null) {
                ResponseUtil.error(resp, 404, "Team not found");
                return;
            }
            String teamName = team.getTeamName();

            // Remove all members: save last team info, set team=null
            // Set team_isactive=false, nhưng các user vẫn còn trong team
            // Cần setLastTeamInfo để họ biết team đã bị ban khi login
            List<Object[]> members = teamDao.getMembers(teamId, null);
            for (Object[] m : members) {
                int uid = ((Number) m[0]).intValue();
                userDao.setLastTeamInfo(uid, teamName, "TEAM_BANNED");
            }

            teamDao.setInactive(teamId);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Team banned. Members removed.");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    // PUT /admin/team/reactivate?id=X
    private void handleReactivate(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int teamId = Integer.parseInt(idParam.trim());
            teamDao.setActive(teamId);
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Team reactivated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
