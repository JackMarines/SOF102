// Controller xử lý dashboard admin
package controller;

import dao.ProgressDao;
import dao.TeamDao;
import dao.UserDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/api/v1/admin/dashboard")
public class AdminController extends HttpServlet {

    private UserDao userDao = new UserDao();
    private TeamDao teamDao = new TeamDao();
    private ProgressDao progressDao = new ProgressDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        long totalUsers = userDao.countActive();
        long totalTeams = teamDao.countActive();
        long totalPuzzles = progressDao.countAll(); // actually progressDao.countAll() is progress count
        // Get puzzle count from a separate method
        long progressToday = progressDao.countToday();
        long progressWeek = progressDao.countByDateRange(7);
        long progressMonth = progressDao.countByDateRange(30);
        long progress3Months = progressDao.countByDateRange(90);
        long progressAll = progressDao.countAll();

        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", totalUsers);
        data.put("totalTeams", totalTeams);
        data.put("solvedPuzzles", Map.of(
            "today", progressToday,
            "week", progressWeek,
            "month", progressMonth,
            "3months", progress3Months,
            "all", progressAll
        ));

        ResponseUtil.success(resp, data);
    }
}
