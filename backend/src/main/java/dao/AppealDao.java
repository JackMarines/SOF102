// DAO - chứa các hàm thao tác với bảng appeal trong CSDL
package dao;

import entity.Appeal;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.sql.Timestamp;
import java.util.List;

public class AppealDao {

    // Tạo appeal mới
    public void create(Appeal entity) {
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
    public Appeal findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.find(Appeal.class, id);
        } finally {
            em.close();
        }
    }

    // Lấy tất cả appeal (admin)
    public List<Appeal> findAll(int page, int limit) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Appeal> q = em.createQuery(
                "SELECT a FROM Appeal a ORDER BY a.appDate DESC", Appeal.class);
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
            return em.createQuery("SELECT COUNT(a) FROM Appeal a", Long.class).getSingleResult();
        } finally {
            em.close();
        }
    }

    // Lấy appeal theo applicant
    public List<Appeal> findByApplicantId(int applicantId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Appeal> q = em.createQuery(
                "SELECT a FROM Appeal a WHERE a.appByid = :aid ORDER BY a.appDate DESC", Appeal.class);
            q.setParameter("aid", applicantId);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Approve appeal
    public void approve(int appealId, int reviewerId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            Appeal a = em.find(Appeal.class, appealId);
            if (a != null) {
                a.setAppStatus("APPROVED");
                a.setAppReviewedby(reviewerId);
                a.setAppReviewdate(new Timestamp(System.currentTimeMillis()));
                em.merge(a);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Reject appeal
    public void reject(int appealId, int reviewerId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            Appeal a = em.find(Appeal.class, appealId);
            if (a != null) {
                a.setAppStatus("REJECTED");
                a.setAppReviewedby(reviewerId);
                a.setAppReviewdate(new Timestamp(System.currentTimeMillis()));
                em.merge(a);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
