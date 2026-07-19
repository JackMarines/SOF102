// DAO - chứa các hàm thao tác với bảng progress trong CSDL
package dao;

import entity.Progress;
import entity.Puzzle;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.sql.Timestamp;
import java.util.List;

public class ProgressDao {
    // Thêm mới hoặc cập nhật progress (upsert) dựa trên userId + puzId
    public void upsert(int userId, int puzId, Integer progTime) {
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
                em.persist(p);
            } else {
                Progress p = existing.get(0);
                p.setProgDate(new Timestamp(System.currentTimeMillis()));
                p.setProgTime(progTime);
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
}
