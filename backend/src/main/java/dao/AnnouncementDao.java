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

    // Lấy tất cả announcement đã published (có phân trang)
    public List<Announcement> findAllPublished(int page, int limit) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Announcement> q = em.createQuery(
                "SELECT a FROM Announcement a WHERE a.annIspublished = true ORDER BY a.annIspinned DESC, a.annCreatedat DESC", Announcement.class);
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm số announcement đã published
    public long countPublished() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.createQuery("SELECT COUNT(a) FROM Announcement a WHERE a.annIspublished = true", Long.class).getSingleResult();
        } finally {
            em.close();
        }
    }

    // Lấy tất cả announcement đã published và pinned
    public List<Announcement> findAllPinned() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Announcement> q = em.createQuery(
                "SELECT a FROM Announcement a WHERE a.annIspublished = true AND a.annIspinned = true ORDER BY a.annCreatedat DESC", Announcement.class);
            return q.getResultList();
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

    // ──────────────────────────────────────────────────
    // Các hàm JOIN với user + trophy — giúp giảm N+1 queries
    // ──────────────────────────────────────────────────

    // Base columns + JOIN dùng chung cho các query native
    private static final String BASE_SQL =
        "SELECT a.ann_id, a.ann_title, a.ann_content, a.ann_authorid, " +
        "a.ann_createdat, a.ann_updatedat, a.ann_ispinned, a.ann_ispublished, a.ann_type, " +
        "u.user_name, u.user_avatar, u.user_isadmin, " +
        "t.trop_avatar " +
        "FROM announcement a " +
        "LEFT JOIN user u ON a.ann_authorid = u.user_id " +
        "LEFT JOIN trophy t ON u.user_selectedtrophy_id = t.trop_id";

    // Lấy announcement published kèm thông tin author + trophy (phân trang)
    public List<Object[]> findPublishedWithAuthors(int page, int limit) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                BASE_SQL +
                " WHERE a.ann_ispublished = TRUE " +
                "ORDER BY a.ann_ispinned DESC, a.ann_createdat DESC");
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Lấy announcement published + pinned kèm thông tin author + trophy
    public List<Object[]> findPinnedWithAuthors() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                BASE_SQL +
                " WHERE a.ann_ispublished = TRUE AND a.ann_ispinned = TRUE " +
                "ORDER BY a.ann_createdat DESC");
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Lấy announcement còn hiệu lực (7 ngày) kèm thông tin author + trophy
    public List<Object[]> findActiveWithAuthors() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            java.sql.Timestamp threshold = new java.sql.Timestamp(
                System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000);
            jakarta.persistence.Query q = em.createNativeQuery(
                BASE_SQL +
                " WHERE COALESCE(a.ann_updatedat, a.ann_createdat) >= :threshold " +
                "ORDER BY a.ann_createdat DESC");
            q.setParameter("threshold", threshold);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Lấy announcement mới nhất (7 ngày) kèm thông tin author + trophy
    public Object[] findLatestRecentWithAuthor() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            java.sql.Timestamp threshold = new java.sql.Timestamp(
                System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000);
            jakarta.persistence.Query q = em.createNativeQuery(
                BASE_SQL +
                " WHERE a.ann_ispublished = TRUE AND a.ann_createdat >= :threshold " +
                "ORDER BY a.ann_createdat DESC");
            q.setParameter("threshold", threshold);
            q.setMaxResults(1);
            List<Object[]> results = q.getResultList();
            return results.isEmpty() ? null : results.get(0);
        } finally {
            em.close();
        }
    }

    // Lấy announcement published theo ID kèm thông tin author + trophy
    public Object[] findByIdWithAuthor(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                BASE_SQL +
                " WHERE a.ann_id = :id AND a.ann_ispublished = TRUE");
            q.setParameter("id", id);
            List<Object[]> results = q.getResultList();
            return results.isEmpty() ? null : results.get(0);
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
