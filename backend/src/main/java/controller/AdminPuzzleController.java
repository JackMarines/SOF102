// Controller xử lý admin puzzle CRUD
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.LanguageDao;
import dao.PuzzleDao;
import entity.Language;
import entity.Puzzle;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/admin/puzzles", "/api/v1/admin/puzzle", "/api/v1/admin/languages"})
public class AdminPuzzleController extends HttpServlet {

    private PuzzleDao puzzleDao = new PuzzleDao();
    private LanguageDao languageDao = new LanguageDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/puzzles")) {
            handleListPuzzles(req, resp);
        } else if (uri.endsWith("/languages")) {
            handleListLanguages(resp);
        } else if (uri.endsWith("/puzzle")) {
            handleGetPuzzle(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleCreatePuzzle(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleUpdatePuzzle(req, resp);
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
            puzzleDao.delete(Integer.parseInt(idParam.trim()));
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Puzzle deleted");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleListPuzzles(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int page = 1, limit = 10;
        String search = req.getParameter("search");
        String difficulty = req.getParameter("difficulty");
        String language = req.getParameter("language");

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

        long total = puzzleDao.count(search, difficulty, language);
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Puzzle> puzzles = puzzleDao.findAll(page, limit, search, difficulty, language);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Puzzle p : puzzles) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", p.getPuzId());
            item.put("title", p.getPuzTitle());
            item.put("content", p.getPuzContent());
            item.put("functionName", p.getPuzFunction());
            item.put("language", p.getLanguage() != null ? p.getLanguage().getLangName() : null);
            item.put("languageId", p.getLanguage() != null ? p.getLanguage().getLangId() : null);
            item.put("difficulty", p.getPuzDifficulty());
            item.put("score", p.getPuzScore());
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

    private void handleGetPuzzle(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            Puzzle p = puzzleDao.findById(Integer.parseInt(idParam.trim()));
            if (p == null) {
                ResponseUtil.error(resp, 404, "Puzzle not found");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("id", p.getPuzId());
            data.put("title", p.getPuzTitle());
            data.put("content", p.getPuzContent());
            data.put("functionName", p.getPuzFunction());
            data.put("language", p.getLanguage() != null ? p.getLanguage().getLangName() : null);
            data.put("languageId", p.getLanguage() != null ? p.getLanguage().getLangId() : null);
            data.put("difficulty", p.getPuzDifficulty());
            data.put("score", p.getPuzScore());
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleListLanguages(HttpServletResponse resp) throws IOException {
        List<Language> languages = languageDao.findAll();
        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Language l : languages) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", l.getLangId());
            item.put("name", l.getLangName());
            dataList.add(item);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("data", dataList);
        ResponseUtil.success(resp, result);
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

    private void handleCreatePuzzle(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Map<String, Object> body = readJsonBody(req);
        String title = (String) body.get("title");
        if (title == null || title.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "title is required");
            return;
        }

        Puzzle puzzle = new Puzzle();
        puzzle.setPuzTitle(title.trim());
        puzzle.setPuzContent((String) body.get("content"));
        puzzle.setPuzFunction((String) body.get("functionName"));
        puzzle.setPuzDifficulty((String) body.get("difficulty"));
        puzzle.setPuzScore(body.get("score") != null ? ((Number) body.get("score")).intValue() : 0);

        Object langId = body.get("languageId");
        if (langId != null) {
            Language l = languageDao.findById(((Number) langId).intValue());
            if (l != null) puzzle.setLanguage(l);
        }

        puzzleDao.create(puzzle);

        Map<String, Object> data = new HashMap<>();
        data.put("id", puzzle.getPuzId());
        data.put("message", "Puzzle created");
        ResponseUtil.success(resp, data);
    }

    private void handleUpdatePuzzle(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int pid = Integer.parseInt(idParam.trim());
            Puzzle puzzle = puzzleDao.findById(pid);
            if (puzzle == null) {
                ResponseUtil.error(resp, 404, "Puzzle not found");
                return;
            }

            Map<String, Object> body = readJsonBody(req);
            if (body.containsKey("title")) puzzle.setPuzTitle(((String) body.get("title")).trim());
            if (body.containsKey("content")) puzzle.setPuzContent((String) body.get("content"));
            if (body.containsKey("functionName")) puzzle.setPuzFunction((String) body.get("functionName"));
            if (body.containsKey("difficulty")) puzzle.setPuzDifficulty((String) body.get("difficulty"));
            if (body.containsKey("score")) puzzle.setPuzScore(((Number) body.get("score")).intValue());
            if (body.containsKey("languageId")) {
                Language l = languageDao.findById(((Number) body.get("languageId")).intValue());
                if (l != null) puzzle.setLanguage(l);
            }

            puzzleDao.update(puzzle);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Puzzle updated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
