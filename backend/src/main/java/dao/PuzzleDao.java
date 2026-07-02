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
    public List<Puzzle> findAll(int page, int limit, String search, String difficulty) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder jpql = new StringBuilder(
                "SELECT p FROM Puzzle p JOIN FETCH p.language WHERE 1=1");
            if (search != null && !search.trim().isEmpty()) {
                jpql.append(" AND LOWER(p.puzTitle) LIKE LOWER(:search)");
            }
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                jpql.append(" AND p.puzDifficulty = :difficulty");
            }
            jpql.append(" ORDER BY p.puzId");

            TypedQuery<Puzzle> query = em.createQuery(jpql.toString(), Puzzle.class);
            if (search != null && !search.trim().isEmpty()) {
                query.setParameter("search", "%" + search.trim() + "%");
            }
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                query.setParameter("difficulty", difficulty.trim());
            }
            query.setFirstResult((page - 1) * limit);
            query.setMaxResults(limit);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm tổng số puzzle (dùng cho phân trang)
    public long count(String search, String difficulty) {
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

            TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class);
            if (search != null && !search.trim().isEmpty()) {
                query.setParameter("search", "%" + search.trim() + "%");
            }
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                query.setParameter("difficulty", difficulty.trim());
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
                "SELECT p FROM Puzzle p JOIN FETCH p.language WHERE p.puzId = :id",
                Puzzle.class);
            query.setParameter("id", id);
            List<Puzzle> result = query.getResultList();
            return result.isEmpty() ? null : result.get(0);
        } finally {
            em.close();
        }
    }
}
