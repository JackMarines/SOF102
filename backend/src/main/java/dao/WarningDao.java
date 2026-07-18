// DAO - chứa các hàm thao tác với bảng warning trong CSDL
package dao;

import entity.Warning;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class WarningDao {

    // Tạo warning mới
    public void create(Warning entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Tìm warning theo ID
    public Warning findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.find(Warning.class, id);
        } finally {
            em.close();
        }
    }

    // Lấy tất cả warning (admin)
    public List<Warning> findAll(int page, int limit) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Warning> q = em.createQuery(
                "SELECT w FROM Warning w ORDER BY w.warnId DESC", Warning.class);
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm tất cả warning
    public long count() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.createQuery("SELECT COUNT(w) FROM Warning w", Long.class).getSingleResult();
        } finally {
            em.close();
        }
    }

    // Tìm warning đang active của user
    public Warning findActiveByUserId(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Warning> q = em.createQuery(
                "SELECT w FROM Warning w WHERE w.userId = :uid AND w.warnIsactive = true ORDER BY w.warnId DESC", Warning.class);
            q.setParameter("uid", userId);
            q.setMaxResults(1);
            List<Warning> r = q.getResultList();
            return r.isEmpty() ? null : r.get(0);
        } finally {
            em.close();
        }
    }

    // Tìm warning đang active của team
    public Warning findActiveByTeamId(int teamId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Warning> q = em.createQuery(
                "SELECT w FROM Warning w WHERE w.teamId = :tid AND w.warnIsactive = true ORDER BY w.warnId DESC", Warning.class);
            q.setParameter("tid", teamId);
            q.setMaxResults(1);
            List<Warning> r = q.getResultList();
            return r.isEmpty() ? null : r.get(0);
        } finally {
            em.close();
        }
    }

    // Vô hiệu hoá warning
    public void deactivate(int warnId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            Warning w = em.find(Warning.class, warnId);
            if (w != null) {
                w.setWarnIsactive(false);
                em.merge(w);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Lấy warning của user (kể cả inactive)
    public Warning findByUserId(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Warning> q = em.createQuery(
                "SELECT w FROM Warning w WHERE w.userId = :uid ORDER BY w.warnId DESC", Warning.class);
            q.setParameter("uid", userId);
            q.setMaxResults(1);
            List<Warning> r = q.getResultList();
            return r.isEmpty() ? null : r.get(0);
        } finally {
            em.close();
        }
    }

    // Lấy warning của team (kể cả inactive)
    public Warning findByTeamId(int teamId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Warning> q = em.createQuery(
                "SELECT w FROM Warning w WHERE w.teamId = :tid ORDER BY w.warnId DESC", Warning.class);
            q.setParameter("tid", teamId);
            q.setMaxResults(1);
            List<Warning> r = q.getResultList();
            return r.isEmpty() ? null : r.get(0);
        } finally {
            em.close();
        }
    }
}
