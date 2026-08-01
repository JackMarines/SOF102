// DAO - chứa các hàm thao tác với bảng progress trong CSDL
package dao;

import entity.Progress;
import entity.Puzzle;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ProgressDao {
    // Thêm mới hoặc cập nhật progress (upsert) dựa trên userId + puzId
    public void upsert(int userId, int puzId, Integer progTime, String progCode) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Progress> q = em.createQuery(
                "SELECT p FROM Progress p WHERE p.userId = :uid AND p.puzId = :pid",
                Progress.class);
            q.setParameter("uid", userId);
            q.setParameter("pid", puzId);
            List<Progress> existing = q.getResultList();

            em.getTransaction().begin();
            if (existing.isEmpty()) {
                Progress p = new Progress();
                p.setUserId(userId);
                p.setPuzId(puzId);
                p.setProgDate(new Timestamp(System.currentTimeMillis()));
                p.setProgTime(progTime);
                p.setProgCode(progCode);
                em.persist(p);
            } else {
                Progress p = existing.get(0);
                p.setProgDate(new Timestamp(System.currentTimeMillis()));
                p.setProgTime(progTime);
                p.setProgCode(progCode);
                em.merge(p);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Đếm số puzzle đã hoàn thành của user
    public long countByUser(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Long> q = em.createQuery(
                "SELECT COUNT(p) FROM Progress p WHERE p.userId = :uid", Long.class);
            q.setParameter("uid", userId);
            return q.getSingleResult();
        } finally {
            em.close();
        }
    }

    // Tính tổng điểm (score) của user từ các puzzle đã hoàn thành
    public int getTotalScore(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COALESCE(SUM(p.puz_score), 0) FROM progress pr " +
                "JOIN puzzle p ON pr.puz_id = p.puz_id WHERE pr.user_id = ?");
            q.setParameter(1, userId);
            return ((Number) q.getSingleResult()).intValue();
        } finally {
            em.close();
        }
    }

    // Xếp hạng của user trong team dựa trên tổng điểm
    public int getRankInTeam(int teamId, int userId, int userScore) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(*) FROM (" +
                "SELECT pr2.user_id FROM progress pr2 " +
                "JOIN puzzle p2 ON pr2.puz_id = p2.puz_id " +
                "JOIN user u2 ON pr2.user_id = u2.user_id " +
                "WHERE u2.team_id = ? AND pr2.user_id != ? " +
                "GROUP BY pr2.user_id HAVING SUM(p2.puz_score) > ?" +
                ") t");
            q.setParameter(1, teamId);
            q.setParameter(2, userId);
            q.setParameter(3, userScore);
            return ((Number) q.getSingleResult()).intValue() + 1;
        } finally {
            em.close();
        }
    }

    // Lấy danh sách puzzle đã hoàn thành có phân trang + lọc
    public List<Puzzle> getCompletedPuzzles(int userId, int page, int limit,
                                             String search, String difficulty, String language) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder jpql = new StringBuilder(
                "SELECT p FROM Puzzle p JOIN FETCH p.language, Progress pr " +
                "WHERE p.puzId = pr.puzId AND pr.userId = :userId");
            if (search != null && !search.trim().isEmpty()) {
                jpql.append(" AND LOWER(p.puzTitle) LIKE LOWER(:search)");
            }
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                jpql.append(" AND p.puzDifficulty = :difficulty");
            }
            if (language != null && !language.trim().isEmpty()) {
                jpql.append(" AND p.language.langName = :language");
            }
            jpql.append(" ORDER BY p.puzId");

            TypedQuery<Puzzle> query = em.createQuery(jpql.toString(), Puzzle.class);
            query.setParameter("userId", userId);
            if (search != null && !search.trim().isEmpty()) {
                query.setParameter("search", "%" + search.trim() + "%");
            }
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                query.setParameter("difficulty", difficulty.trim());
            }
            if (language != null && !language.trim().isEmpty()) {
                query.setParameter("language", language.trim());
            }
            query.setFirstResult((page - 1) * limit);
            query.setMaxResults(limit);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    // ──────────────────────────────────────────────────
    // ADMIN CRUD
    // ──────────────────────────────────────────────────

    // Tìm tất cả progress của user
    public List<Progress> findByUserId(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Progress> q = em.createQuery(
                "SELECT p FROM Progress p WHERE p.userId = :uid ORDER BY p.progDate DESC", Progress.class);
            q.setParameter("uid", userId);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Tìm tất cả progress của puzzle
    public List<Progress> findByPuzId(int puzId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Progress> q = em.createQuery(
                "SELECT p FROM Progress p WHERE p.puzId = :pid ORDER BY p.progDate DESC", Progress.class);
            q.setParameter("pid", puzId);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Tìm progress theo email
    public List<Progress> findByEmail(String email) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Progress> q = em.createQuery(
                "SELECT p FROM Progress p WHERE p.userId = (SELECT u.userId FROM User u WHERE u.userEmail = :email)", Progress.class);
            q.setParameter("email", email);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Tạo progress mới
    public void create(Progress entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Cập nhật progress
    public void update(Progress entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Xoá progress
    public void delete(int progId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            Progress p = em.find(Progress.class, progId);
            if (p != null) em.remove(p);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Xoá toàn bộ progress
    public void deleteAll() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.createNativeQuery("DELETE FROM progress").executeUpdate();
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Đếm số lượng progress theo khoảng thời gian (dashboard)
    public long countByDateRange(int daysBack) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(*) FROM progress WHERE prog_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)");
            q.setParameter(1, daysBack);
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    // Đếm số lượng progress hôm nay
    public long countToday() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(*) FROM progress WHERE DATE(prog_date) = CURDATE()");
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    // Đếm số lượng progress tất cả
    public long countAll() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery("SELECT COUNT(*) FROM progress");
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    // Lấy số puzzle đã giải theo ngày của một user (cho biểu đồ profile)
    public List<Object[]> getUserActivityByDay(int userId, int days) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT DATE(prog_date) AS day, COUNT(*) AS solves " +
                "FROM progress WHERE user_id = ? AND prog_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) " +
                "GROUP BY DATE(prog_date) ORDER BY day ASC");
            q.setParameter(1, userId);
            q.setParameter(2, days);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // ── CHART DATA (dashboard) ──

    // Today — 4 segments: 00-06, 06-12, 12-18, 18-00
    public Map<String, Object> getTodayChart() {
        String[] labels = {"00-06", "06-12", "12-18", "18-00"};
        long[] data = new long[4];
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT FLOOR(HOUR(prog_date) / 6) AS seg, COUNT(*) AS cnt " +
                "FROM progress WHERE DATE(prog_date) = CURDATE() GROUP BY seg");
            List<Object[]> rows = q.getResultList();
            for (Object[] row : rows) {
                int seg = ((Number) row[0]).intValue();
                if (seg >= 0 && seg < 4) data[seg] = ((Number) row[1]).longValue();
            }
        } finally {
            em.close();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("labels", List.of(labels));
        result.put("data", List.of(data[0], data[1], data[2], data[3]));
        return result;
    }

    // Today — 4 segments: 00-06, 06-12, 12-18, 18-00 (chỉ của 1 user, cho biểu đồ profile)
    public Map<String, Object> getUserTodayChart(int userId) {
        String[] labels = {"00-06", "06-12", "12-18", "18-00"};
        long[] data = new long[4];
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT FLOOR(HOUR(prog_date) / 6) AS seg, COUNT(*) AS cnt " +
                "FROM progress WHERE user_id = ? AND DATE(prog_date) = CURDATE() GROUP BY seg");
            q.setParameter(1, userId);
            List<Object[]> rows = q.getResultList();
            for (Object[] row : rows) {
                int seg = ((Number) row[0]).intValue();
                if (seg >= 0 && seg < 4) data[seg] = ((Number) row[1]).longValue();
            }
        } finally {
            em.close();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("labels", List.of(labels));
        result.put("data", List.of(data[0], data[1], data[2], data[3]));
        return result;
    }

    // Week — 7 segments: Mon-Sun
    public Map<String, Object> getWeekChart() {
        String[] labels = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        long[] data = new long[7];
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT DAYOFWEEK(prog_date) AS dow, COUNT(*) AS cnt " +
                "FROM progress WHERE prog_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) " +
                "GROUP BY dow");
            List<Object[]> rows = q.getResultList();
            for (Object[] row : rows) {
                int dow = ((Number) row[0]).intValue(); // 1=Sun, 2=Mon, ..., 7=Sat
                int idx = (dow + 5) % 7; // map to 0=Mon..6=Sun
                data[idx] = ((Number) row[1]).longValue();
            }
        } finally {
            em.close();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("labels", List.of(labels));
        result.put("data", List.of(data[0], data[1], data[2], data[3], data[4], data[5], data[6]));
        return result;
    }

    // Month — 4 segments: Week 1-4
    public Map<String, Object> getMonthChart() {
        String[] labels = {"Week 1", "Week 2", "Week 3", "Week 4"};
        long[] data = new long[4];
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT FLOOR((DAY(prog_date) - 1) / 7) AS wk, COUNT(*) AS cnt " +
                "FROM progress WHERE prog_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) " +
                "GROUP BY wk");
            List<Object[]> rows = q.getResultList();
            for (Object[] row : rows) {
                int wk = ((Number) row[0]).intValue();
                if (wk >= 0 && wk < 4) data[wk] = ((Number) row[1]).longValue();
            }
        } finally {
            em.close();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("labels", List.of(labels));
        result.put("data", List.of(data[0], data[1], data[2], data[3]));
        return result;
    }

    // 3 Months — 3 segments: Month 1-3
    public Map<String, Object> getThreeMonthsChart() {
        String[] labels = {"Month 1", "Month 2", "Month 3"};
        long[] data = new long[3];
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT TIMESTAMPDIFF(MONTH, prog_date, CURDATE()) AS mo, COUNT(*) AS cnt " +
                "FROM progress WHERE prog_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) " +
                "GROUP BY mo");
            List<Object[]> rows = q.getResultList();
            for (Object[] row : rows) {
                int mo = ((Number) row[0]).intValue();
                if (mo >= 0 && mo < 3) data[mo] = ((Number) row[1]).longValue();
            }
        } finally {
            em.close();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("labels", List.of(labels));
        result.put("data", List.of(data[0], data[1], data[2]));
        return result;
    }

    // Total — 12 segments: Jan-Dec (current year)
    public Map<String, Object> getTotalChart() {
        String[] labels = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        long[] data = new long[12];
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT MONTH(prog_date) AS mo, COUNT(*) AS cnt " +
                "FROM progress WHERE YEAR(prog_date) = YEAR(CURDATE()) " +
                "GROUP BY mo");
            List<Object[]> rows = q.getResultList();
            for (Object[] row : rows) {
                int mo = ((Number) row[0]).intValue();
                if (mo >= 1 && mo <= 12) data[mo - 1] = ((Number) row[1]).longValue();
            }
        } finally {
            em.close();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("labels", List.of(labels));
        List<Long> dataList = new ArrayList<>();
        for (long d : data) dataList.add(d);
        result.put("data", dataList);
        return result;
    }

    // Đếm số puzzle đã hoàn thành với filter (dùng cho phân trang)
    public long countCompletedPuzzles(int userId, String search, String difficulty, String language) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder jpql = new StringBuilder(
                "SELECT COUNT(p) FROM Puzzle p, Progress pr " +
                "WHERE p.puzId = pr.puzId AND pr.userId = :userId");
            if (search != null && !search.trim().isEmpty()) {
                jpql.append(" AND LOWER(p.puzTitle) LIKE LOWER(:search)");
            }
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                jpql.append(" AND p.puzDifficulty = :difficulty");
            }
            if (language != null && !language.trim().isEmpty()) {
                jpql.append(" AND p.language.langName = :language");
            }

            TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class);
            query.setParameter("userId", userId);
            if (search != null && !search.trim().isEmpty()) {
                query.setParameter("search", "%" + search.trim() + "%");
            }
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                query.setParameter("difficulty", difficulty.trim());
            }
            if (language != null && !language.trim().isEmpty()) {
                query.setParameter("language", language.trim());
            }
            return query.getSingleResult();
        } finally {
            em.close();
        }
    }

    // ──────────────────────────────────────────────────
    // HALL OF FAME
    // ──────────────────────────────────────────────────

    // Top 10 fastest solvers across all puzzles
    public List<Map<String, Object>> getFastestSolvers(int limit) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT pr.user_id, u.user_name, pr.prog_time, c.con_title, p.puz_title, u.user_avatar, u.user_isadmin, t.trop_avatar " +
                "FROM progress pr " +
                "JOIN user u ON pr.user_id = u.user_id " +
                "LEFT JOIN trophy t ON u.user_selectedtrophy_id = t.trop_id " +
                "JOIN puzzle p ON pr.puz_id = p.puz_id " +
                "JOIN contest c ON p.con_id = c.con_id " +
                "WHERE pr.prog_time IS NOT NULL AND u.user_isactive = true AND p.con_id IS NOT NULL " +
                "ORDER BY pr.prog_time ASC " +
                "LIMIT ?");
            q.setParameter(1, limit);
            List<Object[]> rows = q.getResultList();
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : rows) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("userId", ((Number) row[0]).intValue());
                item.put("name", row[1]);
                item.put("value", ((Number) row[2]).intValue() + "s");
                item.put("contest", row[3]);
                item.put("puzzle", row[4]);
                item.put("avatar", row[5]);
                item.put("isAdmin", row[6] != null && (Boolean) row[6]);
                item.put("selectedTrophyAvatar", row.length > 7 ? row[7] : null);
                result.add(item);
            }
            return result;
        } finally {
            em.close();
        }
    }

    // Top 10 users who fully completed most contests (trophy OR all puzzles solved)
    public List<Map<String, Object>> getMostActiveParticipants(int limit) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT u.user_id, u.user_name, u.user_avatar, u.user_isadmin, t.trop_avatar, COUNT(DISTINCT cq.con_id) AS contest_count " +
                "FROM user u " +
                "LEFT JOIN trophy t ON u.user_selectedtrophy_id = t.trop_id " +
                "JOIN ( " +
                "  SELECT ut.user_id, c.con_id " +
                "  FROM user_trophy ut " +
                "  JOIN contest c ON c.trop_id = ut.trop_id " +
                "  UNION ALL " +
                "  SELECT pr.user_id, p.con_id " +
                "  FROM progress pr " +
                "  JOIN puzzle p ON pr.puz_id = p.puz_id " +
                "  WHERE p.con_id IS NOT NULL " +
                "  GROUP BY pr.user_id, p.con_id " +
                "  HAVING COUNT(DISTINCT pr.puz_id) >= ( " +
                "    SELECT COUNT(*) FROM puzzle p2 WHERE p2.con_id = p.con_id " +
                "  ) " +
                ") cq ON u.user_id = cq.user_id " +
                "WHERE u.user_isactive = true " +
                "GROUP BY u.user_id, u.user_name, u.user_avatar, u.user_isadmin, t.trop_avatar " +
                "ORDER BY contest_count DESC " +
                "LIMIT ?");
            q.setParameter(1, limit);
            List<Object[]> rows = q.getResultList();
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : rows) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("userId", ((Number) row[0]).intValue());
                item.put("name", row[1]);
                item.put("avatar", row[2]);
                item.put("isAdmin", row[3] != null && (Boolean) row[3]);
                item.put("selectedTrophyAvatar", row.length > 4 ? row[4] : null);
                item.put("value", ((Number) row[5]).intValue() + " contests");
                result.add(item);
            }
            return result;
        } finally {
            em.close();
        }
    }

    // Top 10 shortest solutions (by code length)
    // If userId is provided, only reveal code for puzzles the user has solved
    public List<Map<String, Object>> getShortestSolutions(int limit, Integer userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder sql = new StringBuilder(
                "SELECT pr.prog_id, pr.user_id, u.user_name, c.con_title, p.puz_title, " +
                "u.user_avatar, u.user_isadmin, t.trop_avatar, " +
                "CASE WHEN EXISTS (SELECT 1 FROM progress pr2 WHERE pr2.user_id = :uid AND pr2.puz_id = pr.puz_id) " +
                "THEN pr.prog_code ELSE NULL END AS prog_code, " +
                "CHAR_LENGTH(pr.prog_code) AS code_length " +
                "FROM progress pr " +
                "JOIN user u ON pr.user_id = u.user_id " +
                "LEFT JOIN trophy t ON u.user_selectedtrophy_id = t.trop_id " +
                "JOIN puzzle p ON pr.puz_id = p.puz_id " +
                "JOIN contest c ON p.con_id = c.con_id " +
                "WHERE pr.prog_code IS NOT NULL AND u.user_isactive = true AND p.con_id IS NOT NULL " +
                "ORDER BY code_length ASC LIMIT :limit");

            jakarta.persistence.Query q = em.createNativeQuery(sql.toString());
            q.setParameter("uid", userId != null ? userId : -1);
            q.setParameter("limit", limit);
            List<Object[]> rows = q.getResultList();
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object[] row : rows) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("userId", ((Number) row[1]).intValue());
                item.put("author", row[2]);
                item.put("contest", row[3]);
                item.put("puzzle", row[4]);
                item.put("avatar", row[5]);
                item.put("isAdmin", row[6] != null && (Boolean) row[6]);
                item.put("selectedTrophyAvatar", row.length > 7 ? row[7] : null);
                item.put("code", row[8]);
                item.put("chars", ((Number) row[9]).intValue());
                result.add(item);
            }
            return result;
        } finally {
            em.close();
        }
    }

    // Count distinct participants for a contest's puzzle
    public long countContestParticipants(int contestId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(DISTINCT pr.user_id) FROM progress pr " +
                "JOIN puzzle p ON pr.puz_id = p.puz_id " +
                "WHERE p.con_id = ?");
            q.setParameter(1, contestId);
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    // Count distinct solvers (passed) for a contest's puzzle
    public long countContestSolvers(int contestId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(DISTINCT pr.user_id) FROM progress pr " +
                "JOIN puzzle p ON pr.puz_id = p.puz_id " +
                "WHERE p.con_id = ? AND pr.prog_time IS NOT NULL");
            q.setParameter(1, contestId);
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    public long countContestPuzzles(int contestId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(*) FROM puzzle WHERE con_id = ?");
            q.setParameter(1, contestId);
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    public long countUserContestSolves(int userId, int contestId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(DISTINCT pr.puz_id) FROM progress pr " +
                "JOIN puzzle p ON pr.puz_id = p.puz_id " +
                "WHERE pr.user_id = ? AND p.con_id = ?");
            q.setParameter(1, userId);
            q.setParameter(2, contestId);
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    public boolean hasUserSolvedPuzzle(int userId, int puzId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(*) FROM progress WHERE user_id = ? AND puz_id = ?");
            q.setParameter(1, userId);
            q.setParameter(2, puzId);
            return ((Number) q.getSingleResult()).longValue() > 0;
        } finally {
            em.close();
        }
    }
}
