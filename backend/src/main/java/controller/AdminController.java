// Controller xử lý dashboard admin
package controller;

import dao.ProgressDao;
import dao.PuzzleDao;
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
    private PuzzleDao puzzleDao = new PuzzleDao();
    private ProgressDao progressDao = new ProgressDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        // Lấy tổng số liệu thống kê cho dashboard admin
        // Mỗi chart (today, week, month, 3months, total) trả về mảng {date, count}
        // Dữ liệu chart được tính từ ProgressDao, đếm số puzzle đã giải theo ngày
        long totalUsers = userDao.countActive();
        long totalTeams = teamDao.countActive();
        long totalPuzzles = puzzleDao.count(null, null, null);

        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", totalUsers);
        data.put("totalTeams", totalTeams);
        data.put("totalPuzzles", totalPuzzles);
        data.put("todayChart", progressDao.getTodayChart());
        data.put("weekChart", progressDao.getWeekChart());
        data.put("monthChart", progressDao.getMonthChart());
        data.put("threeMonthsChart", progressDao.getThreeMonthsChart());
        data.put("totalChart", progressDao.getTotalChart());

        ResponseUtil.success(resp, data);
    }
}
