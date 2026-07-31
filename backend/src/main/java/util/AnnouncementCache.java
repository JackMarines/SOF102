// Cache tạm thời cho announcement — giúp giảm truy vấn CSDL khi load nhiều lần
package util;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AnnouncementCache {

    // Cache lưu dữ liệu dạng JSON (đã build sẵn)
    private static final Map<String, CachedEntry> cache = new ConcurrentHashMap<>();
    private static final long DEFAULT_TTL = 30_000; // 30 giây

    // Lấy dữ liệu từ cache, null nếu hết hạn hoặc không có
    public static Object get(String key) {
        CachedEntry entry = cache.get(key);
        if (entry == null) return null;
        if (System.currentTimeMillis() - entry.createdAt > entry.ttl) {
            cache.remove(key);
            return null;
        }
        return entry.data;
    }

    // Lưu dữ liệu vào cache với TTL mặc định
    public static void put(String key, Object data) {
        cache.put(key, new CachedEntry(data, DEFAULT_TTL));
    }

    // Xoá toàn bộ cache (gọi khi admin tạo/sửa/xoá announcement)
    public static void clearAll() {
        cache.clear();
    }

    private static class CachedEntry {
        final Object data;
        final long createdAt;
        final long ttl;

        CachedEntry(Object data, long ttl) {
            this.data = data;
            this.createdAt = System.currentTimeMillis();
            this.ttl = ttl;
        }
    }
}
