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
}