// Lớp ánh xạ bảng `user_trophy` trong MySQL
package entity;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "user_trophy")
@IdClass(UserTrophyId.class)
public class UserTrophy {
    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Id
    @Column(name = "trop_id")
    private Integer trophyId;

    @Column(name = "utrop_awardedat")
    private Timestamp awardedAt;

    public UserTrophy() {}

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getTrophyId() { return trophyId; }
    public void setTrophyId(Integer trophyId) { this.trophyId = trophyId; }
    public Timestamp getAwardedAt() { return awardedAt; }
    public void setAwardedAt(Timestamp awardedAt) { this.awardedAt = awardedAt; }
}
