// Lớp ánh xạ bảng `progress` trong MySQL
// Lưu lịch sử hoàn thành puzzle của user
package entity;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "progress")
public class Progress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prog_id")
    private Integer progId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "puz_id")
    private Integer puzId;

    @Column(name = "prog_date")
    private Timestamp progDate;

    @Column(name = "prog_time")
    private Integer progTime;

    @Column(name = "prog_code")
    private String progCode;

    public Progress() {}

    public Integer getProgId() { return progId; }
    public void setProgId(Integer progId) { this.progId = progId; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getPuzId() { return puzId; }
    public void setPuzId(Integer puzId) { this.puzId = puzId; }
    public Timestamp getProgDate() { return progDate; }
    public void setProgDate(Timestamp progDate) { this.progDate = progDate; }
    public Integer getProgTime() { return progTime; }
    public void setProgTime(Integer progTime) { this.progTime = progTime; }
    public String getProgCode() { return progCode; }
    public void setProgCode(String progCode) { this.progCode = progCode; }
}
