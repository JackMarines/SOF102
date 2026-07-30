// DAO - chứa các hàm thao tác với bảng user_trophy trong CSDL
package dao;

import java.sql.Timestamp;
import java.util.List;

import entity.UserTrophy;
import jakarta.persistence.EntityManager;
import util.JpaUtils;
        
public class UserTrophyDao {

    // Kiểm tra user đã sở hữu trophy chưa
    public boolean hasTrophy(int userId, int trophyId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            Long count = em.createQuery(
                "SELECT COUNT(ut) FROM UserTrophy ut WHERE ut.userId = :userId AND ut.trophyId = :trophyId",
                Long.class)
                .setParameter("userId", userId)
                .setParameter("trophyId", trophyId)
                .getSingleResult();
            return count > 0;
        } finally {
            em.close();
        }
    }

    // Lấy danh sách trophy của user (kèm thông tin trophy)
    public List<Object[]> findByUserId(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT ut.trop_id, t.trop_name, t.trop_avatar, t.trop_content, ut.utrop_awardedat " +
                "FROM user_trophy ut JOIN trophy t ON ut.trop_id = t.trop_id " +
                "WHERE ut.user_id = :userId ORDER BY ut.utrop_awardedat DESC");
            q.setParameter("userId", userId);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Trao trophy cho user
    public void award(int userId, int trophyId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            UserTrophy ut = new UserTrophy();
            ut.setUserId(userId);
            ut.setTrophyId(trophyId);
            ut.setAwardedAt(new Timestamp(System.currentTimeMillis()));
            em.persist(ut);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
