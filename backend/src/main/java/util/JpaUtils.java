// Utility quản lý EntityManager - giúp kết nối với CSDL qua Hibernate
package util;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

public class JpaUtils {
    private static volatile EntityManagerFactory factory;

    // Lấy EntityManager để thao tác với CSDL
    public static synchronized EntityManager getEntityManager() {
        if (factory == null || !factory.isOpen()) {
            factory = Persistence.createEntityManagerFactory("DevClimb");
        }
        return factory.createEntityManager();
    }

    // Đóng EntityManagerFactory (gọi khi tắt ứng dụng)
    public static void shutdown() {
        if (factory != null && factory.isOpen()) {
            factory.close();
        }
        factory = null;
    }
}