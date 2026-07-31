// Controller công khai lấy contests
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.ContestDao;
import dao.ProgressDao;
import dao.PuzzleDao;
import dao.TrophyDao;
import dao.UserDao;
import dao.UserTrophyDao;
import entity.Contest;
import entity.Puzzle;
import entity.Trophy;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet({"/api/v1/contests", "/api/v1/contests/hall-of-fame"})
public class PublicContestController extends HttpServlet {

    private ContestDao contestDao = new ContestDao();
    private PuzzleDao puzzleDao = new PuzzleDao();
    private ProgressDao progressDao = new ProgressDao();
    private UserDao userDao = new UserDao();
    private TrophyDao trophyDao = new TrophyDao();
    private UserTrophyDao userTrophyDao = new UserTrophyDao();
    private ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        String uri = req.getRequestURI();
        if (uri.endsWith("/hall-of-fame")) {
            handleHallOfFame(req, resp);
        } else {
            String idParam = req.getParameter("id");
            if (idParam != null && !idParam.trim().isEmpty()) {
                handleGetContest(req, resp);
            } else {
                handleListContests(req, resp);
            }
        }
    }

    private void handleListContests(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int page = 1, limit = 6;
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
        long now = System.currentTimeMillis();

        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Contest c : contests) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getConId());
            item.put("title", c.getConTitle());
            item.put("content", c.getConContent());
            item.put("start", c.getConStart());
            item.put("end", c.getConEnd());
            item.put("avatar", c.getConAvatar());
            item.put("authorId", c.getConAuthorId());

            entity.User author = c.getConAuthorId() != null ? userDao.findById(c.getConAuthorId()) : null;
            item.put("authorName", author != null ? author.getUserName() : "Unknown");
            item.put("authorAvatar", author != null ? author.getUserAvatar() : null);
            item.put("authorIsAdmin", author != null && Boolean.TRUE.equals(author.getUserIsadmin()));
            String authorTrophyAvatar = null;
            if (author != null && author.getUserSelectedtrophyId() != null) {
                Trophy at = trophyDao.findById(author.getUserSelectedtrophyId());
                if (at != null) authorTrophyAvatar = at.getTropAvatar();
            }
            item.put("authorSelectedTrophyAvatar", authorTrophyAvatar);

            Trophy t = c.getTrophy();
            if (t != null) {
                item.put("trophyId", t.getTropId());
                item.put("trophyName", t.getTropName());
                item.put("trophyAvatar", t.getTropAvatar());
            }

            String status = "ended";
            if (c.getConEnd() == null || now <= c.getConEnd().getTime()) {
                status = "active";
            }
            item.put("status", status);

            List<Puzzle> puzzles = c.getPuzzles();
            item.put("problemCount", puzzles != null ? puzzles.size() : 0);

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
            long now = System.currentTimeMillis();

            Map<String, Object> data = new HashMap<>();
            data.put("id", c.getConId());
            data.put("title", c.getConTitle());
            data.put("content", c.getConContent());
            data.put("start", c.getConStart());
            data.put("end", c.getConEnd());
            data.put("avatar", c.getConAvatar());
            data.put("authorId", c.getConAuthorId());

            entity.User author = c.getConAuthorId() != null ? userDao.findById(c.getConAuthorId()) : null;
            data.put("authorName", author != null ? author.getUserName() : "Unknown");
            data.put("authorAvatar", author != null ? author.getUserAvatar() : null);
            data.put("authorIsAdmin", author != null && Boolean.TRUE.equals(author.getUserIsadmin()));
            String authorTrophyAvatar = null;
            if (author != null && author.getUserSelectedtrophyId() != null) {
                Trophy at = trophyDao.findById(author.getUserSelectedtrophyId());
                if (at != null) authorTrophyAvatar = at.getTropAvatar();
            }
            data.put("authorSelectedTrophyAvatar", authorTrophyAvatar);

            Trophy t = c.getTrophy();
            if (t != null) {
                data.put("trophyId", t.getTropId());
                data.put("trophyName", t.getTropName());
                data.put("trophyAvatar", t.getTropAvatar());
                data.put("trophyContent", t.getTropContent());
            }

            jakarta.servlet.http.HttpSession session = req.getSession(false);
            Integer currentUserId = null;
            if (session != null) {
                entity.User currentUser = (entity.User) session.getAttribute("user");
                if (currentUser != null) currentUserId = currentUser.getUserId();
            }

            if (t != null && currentUserId != null) {
                data.put("userHasTrophy", userTrophyDao.hasTrophy(currentUserId, t.getTropId()));
            }

            String status = "ended";
            if (c.getConEnd() == null || now <= c.getConEnd().getTime()) {
                status = "active";
            }
            data.put("status", status);

            List<Puzzle> puzzles = c.getPuzzles();
            data.put("problemCount", puzzles != null ? puzzles.size() : 0);

            List<Map<String, Object>> puzzleList = new ArrayList<>();
            if (puzzles != null) {
                for (Puzzle p : puzzles) {
                    Map<String, Object> pItem = new HashMap<>();
                    pItem.put("id", p.getPuzId());
                    pItem.put("title", p.getPuzTitle());
                    pItem.put("content", p.getPuzContent());
                    pItem.put("functionName", p.getPuzFunction());
                    pItem.put("difficulty", p.getPuzDifficulty());
                    pItem.put("score", p.getPuzScore());
                    if (p.getLanguage() != null) {
                        pItem.put("language", p.getLanguage().getLangName());
                    }
                    if (currentUserId != null) {
                        pItem.put("solved", progressDao.hasUserSolvedPuzzle(currentUserId, p.getPuzId()));
                    } else {
                        pItem.put("solved", false);
                    }
                    puzzleList.add(pItem);
                }
            }
            data.put("puzzles", puzzleList);

            if (puzzles != null && !puzzles.isEmpty()) {
                int contestId = c.getConId();
                data.put("participants", progressDao.countContestParticipants(contestId));
                data.put("solvers", progressDao.countContestSolvers(contestId));
            } else {
                data.put("participants", 0);
                data.put("solvers", 0);
            }

            ResponseUtil.success(resp, data);
        } catch (NumberFormatException e) {
            ResponseUtil.error(resp, 400, "Invalid id");
        }
    }

    private void handleHallOfFame(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        int limit = 10;
        if (req.getParameter("limit") != null) {
            try { limit = Integer.parseInt(req.getParameter("limit"));
                  if (limit < 1) limit = 1; if (limit > 50) limit = 50;
            } catch (NumberFormatException e) {}
        }

        Integer currentUserId = null;
        jakarta.servlet.http.HttpSession session = req.getSession(false);
        if (session != null) {
            entity.User u = (entity.User) session.getAttribute("user");
            if (u != null) currentUserId = u.getUserId();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("speedChampions", progressDao.getFastestSolvers(limit));
        result.put("contestVeterans", progressDao.getMostActiveParticipants(limit));
        result.put("shortestSolves", progressDao.getShortestSolutions(limit, currentUserId));
        ResponseUtil.success(resp, result);
    }
}
