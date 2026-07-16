// DAO - chứa các hàm thao tác với bảng team trong CSDL
package dao;

import entity.Team;
import entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.ArrayList;
import java.util.List;

public class TeamDao {

    // Tạo team mới
    public void create(Team entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Tìm team theo ID
    public Team findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            return em.find(Team.class, id);
        } finally {
            em.close();
        }
    }

    // Lấy danh sách team có phân trang + tìm kiếm + sắp xếp
    public List<Object[]> findAllWithStats(int page, int limit, String search,
                                            String sortBy, String order) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder sql = new StringBuilder(
                "SELECT t.team_id, t.team_name, t.team_avatar, t.team_ownerid, t.team_ispublic, " +
                "(SELECT COUNT(*) FROM user u WHERE u.team_id = t.team_id) as memberCount, " +
                "(SELECT COALESCE(SUM(p.puz_score), 0) FROM progress pr " +
                " JOIN puzzle p ON pr.puz_id = p.puz_id " +
                " JOIN user u ON pr.user_id = u.user_id WHERE u.team_id = t.team_id) as solvedTotal " +
                "FROM team t WHERE 1=1");

            if (search != null && !search.trim().isEmpty()) {
                sql.append(" AND LOWER(t.team_name) LIKE :search");
            }

            if ("members".equals(sortBy) && "asc".equalsIgnoreCase(order)) {
                sql.append(" ORDER BY memberCount ASC, t.team_id");
            } else if ("members".equals(sortBy)) {
                sql.append(" ORDER BY memberCount DESC, t.team_id");
            } else if ("solved".equals(sortBy) && "asc".equalsIgnoreCase(order)) {
                sql.append(" ORDER BY solvedTotal ASC, t.team_id");
            } else if ("solved".equals(sortBy)) {
                sql.append(" ORDER BY solvedTotal DESC, t.team_id");
            } else {
                sql.append(" ORDER BY t.team_id");
            }

            jakarta.persistence.Query q = em.createNativeQuery(sql.toString());
            if (search != null && !search.trim().isEmpty()) {
                q.setParameter("search", "%" + search.trim().toLowerCase() + "%");
            }
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm tổng số team (dùng cho phân trang)
    public long count(String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder jpql = new StringBuilder(
                "SELECT COUNT(t) FROM Team t WHERE 1=1");
            if (search != null && !search.trim().isEmpty()) {
                jpql.append(" AND LOWER(t.teamName) LIKE :search");
            }
            TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class);
            if (search != null && !search.trim().isEmpty()) {
                query.setParameter("search", "%" + search.trim().toLowerCase() + "%");
            }
            return query.getSingleResult();
        } finally {
            em.close();
        }
    }

    // Cập nhật team
    public void update(Team entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Xoá team + set team_id = null cho tất cả member (dùng chung EM với transaction bên ngoài)
    public void deleteWithMembers(EntityManager em, int teamId) {
        jakarta.persistence.Query clearUsers = em.createQuery(
            "UPDATE User u SET u.team = null WHERE u.team.teamId = :tid");
        clearUsers.setParameter("tid", teamId);
        clearUsers.executeUpdate();

        Team team = em.find(Team.class, teamId);
        if (team != null) {
            em.remove(team);
        }
    }

    // Đếm số thành viên trong team
    public long countMembers(int teamId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Long> q = em.createQuery(
                "SELECT COUNT(u) FROM User u WHERE u.team.teamId = :tid", Long.class);
            q.setParameter("tid", teamId);
            return q.getSingleResult();
        } finally {
            em.close();
        }
    }

    // Lấy danh sách thành viên (có tìm kiếm theo tên)
    public List<Object[]> getMembers(int teamId, String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            StringBuilder sql = new StringBuilder(
                "SELECT u.user_id, u.user_name, u.user_avatar, " +
                "COALESCE((SELECT SUM(p.puz_score) FROM progress pr " +
                " JOIN puzzle p ON pr.puz_id = p.puz_id WHERE pr.user_id = u.user_id), 0) as totalScore, " +
                "COALESCE((SELECT COUNT(*) FROM progress pr2 WHERE pr2.user_id = u.user_id), 0) as totalPuzzles, " +
                "u.user_isadmin " +
                "FROM user u WHERE u.team_id = ?");
            if (search != null && !search.trim().isEmpty()) {
                sql.append(" AND LOWER(u.user_name) LIKE ?");
            }
            sql.append(" ORDER BY totalScore DESC");

            jakarta.persistence.Query q = em.createNativeQuery(sql.toString());
            q.setParameter(1, teamId);
            if (search != null && !search.trim().isEmpty()) {
                q.setParameter(2, "%" + search.trim().toLowerCase() + "%");
            }
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Tổng số puzzle đã hoàn thành bởi tất cả thành viên
    public long getTotalSolvedByTeam(int teamId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COALESCE(COUNT(*), 0) FROM progress pr " +
                "WHERE pr.user_id IN (SELECT u.user_id FROM user u WHERE u.team_id = ?)");
            q.setParameter(1, teamId);
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    // Số thành viên đã giải ít nhất 1 puzzle (dùng cho throughput)
    public long getParticipatedMemberCount(int teamId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT COUNT(DISTINCT pr.user_id) FROM progress pr " +
                "WHERE pr.user_id IN (SELECT u.user_id FROM user u WHERE u.team_id = ?)");
            q.setParameter(1, teamId);
            return ((Number) q.getSingleResult()).longValue();
        } finally {
            em.close();
        }
    }

    // Top 6 thành viên theo total score
    public List<Object[]> getTopMembers(int teamId, int limit) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            jakarta.persistence.Query q = em.createNativeQuery(
                "SELECT u.user_id, u.user_name, u.user_avatar, " +
                "COALESCE((SELECT SUM(p.puz_score) FROM progress pr " +
                " JOIN puzzle p ON pr.puz_id = p.puz_id WHERE pr.user_id = u.user_id), 0) as totalScore " +
                "FROM user u WHERE u.team_id = ? " +
                "ORDER BY totalScore DESC LIMIT ?");
            q.setParameter(1, teamId);
            q.setParameter(2, limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Kiểm tra user có phải owner của team không
    public boolean isOwner(int teamId, int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Long> q = em.createQuery(
                "SELECT COUNT(t) FROM Team t WHERE t.teamId = :tid AND t.teamOwnerId = :uid",
                Long.class);
            q.setParameter("tid", teamId);
            q.setParameter("uid", userId);
            return q.getSingleResult() > 0;
        } finally {
            em.close();
        }
    }
}
