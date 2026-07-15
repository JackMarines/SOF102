// Controller tìm kiếm user trên toàn hệ thống (guest + auth đều dùng được)
package controller;

import dao.UserDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet("/api/v1/users")
public class UserSearchController extends HttpServlet {

    private UserDao userDao = new UserDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String query = req.getParameter("search");
        if (query == null || query.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "search is required");
            return;
        }

        int page = 1;
        int limit = 10;
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

        long total = userDao.countSearch(query.trim());
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Object[]> rows = userDao.search(page, limit, query.trim());

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new HashMap<>();
            item.put("userId", row[0]);
            item.put("displayName", row[1]);
            item.put("avatar", row[2]);
            item.put("isAdmin", row[3]);
            item.put("groupName", row[4]);
            item.put("totalScore", row[5]);
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
}
