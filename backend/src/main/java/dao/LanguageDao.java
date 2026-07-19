// DAO - chứa các hàm thao tác với bảng language trong CSDL
package dao;

import entity.Language;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class LanguageDao {

    // Tạo ngôn ngữ mới
    public void create(Language entity) {
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
    public List<Language> findAll() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.createQuery("SELECT l FROM Language l ORDER BY l.langId", Language.class).getResultList();
        } finally {
            em.close();
        }
    }

    // Tìm theo ID
    public Language findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.find(Language.class, id);
        } finally {
            em.close();
        }
    }

    // Cập nhật
    public void update(Language entity) {
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
            Language l = em.find(Language.class, id);
            if (l != null) em.remove(l);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
