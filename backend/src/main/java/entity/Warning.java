// Lớp ánh xạ bảng `warning` trong MySQL
// Lưu cảnh cáo user/team trước khi ban
package entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "warning")
public class Warning {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warn_id")
    private Integer warnId;

    @Column(name = "warn_isactive")
    private Boolean warnIsactive = true;

    @Column(name = "warn_startdate")
    @Temporal(TemporalType.DATE)
    private Date warnStartdate;

    @Column(name = "warn_enddate")
    @Temporal(TemporalType.DATE)
    private Date warnEnddate;

    @Column(name = "warn_authorid")
    private Integer warnAuthorid;

    @Column(name = "warn_reason", columnDefinition = "TEXT")
    private String warnReason;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "team_id")
    private Integer teamId;

    public Warning() {}

    public Integer getWarnId() { return warnId; }
    public void setWarnId(Integer warnId) { this.warnId = warnId; }
    public Boolean getWarnIsactive() { return warnIsactive; }
    public void setWarnIsactive(Boolean warnIsactive) { this.warnIsactive = warnIsactive; }
    public Date getWarnStartdate() { return warnStartdate; }
    public void setWarnStartdate(Date warnStartdate) { this.warnStartdate = warnStartdate; }
    public Date getWarnEnddate() { return warnEnddate; }
    public void setWarnEnddate(Date warnEnddate) { this.warnEnddate = warnEnddate; }
    public Integer getWarnAuthorid() { return warnAuthorid; }
    public void setWarnAuthorid(Integer warnAuthorid) { this.warnAuthorid = warnAuthorid; }
    public String getWarnReason() { return warnReason; }
    public void setWarnReason(String warnReason) { this.warnReason = warnReason; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getTeamId() { return teamId; }
    public void setTeamId(Integer teamId) { this.teamId = teamId; }
}
