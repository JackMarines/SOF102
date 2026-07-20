// DAO - chứa các hàm thao tác với bảng user trong CSDL
package dao;

import entity.Team;
import entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import util.JpaUtils;

import java.util.List;

public class UserDao {

    // Tạo (thêm) một user mới vào CSDL
    public void create(User entity) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(entity);
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Tìm user theo firebaseUid (dùng khi đăng nhập)
    public User findByFirebaseUid(String firebaseUid) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<User> query = em.createQuery(
                "SELECT u FROM User u WHERE u.userFirebaseuid = :uid", User.class);
            query.setParameter("uid", firebaseUid);
            List<User> result = query.getResultList();
            return result.isEmpty() ? null : result.get(0);
        } finally {
            em.close();
        }
    }

    // Tìm user theo email
    public User findByEmail(String email) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<User> query = em.createQuery(
                "SELECT u FROM User u WHERE u.userEmail = :email", User.class);
            query.setParameter("email", email);
            List<User> result = query.getResultList();
            return result.isEmpty() ? null : result.get(0);
        } finally {
            em.close();
        }
    }

    // Tìm user theo username
    public User findByUsername(String username) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<User> query = em.createQuery(
                "SELECT u FROM User u WHERE u.userName = :name", User.class);
            query.setParameter("name", username);
            List<User> result = query.getResultList();
            return result.isEmpty() ? null : result.get(0);
        } finally {
            em.close();
        }
    }

    // Tìm user theo ID (kèm team để lấy groupName)
    public User findById(int id) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<User> query = em.createQuery(
                "SELECT u FROM User u LEFT JOIN FETCH u.team WHERE u.userId = :id", User.class);
            query.setParameter("id", id);
            List<User> result = query.getResultList();
            return result.isEmpty() ? null : result.get(0);
        } finally {
            em.close();
        }
    }

    // Cập nhật profile: chỉ update các field không null
    public void update(int userId, String name, String bio, String avatar) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            User user = em.find(User.class, userId);
            if (user != null) {
                if (name != null) user.setUserName(name);
                if (bio != null) user.setUserBio(bio);
                if (avatar != null) user.setUserAvatar(avatar);
                em.merge(user);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    public void updateEmail(int userId, String email) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            User user = em.find(User.class, userId);
            if (user != null) {
                user.setUserEmail(email);
                em.merge(user);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Thay đổi team của user (null = rời team)
    public void setTeam(int userId, Team team) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            User user = em.find(User.class, userId);
            if (user != null) {
                user.setTeam(team);
                em.merge(user);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Tìm user theo tên (LIKE), có phân trang + sắp xếp A-Z, kèm score + team
    public List<Object[]> search(int page, int limit, String query) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            String sql =
                "SELECT u.user_id, u.user_name, u.user_avatar, u.user_isadmin, " +
                "t.team_name, " +
                "COALESCE((SELECT SUM(p.puz_score) FROM progress pr " +
                " JOIN puzzle p ON pr.puz_id = p.puz_id WHERE pr.user_id = u.user_id), 0) as totalScore, " +
                "COALESCE((SELECT COUNT(*) FROM progress pr2 WHERE pr2.user_id = u.user_id), 0) as totalPuzzles " +
                "FROM user u " +
                "LEFT JOIN team t ON u.team_id = t.team_id " +
                "WHERE u.user_isactive = true AND LOWER(u.user_name) LIKE :query " +
                "ORDER BY u.user_name ASC";

            jakarta.persistence.Query q = em.createNativeQuery(sql);
            q.setParameter("query", "%" + query.toLowerCase() + "%");
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm số user khớp với tìm kiếm (dùng cho phân trang)
    public long countSearch(String query) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            TypedQuery<Long> q = em.createQuery(
                "SELECT COUNT(u) FROM User u WHERE LOWER(u.userName) LIKE :query", Long.class);
            q.setParameter("query", "%" + query.toLowerCase() + "%");
            return q.getSingleResult();
        } finally {
            em.close();
        }
    }

    // ──────────────────────────────────────────────────
    // ADMIN
    // ──────────────────────────────────────────────────

    // Lấy danh sách user active (admin)
    public List<User> findActiveAll(int page, int limit) {
        return findActiveAll(page, limit, null);
    }

    public List<User> findActiveAll(int page, int limit, String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            String jpql = "SELECT u FROM User u LEFT JOIN FETCH u.team WHERE u.userIsactive = true";
            if (search != null && !search.trim().isEmpty()) {
                jpql += " AND (LOWER(u.userName) LIKE :q OR LOWER(u.userEmail) LIKE :q)";
            }
            jpql += " ORDER BY u.userId";
            TypedQuery<User> q = em.createQuery(jpql, User.class);
            if (search != null && !search.trim().isEmpty()) {
                q.setParameter("q", "%" + search.trim().toLowerCase() + "%");
            }
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Lấy tất cả user (bao gồm inactive)
    public List<User> findAll(int page, int limit) {
        return findAll(page, limit, null);
    }

    public List<User> findAll(int page, int limit, String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            String jpql = "SELECT u FROM User u LEFT JOIN FETCH u.team";
            if (search != null && !search.trim().isEmpty()) {
                jpql += " WHERE (LOWER(u.userName) LIKE :q OR LOWER(u.userEmail) LIKE :q)";
            }
            jpql += " ORDER BY u.userId";
            TypedQuery<User> q = em.createQuery(jpql, User.class);
            if (search != null && !search.trim().isEmpty()) {
                q.setParameter("q", "%" + search.trim().toLowerCase() + "%");
            }
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm user active
    public long countActive() {
        return countActive(null);
    }

    public long countActive(String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            String jpql = "SELECT COUNT(u) FROM User u WHERE u.userIsactive = true";
            if (search != null && !search.trim().isEmpty()) {
                jpql += " AND (LOWER(u.userName) LIKE :q OR LOWER(u.userEmail) LIKE :q)";
            }
            TypedQuery<Long> q = em.createQuery(jpql, Long.class);
            if (search != null && !search.trim().isEmpty()) {
                q.setParameter("q", "%" + search.trim().toLowerCase() + "%");
            }
            return q.getSingleResult();
        } finally {
            em.close();
        }
    }

    // Đếm tất cả user
    public long countAll() {
        return countAll(null);
    }

    public long countAll(String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            String jpql = "SELECT COUNT(u) FROM User u";
            if (search != null && !search.trim().isEmpty()) {
                jpql += " WHERE (LOWER(u.userName) LIKE :q OR LOWER(u.userEmail) LIKE :q)";
            }
            TypedQuery<Long> q = em.createQuery(jpql, Long.class);
            if (search != null && !search.trim().isEmpty()) {
                q.setParameter("q", "%" + search.trim().toLowerCase() + "%");
            }
            return q.getSingleResult();
        } finally {
            em.close();
        }
    }

    // Lấy danh sách user inactive (banned)
    public List<User> findInactiveAll(int page, int limit) {
        return findInactiveAll(page, limit, null);
    }

    public List<User> findInactiveAll(int page, int limit, String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            String jpql = "SELECT u FROM User u LEFT JOIN FETCH u.team WHERE u.userIsactive = false";
            if (search != null && !search.trim().isEmpty()) {
                jpql += " AND (LOWER(u.userName) LIKE :q OR LOWER(u.userEmail) LIKE :q)";
            }
            jpql += " ORDER BY u.userId";
            TypedQuery<User> q = em.createQuery(jpql, User.class);
            if (search != null && !search.trim().isEmpty()) {
                q.setParameter("q", "%" + search.trim().toLowerCase() + "%");
            }
            q.setFirstResult((page - 1) * limit);
            q.setMaxResults(limit);
            return q.getResultList();
        } finally {
            em.close();
        }
    }

    // Đếm user inactive
    public long countInactiveAll() {
        return countInactiveAll(null);
    }

    public long countInactiveAll(String search) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            String jpql = "SELECT COUNT(u) FROM User u WHERE u.userIsactive = false";
            if (search != null && !search.trim().isEmpty()) {
                jpql += " AND (LOWER(u.userName) LIKE :q OR LOWER(u.userEmail) LIKE :q)";
            }
            TypedQuery<Long> q = em.createQuery(jpql, Long.class);
            if (search != null && !search.trim().isEmpty()) {
                q.setParameter("q", "%" + search.trim().toLowerCase() + "%");
            }
            return q.getSingleResult();
        } finally {
            em.close();
        }
    }

    // Set inactive (soft delete / ban)
    public void setInactive(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            User u = em.find(User.class, userId);
            if (u != null) { u.setUserIsactive(false); em.merge(u); }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Set active (reactivate)
    public void setActive(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            User u = em.find(User.class, userId);
            if (u != null) { u.setUserIsactive(true); em.merge(u); }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Lưu thông tin team khi user bị ban khỏi team
    public void setLastTeamInfo(int userId, String teamName, String leaveReason) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            User u = em.find(User.class, userId);
            if (u != null) {
                u.setUserLastteamname(teamName);
                u.setUserLastleaveReason(leaveReason);
                u.setTeam(null);
                em.merge(u);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }

    // Xoá thông tin team ban (sau khi user acknowledge)
    public void clearLastTeamInfo(int userId) {
        EntityManager em = JpaUtils.getEntityManager();
        try {
            em.getTransaction().begin();
            User u = em.find(User.class, userId);
            if (u != null) {
                u.setUserLastteamname(null);
                u.setUserLastleaveReason("NONE");
                em.merge(u);
            }
            em.getTransaction().commit();
        } finally {
            em.close();
        }
    }
}