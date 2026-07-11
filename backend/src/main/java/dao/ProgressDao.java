package dao;

import entity.Progress;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.sql.Timestamp;
import java.util.List;

public class ProgressDao {
    public void upsert(int userId, int puzId, Integer progTime) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Progress> q = em.createQuery(
                "SELECT p FROM Progress p WHERE p.userId = :uid AND p.puzId = :pid",
                Progress.class);
            q.setParameter("uid", userId);
            q.setParameter("pid", puzId);
            List<Progress> existing = q.getResultList();

            em.getTransaction().begin();
            if (existing.isEmpty()) {
                Progress p = new Progress();
                p.setUserId(userId);
                p.setPuzId(puzId);
                p.setProgDate(new Timestamp(System.currentTimeMillis()));
                p.setProgTime(progTime);
                em.persist(p);
            } else {
                Progress p = existing.get(0);
                p.setProgDate(new Timestamp(System.currentTimeMillis()));
                p.setProgTime(progTime);
                em.merge(p);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}
