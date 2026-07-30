// Controller công khai lấy announcements — dùng JOIN query + cache để tối ưu tốc độ
package controller;

import dao.AnnouncementDao;
import entity.Announcement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.AnnouncementCache;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/announcements", "/api/v1/announcements/latest", "/api/v1/announcements/list", "/api/v1/announcements/pinned"})
public class PublicAnnouncementController extends HttpServlet {

    private AnnouncementDao announcementDao = new AnnouncementDao();

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
        // Kiểm tra cache trước
        String cacheKey = "latest";
        Object cached = AnnouncementCache.get(cacheKey);
        if (cached != null) {
            ResponseUtil.success(resp, Map.of("data", cached));
            return;
        }

        Object[] row = announcementDao.findLatestRecentWithAuthor();
        if (row == null) {
            ResponseUtil.success(resp, Map.of("data", null));
            return;
        }

        Map<String, Object> item = buildAnnouncementItem(row);
        AnnouncementCache.put(cacheKey, item);
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

        // Kiểm tra cache trước
        String cacheKey = "list:" + page + ":" + limit;
        Object cached = AnnouncementCache.get(cacheKey);
        if (cached != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> cachedResult = (Map<String, Object>) cached;
            ResponseUtil.success(resp, cachedResult);
            return;
        }

        long total = announcementDao.countPublished();
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Object[]> rows = announcementDao.findPublishedWithAuthors(page, limit);

        List<Map<String, Object>> dataList = buildAnnouncementList(rows);
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", total);
        pagination.put("totalPages", totalPages);

        Map<String, Object> result = new HashMap<>();
        result.put("data", dataList);
        result.put("pagination", pagination);

        AnnouncementCache.put(cacheKey, result);
        ResponseUtil.success(resp, result);
    }

    private void handlePinned(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String cacheKey = "pinned";
        Object cached = AnnouncementCache.get(cacheKey);
        if (cached != null) {
            ResponseUtil.success(resp, Map.of("data", cached));
            return;
        }

        List<Object[]> rows = announcementDao.findPinnedWithAuthors();
        List<Map<String, Object>> dataList = buildAnnouncementList(rows);
        AnnouncementCache.put(cacheKey, dataList);
        ResponseUtil.success(resp, Map.of("data", dataList));
    }

    // Xây danh sách từ mảng Object[] — không còn N+1 queries
    private List<Map<String, Object>> buildAnnouncementList(List<Object[]> rows) {
        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Object[] row : rows) {
            dataList.add(buildAnnouncementItem(row));
        }
        return dataList;
    }

    // Xây 1 item từ 1 dòng kết quả native query (đã JOIN sẵn user + trophy)
    private Map<String, Object> buildAnnouncementItem(Object[] row) {
        Map<String, Object> item = new HashMap<>();
        // row[0..8] = announcement fields
        item.put("id",            row[0]);
        item.put("title",         row[1]);
        item.put("content",       row[2]);
        item.put("authorId",      row[3]);
        item.put("createdAt",     row[4]);
        item.put("updatedAt",     row[5]);
        // row[6,7,11] = TINYINT(1) → Boolean từ MySQL JDBC
        item.put("isPinned",      Boolean.TRUE.equals(row[6]));
        item.put("isPublished",   Boolean.TRUE.equals(row[7]));
        item.put("type",          row[8]);
        // row[9] = user_name, row[10] = user_avatar, row[11] = user_isadmin
        item.put("authorName",                row[9]  != null ? row[9]  : "Unknown");
        item.put("authorAvatar",              row[10]);
        item.put("authorIsAdmin",             Boolean.TRUE.equals(row[11]));
        // row[12] = trop_avatar
        item.put("authorSelectedTrophyAvatar", row[12]);
        return item;
    }

    private void handleGetById(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        try {
            int id = Integer.parseInt(req.getParameter("id").trim());
            Map<String, Object> cachedItem = null;
            // Thử tìm trong cache trước (nếu có)
            String cacheKey = "detail:" + id;
            Object cached = AnnouncementCache.get(cacheKey);
            if (cached != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> m = (Map<String, Object>) cached;
                cachedItem = m;
            }

            if (cachedItem != null) {
                ResponseUtil.success(resp, Map.of("data", cachedItem));
                return;
            }

            Object[] row = announcementDao.findByIdWithAuthor(id);
            if (row == null) {
                // Kiểm tra kỹ: có thể announcement tồn tại nhưng chưa published
                Announcement a = announcementDao.findById(id);
                if (a == null || !Boolean.TRUE.equals(a.getAnnIspublished())) {
                    ResponseUtil.error(resp, 404, "Announcement not found");
                    return;
                }
                ResponseUtil.error(resp, 404, "Announcement not found");
                return;
            }
            Map<String, Object> item = buildAnnouncementItem(row);
            AnnouncementCache.put(cacheKey, item);
            ResponseUtil.success(resp, Map.of("data", item));
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleAll(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String cacheKey = "active";
        Object cached = AnnouncementCache.get(cacheKey);
        if (cached != null) {
            ResponseUtil.success(resp, Map.of("data", cached));
            return;
        }

        List<Object[]> rows = announcementDao.findActiveWithAuthors();
        List<Map<String, Object>> dataList = buildAnnouncementList(rows);
        AnnouncementCache.put(cacheKey, dataList);
        ResponseUtil.success(resp, Map.of("data", dataList));
    }
}
