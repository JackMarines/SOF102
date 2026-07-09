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

    @Column(name = "prog_time")
    private Timestamp progTime;

    public Progress() {}

    public Integer getProgId() { return progId; }
    public void setProgId(Integer progId) { this.progId = progId; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Integer getPuzId() { return puzId; }
    public void setPuzId(Integer puzId) { this.puzId = puzId; }
    public Timestamp getProgTime() { return progTime; }
    public void setProgTime(Timestamp progTime) { this.progTime = progTime; }
}
