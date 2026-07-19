// Utility upload file lên Cloudflare R2 Storage
// Dùng AWS SDK v2 (R2 tương thích S3 API)
package util;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;
import java.net.URI;
import java.util.Properties;

public class R2Util {
    private static S3Client client;
    private static String bucketName;
    private static String publicUrlBase;

    static {
        try (InputStream is = R2Util.class.getClassLoader()
                .getResourceAsStream("r2.properties")) {
            if (is != null) {
                Properties props = new Properties();
                props.load(is);

                String accountId = props.getProperty("r2.account-id");
                String accessKey = props.getProperty("r2.access-key");
                String secretKey = props.getProperty("r2.secret-key");
                bucketName = props.getProperty("r2.bucket-name");
                publicUrlBase = props.getProperty("r2.public-url");

                AwsBasicCredentials creds = AwsBasicCredentials.create(accessKey, secretKey);

                client = S3Client.builder()
                    .endpointOverride(URI.create("https://" + accountId + ".r2.cloudflarestorage.com"))
                    .credentialsProvider(StaticCredentialsProvider.create(creds))
                    .region(Region.of("auto"))
                    .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .chunkedEncodingEnabled(false)
                        .build())
                    .build();
            }
        } catch (Exception e) {
            System.err.println("R2Util init failed: " + e.getMessage());
        }
    }

    // Kiểm tra R2 đã được cấu hình chưa
    public static boolean isConfigured() {
        return client != null;
    }

    // Upload ảnh lên R2, trả về URL public
    public static String uploadAvatar(int userId, InputStream file, long size, String contentType) {
        if (client == null) return null;

        String ext;
        if ("image/png".equals(contentType)) ext = ".png";
        else if ("image/gif".equals(contentType)) ext = ".gif";
        else ext = ".jpg";

        String key = "profile/" + userId + "_" + System.currentTimeMillis() + ext;

        client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build(),
            RequestBody.fromInputStream(file, size));

        return publicUrlBase + "/" + key;
    }

    // Upload ảnh team lên R2, trả về URL public
    public static String uploadTeamAvatar(int teamId, InputStream file, long size, String contentType) {
        if (client == null) return null;

        String ext;
        if ("image/png".equals(contentType)) ext = ".png";
        else if ("image/gif".equals(contentType)) ext = ".gif";
        else ext = ".jpg";

        String key = "team/" + teamId + "_" + System.currentTimeMillis() + ext;

        client.putObject(
            PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build(),
            RequestBody.fromInputStream(file, size));

        return publicUrlBase + "/" + key;
    }
}
