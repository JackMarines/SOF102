// Controller xử lý API lấy danh sách puzzle
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.PuzzleDao;
import entity.Puzzle;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/v1/puzzles")
public class PuzzleController extends HttpServlet {

    private PuzzleDao puzzleDao = new PuzzleDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        // Nếu có ?id= thì trả về chi tiết 1 puzzle
        String idParam = req.getParameter("id");
        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                int id = Integer.parseInt(idParam.trim());
                Puzzle p = puzzleDao.findById(id);
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
                data.put("difficulty", p.getPuzDifficulty());
                data.put("score", p.getPuzScore());

                ResponseUtil.success(resp, data);
                return;
            } catch (NumberFormatException e) {
                ResponseUtil.error(resp, 400, "Invalid id format");
                return;
            }
        }

        // Không có ?id= → trả về danh sách có phân trang
        int page = 1;
        int limit = 10;
        String search = req.getParameter("search");
        String difficulty = req.getParameter("difficulty");
        String language = req.getParameter("language");

        if (req.getParameter("page") != null) {
            try {
                page = Integer.parseInt(req.getParameter("page"));
                if (page < 1) page = 1;
            } catch (NumberFormatException e) {
                // giữ nguyên page = 1
            }
        }
        if (req.getParameter("limit") != null) {
            try {
                limit = Integer.parseInt(req.getParameter("limit"));
                if (limit < 1) limit = 1;
                if (limit > 100) limit = 100;
            } catch (NumberFormatException e) {
                // giữ nguyên limit = 10
            }
        }

        long total = puzzleDao.count(search, difficulty, language);
        int totalPages = (int) Math.ceil((double) total / limit);
        List<Puzzle> puzzles = puzzleDao.findAll(page, limit, search, difficulty, language);

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Puzzle p : puzzles) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", p.getPuzId());
            item.put("title", p.getPuzTitle());
            item.put("language", p.getLanguage() != null ? p.getLanguage().getLangName() : null);
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
}
