// Controller xử lý upload ảnh contest avatar lên R2
package controller;

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

@WebServlet("/api/v1/upload/contest-avatar")
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024,
    maxFileSize = 5 * 1024 * 1024,
    maxRequestSize = 6 * 1024 * 1024
)
public class ContestAvatarUploadController extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "User not logged in");
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

        String url = R2Util.uploadContestAvatar(
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
