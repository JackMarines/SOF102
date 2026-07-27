// Utility quản lý EntityManager - giúp kết nối với CSDL qua Hibernate
package util;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

public class JpaUtils {
    private static final EntityManagerFactory factory = Persistence.createEntityManagerFactory("DevClimb");

    public static EntityManager getEntityManager() {
        return factory.createEntityManager();
    }

    public static void shutdown() {
        if (factory.isOpen()) factory.close();
    }
}