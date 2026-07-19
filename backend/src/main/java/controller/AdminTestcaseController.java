// Controller xử lý admin testcase CRUD
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.TestcaseDao;
import entity.Testcase;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/admin/testcases", "/api/v1/admin/testcase"})
public class AdminTestcaseController extends HttpServlet {

    private TestcaseDao testcaseDao = new TestcaseDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/testcases")) {
            handleListTestcases(req, resp);
        } else if (uri.endsWith("/testcase")) {
            handleGetTestcase(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleCreateTestcase(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleUpdateTestcase(req, resp);
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
            testcaseDao.delete(Integer.parseInt(idParam.trim()));
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Testcase deleted");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleListTestcases(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String puzzleParam = req.getParameter("puzzle");
        if (puzzleParam == null || puzzleParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "puzzle is required");
            return;
        }
        try {
            int puzId = Integer.parseInt(puzzleParam.trim());
            List<Testcase> list = testcaseDao.getTestcasesByPuzzleId(puzId);
            List<Map<String, Object>> dataList = new ArrayList<>();
            for (Testcase t : list) {
                Map<String, Object> item = new HashMap<>();
                item.put("tcId", t.getTcId());
                item.put("input", t.getTcInput());
                item.put("output", t.getTcOutput());
                item.put("puzId", t.getPuzId());
                dataList.add(item);
            }
            ResponseUtil.success(resp, Map.of("data", dataList));
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid puzzle id");
        }
    }

    private void handleGetTestcase(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            Testcase t = testcaseDao.findById(Integer.parseInt(idParam.trim()));
            if (t == null) {
                ResponseUtil.error(resp, 404, "Testcase not found");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("tcId", t.getTcId());
            data.put("input", t.getTcInput());
            data.put("output", t.getTcOutput());
            data.put("puzId", t.getPuzId());
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

    private void handleCreateTestcase(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Map<String, Object> body = readJsonBody(req);
        Object puzObj = body.get("puzId");
        if (puzObj == null) {
            ResponseUtil.error(resp, 400, "puzId is required");
            return;
        }

        Testcase tc = new Testcase();
        tc.setPuzId(((Number) puzObj).intValue());
        tc.setTcInput((String) body.get("input"));
        tc.setTcOutput((String) body.get("output"));

        testcaseDao.create(tc);

        Map<String, Object> data = new HashMap<>();
        data.put("tcId", tc.getTcId());
        data.put("message", "Testcase created");
        ResponseUtil.success(resp, data);
    }

    private void handleUpdateTestcase(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int tcId = Integer.parseInt(idParam.trim());
            Testcase tc = testcaseDao.findById(tcId);
            if (tc == null) {
                ResponseUtil.error(resp, 404, "Testcase not found");
                return;
            }

            Map<String, Object> body = readJsonBody(req);
            if (body.containsKey("input")) tc.setTcInput((String) body.get("input"));
            if (body.containsKey("output")) tc.setTcOutput((String) body.get("output"));
            if (body.containsKey("puzId")) tc.setPuzId(((Number) body.get("puzId")).intValue());

            testcaseDao.update(tc);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Testcase updated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
