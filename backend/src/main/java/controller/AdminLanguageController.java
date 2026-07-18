// Controller xử lý admin language CRUD
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.LanguageDao;
import entity.Language;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/admin/languages", "/api/v1/admin/language"})
public class AdminLanguageController extends HttpServlet {

    private LanguageDao languageDao = new LanguageDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/languages")) {
            handleListLanguages(req, resp);
        } else if (uri.endsWith("/language")) {
            handleGetLanguage(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleCreateLanguage(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        handleUpdateLanguage(req, resp);
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
            languageDao.delete(Integer.parseInt(idParam.trim()));
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Language deleted");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleListLanguages(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        List<Language> list = languageDao.findAll();
        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Language l : list) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", l.getLangId());
            item.put("name", l.getLangName());
            item.put("judge0Id", l.getLangJudge0());
            dataList.add(item);
        }
        ResponseUtil.success(resp, Map.of("data", dataList));
    }

    private void handleGetLanguage(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            Language l = languageDao.findById(Integer.parseInt(idParam.trim()));
            if (l == null) {
                ResponseUtil.error(resp, 404, "Language not found");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("id", l.getLangId());
            data.put("name", l.getLangName());
            data.put("judge0Id", l.getLangJudge0());
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

    private void handleCreateLanguage(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Map<String, Object> body = readJsonBody(req);
        String name = (String) body.get("name");
        if (name == null || name.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "name is required");
            return;
        }

        Language lang = new Language();
        lang.setLangName(name.trim());
        lang.setLangJudge0(body.get("judge0Id") != null ? ((Number) body.get("judge0Id")).intValue() : null);

        languageDao.create(lang);

        Map<String, Object> data = new HashMap<>();
        data.put("id", lang.getLangId());
        data.put("message", "Language created");
        ResponseUtil.success(resp, data);
    }

    private void handleUpdateLanguage(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int lid = Integer.parseInt(idParam.trim());
            Language lang = languageDao.findById(lid);
            if (lang == null) {
                ResponseUtil.error(resp, 404, "Language not found");
                return;
            }

            Map<String, Object> body = readJsonBody(req);
            if (body.containsKey("name")) lang.setLangName(((String) body.get("name")).trim());
            if (body.containsKey("judge0Id")) lang.setLangJudge0(((Number) body.get("judge0Id")).intValue());

            languageDao.update(lang);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Language updated");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }
}
