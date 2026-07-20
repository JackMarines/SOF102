// Controller xử lý upload ảnh team lên R2
package controller;

import dao.TeamDao;
import dao.UserDao;
import entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import util.R2Util;
import util.ResponseUtil;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/v1/upload/team-avatar")
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024,
    maxFileSize = 5 * 1024 * 1024,
    maxRequestSize = 6 * 1024 * 1024
)
public class TeamUploadController extends HttpServlet {

    private final TeamDao teamDao = new TeamDao();
    private final UserDao userDao = new UserDao();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        if (!R2Util.isConfigured()) {
            ResponseUtil.error(resp, 500, "R2 not configured");
            return;
        }

        Part filePart = req.getPart("file");
        if (filePart == null || filePart.getSize() == 0) {
            ResponseUtil.error(resp, 400, "file is required");
            return;
        }

        String contentType = filePart.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            ResponseUtil.error(resp, 400, "Only image files are allowed");
            return;
        }

        String teamIdStr = req.getParameter("teamId");
        if (teamIdStr == null || teamIdStr.isEmpty()) {
            ResponseUtil.error(resp, 400, "teamId is required");
            return;
        }

        int teamId;
        try {
            teamId = Integer.parseInt(teamIdStr);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid teamId");
            return;
        }

        // Kiểm tra user là chủ của team này
        User user = userDao.findById(sessionUser.getUserId());
        if (user == null || user.getTeam() == null) {
            ResponseUtil.error(resp, 400, "Not in a team");
            return;
        }
        if (!teamDao.isOwner(teamId, user.getUserId())) {
            ResponseUtil.error(resp, 403, "Only the team owner can upload avatar");
            return;
        }

        String url = R2Util.uploadTeamAvatar(
            teamId,
            filePart.getInputStream(),
            filePart.getSize(),
            contentType);

        if (url == null) {
            ResponseUtil.error(resp, 500, "Upload failed");
            return;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("url", url);
        ResponseUtil.success(resp, data);
    }
}
