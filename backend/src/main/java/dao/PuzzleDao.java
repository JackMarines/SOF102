// DAO - chứa các hàm thao tác với bảng puzzle trong CSDL
package dao;

import entity.Puzzle;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.ArrayList;
import java.util.List;

public class PuzzleDao {

    // Lấy danh sách puzzle có phân trang + tìm kiếm + lọc theo độ khó
    public List<Puzzle> findAll(int page, int limit, String search, String difficulty, String language) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder jpql = new StringBuilder(
                "SELECT p FROM Puzzle p JOIN FETCH p.language LEFT JOIN FETCH p.contest WHERE 1=1");
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

    // Đếm tổng số puzzle (dùng cho phân trang)
    public long count(String search, String difficulty, String language) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder jpql = new StringBuilder(
                "SELECT COUNT(p) FROM Puzzle p WHERE 1=1");
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

    // Tìm puzzle theo ID (dùng cho trang chi tiết)
    public Puzzle findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Puzzle> query = em.createQuery(
                "SELECT p FROM Puzzle p JOIN FETCH p.language LEFT JOIN FETCH p.contest WHERE p.puzId = :id",
                Puzzle.class);
            query.setParameter("id", id);
            List<Puzzle> result = query.getResultList();
            return result.isEmpty() ? null : result.get(0);
        } finally {
            em.close();
        }
    }

    // ──────────────────────────────────────────────────
    // ADMIN CRUD
    // ──────────────────────────────────────────────────

    // Tạo puzzle mới
    public void create(Puzzle entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Cập nhật puzzle
    public void update(Puzzle entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Xoá puzzle
    public void delete(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            Puzzle p = em.find(Puzzle.class, id);
            if (p != null) em.remove(p);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Unlink all puzzles from a contest
    public void unlinkAllFromContest(int contestId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.createQuery("UPDATE Puzzle p SET p.contest = null WHERE p.contest.conId = :cid")
              .setParameter("cid", contestId)
              .executeUpdate();
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
