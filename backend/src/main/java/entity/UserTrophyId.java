// Composite key cho bảng user_trophy
package entity;

import java.io.Serializable;
import java.util.Objects;

public class UserTrophyId implements Serializable {
    private Integer userId;
    private Integer trophyId;

    public UserTrophyId() {}

    public UserTrophyId(Integer userId, Integer trophyId) {
        this.userId = userId;
        this.trophyId = trophyId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserTrophyId)) return false;
        UserTrophyId that = (UserTrophyId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(trophyId, that.trophyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, trophyId);
    }
}
