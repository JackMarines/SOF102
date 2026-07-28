// Controller xử lý admin progress CRUD
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.ProgressDao;
import entity.Progress;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.*;

@WebServlet("/api/v1/admin/progress")
public class AdminProgressController extends HttpServlet {

    private ProgressDao progressDao = new ProgressDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String userParam = req.getParameter("user");
        String puzzleParam = req.getParameter("puzzle");
        String emailParam = req.getParameter("email");

        List<Progress> list;
        if (userParam != null && !userParam.trim().isEmpty()) {
            try {
                list = progressDao.findByUserId(Integer.parseInt(userParam.trim()));
            } catch (NumberFormatException e) {
                ResponseUtil.error(resp, 400, "Invalid user id");
                return;
            }
        } else if (puzzleParam != null && !puzzleParam.trim().isEmpty()) {
            try {
                list = progressDao.findByPuzId(Integer.parseInt(puzzleParam.trim()));
            } catch (NumberFormatException e) {
                ResponseUtil.error(resp, 400, "Invalid puzzle id");
                return;
            }
        } else if (emailParam != null && !emailParam.trim().isEmpty()) {
            list = progressDao.findByEmail(emailParam.trim());
        } else {
            ResponseUtil.error(resp, 400, "Provide user, puzzle, or email");
            return;
        }

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Progress p : list) {
            Map<String, Object> item = new HashMap<>();
            item.put("progId", p.getProgId());
            item.put("userId", p.getUserId());
            item.put("puzId", p.getPuzId());
            item.put("progDate", p.getProgDate());
            item.put("progTime", p.getProgTime());
            item.put("progCode", p.getProgCode());
            dataList.add(item);
        }
        ResponseUtil.success(resp, Map.of("data", dataList));
    }

    @SuppressWarnings("unchecked")
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Map<String, Object> body;
        try {
            body = objectMapper.readValue(req.getReader(), Map.class);
        } catch (Exception e) {
            ResponseUtil.error(resp, 400, "Invalid JSON");
            return;
        }

        Object userIdObj = body.get("userId");
        Object puzIdObj = body.get("puzId");
        if (userIdObj == null || puzIdObj == null) {
            ResponseUtil.error(resp, 400, "userId and puzId are required");
            return;
        }

        Progress p = new Progress();
        p.setUserId(((Number) userIdObj).intValue());
        p.setPuzId(((Number) puzIdObj).intValue());
        p.setProgDate(body.get("progDate") != null
            ? Timestamp.valueOf((String) body.get("progDate"))
            : new Timestamp(System.currentTimeMillis()));
        p.setProgTime(body.get("progTime") != null
            ? ((Number) body.get("progTime")).intValue() : null);
        p.setProgCode((String) body.get("progCode"));

        progressDao.create(p);

        Map<String, Object> data = new HashMap<>();
        data.put("progId", p.getProgId());
        data.put("message", "Progress created");
        ResponseUtil.success(resp, data);
    }

    @SuppressWarnings("unchecked")
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int progId = Integer.parseInt(idParam.trim());
            Progress existing = progressDao.findByUserId(progId).stream()
                .filter(p -> p.getProgId() == progId).findFirst().orElse(null);

            if (existing == null) {
                // Try to find by progId directly
                ResponseUtil.error(resp, 404, "Progress not found");
                return;
            }

            Map<String, Object> body = objectMapper.readValue(req.getReader(), Map.class);
            if (body.containsKey("progTime")) existing.setProgTime(((Number) body.get("progTime")).intValue());
            if (body.containsKey("progCode")) existing.setProgCode((String) body.get("progCode"));
            if (body.containsKey("progDate")) existing.setProgDate(Timestamp.valueOf((String) body.get("progDate")));

            progressDao.update(existing);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Progress updated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");

        // Không có id → xoá toàn bộ progress
        if (idParam == null || idParam.trim().isEmpty()) {
            progressDao.deleteAll();
            Map<String, Object> data = new HashMap<>();
            data.put("message", "All progress deleted");
            ResponseUtil.success(resp, data);
            return;
        }

        try {
            progressDao.delete(Integer.parseInt(idParam.trim()));
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Progress deleted");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
