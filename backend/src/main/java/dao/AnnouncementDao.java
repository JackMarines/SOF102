// DAO - chứa các hàm thao tác với bảng announcement trong CSDL
package dao;

import entity.Announcement;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class AnnouncementDao {

    // Tạo announcement mới
    public void create(Announcement entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Tìm theo ID
    public Announcement findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.find(Announcement.class, id);
        } finally {
            em.close();
        }
    }

    // Lấy tất cả announcement (admin)
    public List<Announcement> findAll(int page, int limit) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Announcement> q = em.createQuery(
                "SELECT a FROM Announcement a ORDER BY a.annCreatedat DESC", Announcement.class);
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm
    public long count() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.createQuery("SELECT COUNT(a) FROM Announcement a", Long.class).getSingleResult();
        } finally {
            em.close();
        }
    }

    // Lấy announcement mới nhất trong 7 ngày qua (chỉ 1 bản ghi)
    public Announcement findLatestRecent() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            java.sql.Timestamp threshold = new java.sql.Timestamp(
                System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000);
            TypedQuery<Announcement> q = em.createQuery(
                "SELECT a FROM Announcement a WHERE " +
                "a.annIspublished = true AND " +
                "a.annCreatedat >= :threshold " +
                "ORDER BY a.annCreatedat DESC", Announcement.class);
            q.setParameter("threshold", threshold);
            q.setMaxResults(1);
            List<Announcement> results = q.getResultList();
            return results.isEmpty() ? null : results.get(0);
        } finally {
            em.close();
        }
    }

    // Lấy announcement chưa hết hạn (7 ngày)
    public List<Announcement> findActive() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            java.sql.Timestamp threshold = new java.sql.Timestamp(
                System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000);
            TypedQuery<Announcement> q = em.createQuery(
                "SELECT a FROM Announcement a WHERE " +
                "COALESCE(a.annUpdatedat, a.annCreatedat) >= :threshold " +
                "ORDER BY a.annCreatedat DESC", Announcement.class);
            q.setParameter("threshold", threshold);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Cập nhật
    public void update(Announcement entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Xoá
    public void delete(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            Announcement a = em.find(Announcement.class, id);
            if (a != null) em.remove(a);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
