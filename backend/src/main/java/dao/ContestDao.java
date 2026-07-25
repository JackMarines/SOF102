// DAO - chứa các hàm thao tác với bảng contest trong CSDL
package dao;

import entity.Contest;
import entity.Trophy;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class ContestDao {

    // Lấy danh sách contest có phân trang + tìm kiếm theo title
    public List<Contest> findAll(int page, int limit, String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder jpql = new StringBuilder(
                "SELECT DISTINCT c FROM Contest c JOIN FETCH c.trophy LEFT JOIN FETCH c.puzzles WHERE 1=1");
            if (search != null && !search.trim().isEmpty()) {
                jpql.append(" AND LOWER(c.conTitle) LIKE LOWER(:search)");
            }
            jpql.append(" ORDER BY c.conId DESC");

            TypedQuery<Contest> query = em.createQuery(jpql.toString(), Contest.class);
            if (search != null && !search.trim().isEmpty()) {
                query.setParameter("search", "%" + search.trim() + "%");
            }
            query.setFirstResult((page - 1) * limit);
            query.setMaxResults(limit);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm tổng số contest
    public long count(String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder jpql = new StringBuilder(
                "SELECT COUNT(c) FROM Contest c WHERE 1=1");
            if (search != null && !search.trim().isEmpty()) {
                jpql.append(" AND LOWER(c.conTitle) LIKE LOWER(:search)");
            }
            TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class);
            if (search != null && !search.trim().isEmpty()) {
                query.setParameter("search", "%" + search.trim() + "%");
            }
            return query.getSingleResult();
        } finally {
            em.close();
        }
    }

    // Tìm theo ID
    public Contest findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Contest> query = em.createQuery(
                "SELECT DISTINCT c FROM Contest c JOIN FETCH c.trophy LEFT JOIN FETCH c.puzzles WHERE c.conId = :id",
                Contest.class);
            query.setParameter("id", id);
            List<Contest> result = query.getResultList();
            return result.isEmpty() ? null : result.get(0);
        } finally {
            em.close();
        }
    }

    // ──────────────────────────────────────────────────
    // ADMIN CRUD
    // ──────────────────────────────────────────────────

    // Tạo contest mới
    public void create(Contest entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Cập nhật contest
    public void update(Contest entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Xoá contest
    public void delete(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            Contest c = em.find(Contest.class, id);
            if (c != null) em.remove(c);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
