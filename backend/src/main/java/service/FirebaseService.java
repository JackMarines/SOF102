// Service xử lý xác thực Firebase (Google)
package service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;

public class FirebaseService {
    private static final Logger log = LoggerFactory.getLogger(FirebaseService.class);
    private static boolean initialized = false;

    // Đọc file firebase-service-account.json và khởi tạo Firebase Admin SDK
    public static void init() {
        if (initialized) return;
        try {
            InputStream serviceAccount = FirebaseService.class.getClassLoader()
                .getResourceAsStream("firebase-service-account.json");
            if (serviceAccount == null) {
                log.warn("firebase-service-account.json not found in classpath — Firebase auth disabled");
                return;
            }
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            initialized = true;
            log.info("Firebase initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize Firebase", e);
        }
    }

    // Xác thực token client gửi lên, trả về thông tin user từ Firebase
    public static FirebaseToken verifyToken(String idToken) {
        try {
            return FirebaseAuth.getInstance().verifyIdToken(idToken);
        } catch (Exception e) {
            log.warn("Firebase token verification failed: {}", e.getMessage());
            return null;
        }
    }
}