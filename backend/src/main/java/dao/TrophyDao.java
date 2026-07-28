// DAO - chứa các hàm thao tác với bảng trophy trong CSDL
package dao;

import entity.Trophy;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class TrophyDao {

    // Tạo trophy mới
    public void create(Trophy entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Lấy danh sách
    public List<Trophy> findAll() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.createQuery("SELECT t FROM Trophy t ORDER BY t.tropId", Trophy.class).getResultList();
        } finally {
            em.close();
        }
    }

    // Tìm theo ID
    public Trophy findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.find(Trophy.class, id);
        } finally {
            em.close();
        }
    }

    // Cập nhật
    public void update(Trophy entity) {
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
            Trophy t = em.find(Trophy.class, id);
            if (t != null) em.remove(t);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
