// Controller xử lý API team - thay đổi dữ liệu (tạo, sửa, join, leave, shoutout, transfer, giải tán)
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.TeamDao;
import dao.UserDao;
import entity.Team;
import entity.User;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import util.JpaUtils;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/teams/create", "/api/v1/teams/join", "/api/v1/teams/leave", "/api/v1/teams/kick",
             "/api/v1/teams/update", "/api/v1/teams/shoutout",
             "/api/v1/teams/transfer", "/api/v1/teams/disband"})
public class TeamManageController extends HttpServlet {

    private TeamDao teamDao = new TeamDao();
    private UserDao userDao = new UserDao();
    private ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(TeamManageController.class);
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/create")) {
            handleCreate(req, resp);
        } else if (uri.endsWith("/join")) {
            handleJoin(req, resp);
        } else if (uri.endsWith("/leave")) {
            handleLeave(req, resp);
        } else if (uri.endsWith("/kick")) {
            handleKick(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/update")) {
            handleUpdate(req, resp);
        } else if (uri.endsWith("/shoutout")) {
            handleUpdateShoutout(req, resp);
        } else if (uri.endsWith("/transfer")) {
            handleTransfer(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/disband")) {
            handleDisband(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    // POST /api/v1/teams/create — tạo team mới
    private void handleCreate(HttpServletRequest req, HttpServletResponse resp)
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

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getReader(), Map.class);
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid JSON");
            return;
        }

        String name = (String) body.get("name");
        if (name == null || name.trim().isEmpty() || name.length() > 100) {
            ResponseUtil.error(resp, 400, "Team name must be 1-100 characters");
            return;
        }

        if (user.getTeam() != null) {
            if (teamDao.isOwner(user.getTeam().getTeamId(), user.getUserId())) {
                ResponseUtil.error(resp, 400, "You already own a team. Disband it first.");
                return;
            }
            userDao.setTeam(user.getUserId(), null);
        }

        Team team = new Team();
        team.setTeamName(name.trim());
        team.setTeamAvatar((String) body.get("avatar"));
        team.setTeamShoutout((String) body.get("shoutout"));
        Boolean isPublic = (Boolean) body.get("isPublic");
        team.setTeamIsPublic(isPublic != null ? isPublic : true);

        teamDao.create(team);
        team.setTeamOwnerId(user.getUserId());
        teamDao.update(team);
        userDao.setTeam(user.getUserId(), team);

        logger.info("Team created: id={}, name={}", team.getTeamId(), name);

        Map<String, Object> data = new HashMap<>();
        data.put("teamId", team.getTeamId());
        data.put("message", "Team created");
        ResponseUtil.success(resp, data);
    }

    // POST /api/v1/teams/join — tham gia team
    private void handleJoin(HttpServletRequest req, HttpServletResponse resp)
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
        if (user.getTeam() != null) {
            if (teamDao.isOwner(user.getTeam().getTeamId(), user.getUserId())) {
                ResponseUtil.error(resp, 400, "You own a team. Transfer ownership or disband first.");
                return;
            }
            ResponseUtil.error(resp, 400, "Already in a team. Leave it first.");
            return;
        }

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getReader(), Map.class);
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid JSON");
            return;
        }

        Object teamIdObj = body.get("teamId");
        if (teamIdObj == null) {
            ResponseUtil.error(resp, 400, "teamId is required");
            return;
        }

        int teamId;
        try {
            teamId = ((Number) teamIdObj).intValue();
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid teamId");
            return;
        }

        Team team = teamDao.findById(teamId);
        if (team == null) {
            ResponseUtil.error(resp, 404, "Team not found");
            return;
        }
        if (Boolean.FALSE.equals(team.getTeamIsPublic())) {
            ResponseUtil.error(resp, 400, "This team is private. Cannot join.");
            return;
        }

        userDao.setTeam(user.getUserId(), team);

        logger.info("User {} joined team {}", user.getUserId(), teamId);

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Joined team");
        data.put("teamId", team.getTeamId());
        data.put("teamName", team.getTeamName());
        ResponseUtil.success(resp, data);
    }

    // POST /api/v1/teams/leave — rời team
    private void handleLeave(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        User user = userDao.findById(sessionUser.getUserId());
        if (user == null || user.getTeam() == null) {
            ResponseUtil.error(resp, 400, "Not in a team");
            return;
        }
        if (teamDao.isOwner(user.getTeam().getTeamId(), user.getUserId())) {
            ResponseUtil.error(resp, 400, "You are the owner. Transfer ownership or disband the team first.");
            return;
        }

        userDao.setTeam(user.getUserId(), null);

        logger.info("User {} left team", user.getUserId());

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Left team");
        ResponseUtil.success(resp, data);
    }

    // PUT /api/v1/teams/update — sửa thông tin team
    private void handleUpdate(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        User user = userDao.findById(sessionUser.getUserId());
        if (user == null || user.getTeam() == null) {
            ResponseUtil.error(resp, 400, "Not in a team");
            return;
        }

        Team team = user.getTeam();
        if (!teamDao.isOwner(team.getTeamId(), user.getUserId())) {
            ResponseUtil.error(resp, 403, "Only the team owner can edit");
            return;
        }

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getReader(), Map.class);
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid JSON");
            return;
        }

        String name = (String) body.get("name");
        if (name != null) {
            if (name.trim().isEmpty() || name.length() > 100) {
                ResponseUtil.error(resp, 400, "Team name must be 1-100 characters");
                return;
            }
            team.setTeamName(name.trim());
        }
        if (body.containsKey("avatar")) team.setTeamAvatar((String) body.get("avatar"));
        if (body.containsKey("isPublic")) team.setTeamIsPublic((Boolean) body.get("isPublic"));

        teamDao.update(team);

        logger.info("Team updated: id={}", team.getTeamId());

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Team updated");
        ResponseUtil.success(resp, data);
    }

    // PUT /api/v1/teams/shoutout — sửa shoutout
    private void handleUpdateShoutout(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        User user = userDao.findById(sessionUser.getUserId());
        if (user == null || user.getTeam() == null) {
            ResponseUtil.error(resp, 400, "Not in a team");
            return;
        }

        Team team = user.getTeam();
        if (!teamDao.isOwner(team.getTeamId(), user.getUserId())) {
            ResponseUtil.error(resp, 403, "Only the team owner can edit shoutout");
            return;
        }

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getReader(), Map.class);
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid JSON");
            return;
        }

        String shoutout = (String) body.get("shoutout");
        if (shoutout == null) {
            ResponseUtil.error(resp, 400, "shoutout is required");
            return;
        }
        if (shoutout.length() > 500) {
            ResponseUtil.error(resp, 400, "Shoutout must be at most 500 characters");
            return;
        }

        team.setTeamShoutout(shoutout);
        teamDao.update(team);

        logger.info("Shoutout updated: teamId={}", team.getTeamId());

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Shoutout updated");
        ResponseUtil.success(resp, data);
    }

    // PUT /api/v1/teams/transfer — chuyển quyền sở hữu
    private void handleTransfer(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        User user = userDao.findById(sessionUser.getUserId());
        if (user == null || user.getTeam() == null) {
            ResponseUtil.error(resp, 400, "Not in a team");
            return;
        }

        Team team = user.getTeam();
        if (!teamDao.isOwner(team.getTeamId(), user.getUserId())) {
            ResponseUtil.error(resp, 403, "Only the team owner can transfer ownership");
            return;
        }

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getReader(), Map.class);
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid JSON");
            return;
        }

        Object newOwnerIdObj = body.get("newOwnerId");
        if (newOwnerIdObj == null) {
            ResponseUtil.error(resp, 400, "newOwnerId is required");
            return;
        }

        int newOwnerId;
        try {
            newOwnerId = ((Number) newOwnerIdObj).intValue();
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid newOwnerId");
            return;
        }

        List<Object[]> members = teamDao.getMembers(team.getTeamId(), null);
        boolean isMember = false;
        for (Object[] row : members) {
            if (((Number) row[0]).intValue() == newOwnerId) {
                isMember = true;
                break;
            }
        }
        if (!isMember) {
            ResponseUtil.error(resp, 400, "New owner must be a team member");
            return;
        }

        team.setTeamOwnerId(newOwnerId);
        teamDao.update(team);

        logger.info("Ownership transferred: teamId={}, newOwnerId={}", team.getTeamId(), newOwnerId);

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Ownership transferred");
        ResponseUtil.success(resp, data);
    }

    // POST /api/v1/teams/kick — đá thành viên
    private void handleKick(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        User user = userDao.findById(sessionUser.getUserId());
        if (user == null || user.getTeam() == null) {
            ResponseUtil.error(resp, 400, "Not in a team");
            return;
        }

        Team team = user.getTeam();
        if (!teamDao.isOwner(team.getTeamId(), user.getUserId())) {
            ResponseUtil.error(resp, 403, "Only the team owner can kick members");
            return;
        }

        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getReader(), Map.class);
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid JSON");
            return;
        }

        Object userIdObj = body.get("userId");
        if (userIdObj == null) {
            ResponseUtil.error(resp, 400, "userId is required");
            return;
        }

        int targetUserId;
        try {
            targetUserId = ((Number) userIdObj).intValue();
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid userId");
            return;
        }

        if (targetUserId == user.getUserId()) {
            ResponseUtil.error(resp, 400, "Cannot kick yourself");
            return;
        }

        User targetUser = userDao.findById(targetUserId);
        if (targetUser == null || targetUser.getTeam() == null
                || targetUser.getTeam().getTeamId() != team.getTeamId()) {
            ResponseUtil.error(resp, 400, "User is not a member of your team");
            return;
        }

        userDao.setTeam(targetUserId, null);

        logger.info("User {} kicked from team {} by {}", targetUserId, team.getTeamId(), user.getUserId());

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Member kicked");
        ResponseUtil.success(resp, data);
    }

    // DELETE /api/v1/teams/disband — giải tán team
    private void handleDisband(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        User user = userDao.findById(sessionUser.getUserId());
        if (user == null || user.getTeam() == null) {
            ResponseUtil.error(resp, 400, "Not in a team");
            return;
        }

        Team team = user.getTeam();
        if (!teamDao.isOwner(team.getTeamId(), user.getUserId())) {
            ResponseUtil.error(resp, 403, "Only the team owner can disband");
            return;
        }

        int teamId = team.getTeamId();
        jakarta.persistence.EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            teamDao.deleteWithMembers(em, teamId);
            em.getTransaction().commit();
        } finally {
            em.close();
        }

        logger.info("Team disbanded: id={}", teamId);

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Team disbanded");
        ResponseUtil.success(resp, data);
    }
}
