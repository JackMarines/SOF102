// DAO - chứa các hàm thao tác với bảng user_trophy trong CSDL
package dao;

import entity.UserTrophy;
import jakarta.persistence.EntityManager;
import util.JpaUtils;

import java.sql.Timestamp;

public class UserTrophyDao {

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
