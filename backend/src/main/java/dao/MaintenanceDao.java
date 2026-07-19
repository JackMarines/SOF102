// DAO - chỉ có update, không có insert (bảng maintenance chỉ có 1 dòng)
package dao;

import entity.Maintenance;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class MaintenanceDao {

    // Lấy trạng thái bảo trì (chỉ 1 dòng duy nhất)
    public Maintenance get() {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Maintenance> q = em.createQuery(
                "SELECT m FROM Maintenance m WHERE m.maintId = 1", Maintenance.class);
            List<Maintenance> r = q.getResultList();
            return r.isEmpty() ? null : r.get(0);
        } finally {
            em.close();
        }
    }

    // Cập nhật trạng thái bảo trì (không tạo mới)
    public void update(Maintenance entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
