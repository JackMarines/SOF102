package dao;

import entity.Testcase;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class TestcaseDao {
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
}
