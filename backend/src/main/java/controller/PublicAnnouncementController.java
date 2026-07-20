// Controller công khai lấy announcements
package controller;

import dao.AnnouncementDao;
import dao.UserDao;
import entity.Announcement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/announcements", "/api/v1/announcements/latest", "/api/v1/announcements/list", "/api/v1/announcements/pinned"})
public class PublicAnnouncementController extends HttpServlet {

    private AnnouncementDao announcementDao = new AnnouncementDao();
    private UserDao userDao = new UserDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/latest")) {
            handleLatest(req, resp);
        } else if (uri.endsWith("/list")) {
            handleList(req, resp);
        } else if (uri.endsWith("/pinned")) {
            handlePinned(req, resp);
        } else {
            String idParam = req.getParameter("id");
            if (idParam != null && !idParam.trim().isEmpty()) {
                handleGetById(req, resp);
            } else {
                handleAll(req, resp);
            }
        }
    }

    private void handleLatest(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Announcement a = announcementDao.findLatestRecent();
        if (a == null) {
            ResponseUtil.success(resp, Map.of("data", null));
            return;
        }

        Map<String, Object> item = new HashMap<>();
        item.put("id", a.getAnnId());
        item.put("type", a.getAnnType());
        item.put("title", a.getAnnTitle());
        item.put("createdAt", a.getAnnCreatedat());

        ResponseUtil.success(resp, Map.of("data", item));
    }

    private void handleList(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int page = 1, limit = 20;
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

        long total = announcementDao.countPublished();
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Announcement> list = announcementDao.findAllPublished(page, limit);

        List<Map<String, Object>> dataList = buildAnnouncementList(list);
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

    private void handlePinned(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        List<Announcement> list = announcementDao.findAllPinned();
        List<Map<String, Object>> dataList = buildAnnouncementList(list);
        ResponseUtil.success(resp, Map.of("data", dataList));
    }

    private List<Map<String, Object>> buildAnnouncementList(List<Announcement> list) {
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
            // Resolve author name + isAdmin
            entity.User author = a.getAnnAuthorid() != null ? userDao.findById(a.getAnnAuthorid()) : null;
            item.put("authorName", author != null ? author.getUserName() : "Unknown");
            item.put("authorIsAdmin", author != null && author.getUserIsadmin() != null && author.getUserIsadmin());
            dataList.add(item);
        }
        return dataList;
    }

    private void handleGetById(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        try {
            int id = Integer.parseInt(req.getParameter("id").trim());
            Announcement a = announcementDao.findById(id);
            if (a == null || !Boolean.TRUE.equals(a.getAnnIspublished())) {
                ResponseUtil.error(resp, 404, "Announcement not found");
                return;
            }
            List<Map<String, Object>> dataList = buildAnnouncementList(List.of(a));
            ResponseUtil.success(resp, Map.of("data", dataList.isEmpty() ? null : dataList.get(0)));
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleAll(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        List<Announcement> list = announcementDao.findActive();
        List<Map<String, Object>> dataList = buildAnnouncementList(list);
        ResponseUtil.success(resp, Map.of("data", dataList));
    }
}
