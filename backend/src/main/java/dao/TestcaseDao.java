// DAO - chứa các hàm thao tác với bảng testcase trong CSDL
package dao;

import entity.Testcase;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class TestcaseDao {
    // Lấy danh sách testcase theo puzzle ID (dùng để gửi lên Judge0)
    public List<Testcase> getTestcasesByPuzzleId(int puzId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Testcase> q = em.createQuery(
                "SELECT t FROM Testcase t WHERE t.puzId = :pid", Testcase.class);
            q.setParameter("pid", puzId);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // ──────────────────────────────────────────────────
    // ADMIN CRUD
    // ──────────────────────────────────────────────────

    // Tìm testcase theo ID
    public Testcase findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.find(Testcase.class, id);
        } finally {
            em.close();
        }
    }

    // Tạo testcase mới
    public void create(Testcase entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Cập nhật testcase
    public void update(Testcase entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Xoá testcase
    public void delete(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            Testcase t = em.find(Testcase.class, id);
            if (t != null) em.remove(t);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
