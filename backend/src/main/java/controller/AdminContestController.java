// Controller xử lý admin contest CRUD
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.ContestDao;
import dao.TrophyDao;
import entity.Contest;
import entity.Trophy;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.*;

@WebServlet({"/api/v1/admin/contests", "/api/v1/admin/contest"})
public class AdminContestController extends HttpServlet {

    private ContestDao contestDao = new ContestDao();
    private TrophyDao trophyDao = new TrophyDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/contests")) {
            handleListContests(req, resp);
        } else if (uri.endsWith("/contest")) {
            handleGetContest(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleCreateContest(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleUpdateContest(req, resp);
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
            contestDao.delete(Integer.parseInt(idParam.trim()));
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Contest deleted");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleListContests(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int page = 1, limit = 10;
        String search = req.getParameter("search");

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

        long total = contestDao.count(search);
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Contest> contests = contestDao.findAll(page, limit, search);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Contest c : contests) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getConId());
            item.put("title", c.getConTitle());
            item.put("content", c.getConContent());
            item.put("start", c.getConStart());
            item.put("end", c.getConEnd());
            item.put("avatar", c.getConAvatar());
            item.put("trophyId", c.getTrophy() != null ? c.getTrophy().getTropId() : null);
            item.put("trophyName", c.getTrophy() != null ? c.getTrophy().getTropName() : null);
            item.put("authorId", c.getConAuthorId());
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

    private void handleGetContest(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            Contest c = contestDao.findById(Integer.parseInt(idParam.trim()));
            if (c == null) {
                ResponseUtil.error(resp, 404, "Contest not found");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("id", c.getConId());
            data.put("title", c.getConTitle());
            data.put("content", c.getConContent());
            data.put("start", c.getConStart());
            data.put("end", c.getConEnd());
            data.put("avatar", c.getConAvatar());
            data.put("trophyId", c.getTrophy() != null ? c.getTrophy().getTropId() : null);
            data.put("trophyName", c.getTrophy() != null ? c.getTrophy().getTropName() : null);
            data.put("authorId", c.getConAuthorId());
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleCreateContest(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Map<String, Object> body = readJsonBody(req);
        String title = (String) body.get("title");
        if (title == null || title.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "title is required");
            return;
        }

        Contest contest = new Contest();
        contest.setConTitle(title.trim());
        contest.setConContent((String) body.get("content"));
        contest.setConAvatar((String) body.get("avatar"));
        contest.setConStart(parseTimestamp(body.get("start")));
        contest.setConEnd(parseTimestamp(body.get("end")));
        if (body.get("authorId") != null) contest.setConAuthorId(((Number) body.get("authorId")).intValue());

        Object trophyId = body.get("trophyId");
        if (trophyId != null) {
            Trophy t = trophyDao.findById(((Number) trophyId).intValue());
            if (t != null) contest.setTrophy(t);
        }

        contestDao.create(contest);

        Map<String, Object> data = new HashMap<>();
        data.put("id", contest.getConId());
        data.put("message", "Contest created");
        ResponseUtil.success(resp, data);
    }

    private void handleUpdateContest(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int cid = Integer.parseInt(idParam.trim());
            Contest contest = contestDao.findById(cid);
            if (contest == null) {
                ResponseUtil.error(resp, 404, "Contest not found");
                return;
            }

            Map<String, Object> body = readJsonBody(req);
            if (body.containsKey("title")) contest.setConTitle(((String) body.get("title")).trim());
            if (body.containsKey("content")) contest.setConContent((String) body.get("content"));
            if (body.containsKey("avatar")) contest.setConAvatar((String) body.get("avatar"));
            if (body.containsKey("start")) contest.setConStart(parseTimestamp(body.get("start")));
            if (body.containsKey("end")) contest.setConEnd(parseTimestamp(body.get("end")));
            if (body.containsKey("authorId")) contest.setConAuthorId(body.get("authorId") != null ? ((Number) body.get("authorId")).intValue() : null);
            if (body.containsKey("trophyId")) {
                Object trophyId = body.get("trophyId");
                if (trophyId != null) {
                    Trophy t = trophyDao.findById(((Number) trophyId).intValue());
                    if (t != null) contest.setTrophy(t);
                } else {
                    contest.setTrophy(null);
                }
            }

            contestDao.update(contest);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Contest updated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private Timestamp parseTimestamp(Object value) {
        if (value == null) return null;
        if (value instanceof String) {
            return Timestamp.valueOf((String) value);
        }
        if (value instanceof Number) {
            return new Timestamp(((Number) value).longValue());
        }
        return null;
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
}
