// Controller xử lý appeal của user (không phải admin)
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.AppealDao;
import dao.TeamDao;
import dao.WarningDao;
import entity.Appeal;
import entity.User;
import entity.Warning;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.*;

@WebServlet("/api/v1/appeal")
public class AppealController extends HttpServlet {

    private AppealDao appealDao = new AppealDao();
    private WarningDao warningDao = new WarningDao();
    private TeamDao teamDao = new TeamDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        List<Appeal> appeals = appealDao.findByApplicantId(sessionUser.getUserId());
        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Appeal a : appeals) {
            Map<String, Object> item = new HashMap<>();
            item.put("appealId", a.getAppId());
            item.put("message", a.getAppContent());
            item.put("status", a.getAppStatus());
            item.put("createdDate", a.getAppDate());
            if (a.getAppReviewedby() != null) {
                var em = util.JpaUtils.getEntityManager();
                try {
                    User reviewer = em.find(User.class, a.getAppReviewedby());
                    item.put("reviewedBy", reviewer != null ? reviewer.getUserName() : "Unknown");
                } finally {
                    em.close();
                }
                item.put("reviewedAt", a.getAppReviewdate());
            }
            dataList.add(item);
        }
        ResponseUtil.success(resp, Map.of("data", dataList));
    }

    @SuppressWarnings("unchecked")
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
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

        String message = (String) body.get("message");
        if (message == null || message.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "message is required");
            return;
        }

        // Find active warning for this user
        Warning activeWarning = warningDao.findActiveByUserId(sessionUser.getUserId());
        if (activeWarning == null && sessionUser.getTeam() != null) {
            if (teamDao.isOwner(sessionUser.getTeam().getTeamId(), sessionUser.getUserId())) {
                activeWarning = warningDao.findActiveByTeamId(sessionUser.getTeam().getTeamId());
            }
        }
        if (activeWarning == null) {
            ResponseUtil.error(resp, 400, "No active warning to appeal");
            return;
        }

        // Check for duplicate PENDING appeal
        List<Appeal> existing = appealDao.findByApplicantId(sessionUser.getUserId());
        for (Appeal ea : existing) {
            if ("PENDING".equals(ea.getAppStatus())) {
                ResponseUtil.error(resp, 400, "You already have a pending appeal");
                return;
            }
        }

        Appeal appeal = new Appeal();
        appeal.setAppByid(sessionUser.getUserId());
        appeal.setAppContent(message.trim());
        appeal.setAppDate(new Timestamp(System.currentTimeMillis()));
        appeal.setAppStatus("PENDING");
        appeal.setAppWarnid(activeWarning.getWarnId());

        appealDao.create(appeal);

        Map<String, Object> data = new HashMap<>();
        data.put("appealId", appeal.getAppId());
        data.put("message", "Appeal submitted");
        ResponseUtil.success(resp, data);
    }
}
