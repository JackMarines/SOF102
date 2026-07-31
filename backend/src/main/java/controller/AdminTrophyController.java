// Controller xử lý admin trophy CRUD
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.TrophyDao;
import entity.Trophy;
import entity.User;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/admin/trophies", "/api/v1/admin/trophy"})
public class AdminTrophyController extends HttpServlet {

    private TrophyDao trophyDao = new TrophyDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "User not logged in");
            return;
        }
        String uri = req.getRequestURI();
        if (uri.endsWith("/trophies")) {
            handleListTrophies(resp);
        } else if (uri.endsWith("/trophy")) {
            handleGetTrophy(req, resp);
        } else {
            ResponseUtil.error(resp, 404, "Not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "User not logged in");
            return;
        }
        handleCreateTrophy(req, resp);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "User not logged in");
            return;
        }
        handleUpdateTrophy(req, resp);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        User sessionUser = (User) req.getSession().getAttribute("user");
        if (sessionUser == null) {
            ResponseUtil.error(resp, 401, "User not logged in");
            return;
        }
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            trophyDao.delete(Integer.parseInt(idParam.trim()));
            Map<String, Object> data = new HashMap<>();
            data.put("message", "Trophy deleted");
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleListTrophies(HttpServletResponse resp) throws IOException {
        List<Trophy> trophies = trophyDao.findAll();
        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Trophy t : trophies) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", t.getTropId());
            item.put("avatar", t.getTropAvatar());
            item.put("name", t.getTropName());
            item.put("content", t.getTropContent());
            dataList.add(item);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("data", dataList);
        ResponseUtil.success(resp, result);
    }

    private void handleGetTrophy(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            Trophy t = trophyDao.findById(Integer.parseInt(idParam.trim()));
            if (t == null) {
                ResponseUtil.error(resp, 404, "Trophy not found");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("id", t.getTropId());
            data.put("avatar", t.getTropAvatar());
            data.put("name", t.getTropName());
            data.put("content", t.getTropContent());
            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleCreateTrophy(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        Map<String, Object> body = readJsonBody(req);
        String name = (String) body.get("name");
        if (name == null || name.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "name is required");
            return;
        }

        Trophy trophy = new Trophy();
        trophy.setTropName(name.trim());
        trophy.setTropAvatar((String) body.get("avatar"));
        trophy.setTropContent((String) body.get("content"));

        trophyDao.create(trophy);

        Map<String, Object> data = new HashMap<>();
        data.put("id", trophy.getTropId());
        data.put("message", "Trophy created");
        ResponseUtil.success(resp, data);
    }

    private void handleUpdateTrophy(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String idParam = req.getParameter("id");
        if (idParam == null || idParam.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "id is required");
            return;
        }
        try {
            int tid = Integer.parseInt(idParam.trim());
            Trophy trophy = trophyDao.findById(tid);
            if (trophy == null) {
                ResponseUtil.error(resp, 404, "Trophy not found");
                return;
            }

            Map<String, Object> body = readJsonBody(req);
            if (body.containsKey("name")) trophy.setTropName(((String) body.get("name")).trim());
            if (body.containsKey("avatar")) trophy.setTropAvatar((String) body.get("avatar"));
            if (body.containsKey("content")) trophy.setTropContent((String) body.get("content"));

            trophyDao.update(trophy);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "Trophy updated");
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
}
