// Controller xử lý admin announcement CRUD
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.AnnouncementDao;
import entity.Announcement;
import entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.*;

@WebServlet({"/api/v1/admin/announcements", "/api/v1/admin/announcement"})
public class AdminAnnouncementController extends HttpServlet {

    private AnnouncementDao announcementDao = new AnnouncementDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/announcements")) {
            handleListAnnouncements(req, resp);
        } else if (uri.endsWith("/announcement")) {
            handleGetAnnouncement(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleCreateAnnouncement(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleUpdateAnnouncement(req, resp);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            announcementDao.delete(Integer.parseInt(idParam.trim()));
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Announcement deleted");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleListAnnouncements(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int page = 1, limit = 10;
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

        long total = announcementDao.count();
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Announcement> list = announcementDao.findAll(page, limit);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Announcement a : list) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.getAnnId());
            item.put("title", a.getAnnTitle());
            item.put("content", a.getAnnContent());
            item.put("authorId", a.getAnnAuthorid());
            item.put("createdAt", a.getAnnCreatedat());
            item.put("updatedAt", a.getAnnUpdatedat());
            item.put("isPinned", a.getAnnIspinned());
            item.put("isPublished", a.getAnnIspublished());
            item.put("type", a.getAnnType());
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

    private void handleGetAnnouncement(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            Announcement a = announcementDao.findById(Integer.parseInt(idParam.trim()));
            if (a == null) {
                ResponseUtil.error(resp, 404, "Announcement not found");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("id", a.getAnnId());
            data.put("title", a.getAnnTitle());
            data.put("content", a.getAnnContent());
            data.put("authorId", a.getAnnAuthorid());
            data.put("createdAt", a.getAnnCreatedat());
            data.put("updatedAt", a.getAnnUpdatedat());
            data.put("isPinned", a.getAnnIspinned());
            data.put("isPublished", a.getAnnIspublished());
            data.put("type", a.getAnnType());
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readJsonBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (java.io.BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }
        if (sb.length() == 0) return new HashMap<>();
        return objectMapper.readValue(sb.toString(), Map.class);
    }

    private void handleCreateAnnouncement(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        Map<String, Object> body = readJsonBody(req);
        String title = (String) body.get("title");
        if (title == null || title.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "title is required");
            return;
        }

        Announcement a = new Announcement();
        a.setAnnTitle(title.trim());
        a.setAnnContent((String) body.get("content"));
        a.setAnnAuthorid(sessionUser.getUserId());
        a.setAnnCreatedat(new Timestamp(System.currentTimeMillis()));
        if (body.containsKey("isPinned")) a.setAnnIspinned((Boolean) body.get("isPinned"));
        if (body.containsKey("isPublished")) a.setAnnIspublished((Boolean) body.get("isPublished"));
        if (body.containsKey("type")) a.setAnnType((String) body.get("type"));

        announcementDao.create(a);

        Map<String, Object> data = new HashMap<>();
        data.put("id", a.getAnnId());
        data.put("message", "Announcement created");
        ResponseUtil.success(resp, data);
    }

    private void handleUpdateAnnouncement(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int aid = Integer.parseInt(idParam.trim());
            Announcement a = announcementDao.findById(aid);
            if (a == null) {
                ResponseUtil.error(resp, 404, "Announcement not found");
                return;
            }

            Map<String, Object> body = readJsonBody(req);
            if (body.containsKey("title")) a.setAnnTitle(((String) body.get("title")).trim());
            if (body.containsKey("content")) a.setAnnContent((String) body.get("content"));
            if (body.containsKey("isPinned")) a.setAnnIspinned((Boolean) body.get("isPinned"));
            if (body.containsKey("isPublished")) a.setAnnIspublished((Boolean) body.get("isPublished"));
            if (body.containsKey("type")) a.setAnnType((String) body.get("type"));
            a.setAnnUpdatedat(new Timestamp(System.currentTimeMillis()));

            announcementDao.update(a);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Announcement updated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
