// Lớp ánh xạ bảng `announcement` trong MySQL
// Lưu thông báo hệ thống
package entity;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "announcement")
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ann_id")
    private Integer annId;

    @Column(name = "ann_title")
    private String annTitle;

    @Column(name = "ann_content", columnDefinition = "TEXT")
    private String annContent;

    @Column(name = "ann_authorid")
    private Integer annAuthorid;

    @Column(name = "ann_createdat")
    private Timestamp annCreatedat;

    @Column(name = "ann_updatedat")
    private Timestamp annUpdatedat;

    @Column(name = "ann_ispinned")
    private Boolean annIspinned = false;

    @Column(name = "ann_ispublished")
    private Boolean annIspublished = true;

    @Column(name = "ann_type")
    private String annType;

    public Announcement() {}

    public Integer getAnnId() { return annId; }
    public void setAnnId(Integer annId) { this.annId = annId; }
    public String getAnnTitle() { return annTitle; }
    public void setAnnTitle(String annTitle) { this.annTitle = annTitle; }
    public String getAnnContent() { return annContent; }
    public void setAnnContent(String annContent) { this.annContent = annContent; }
    public Integer getAnnAuthorid() { return annAuthorid; }
    public void setAnnAuthorid(Integer annAuthorid) { this.annAuthorid = annAuthorid; }
    public Timestamp getAnnCreatedat() { return annCreatedat; }
    public void setAnnCreatedat(Timestamp annCreatedat) { this.annCreatedat = annCreatedat; }
    public Timestamp getAnnUpdatedat() { return annUpdatedat; }
    public void setAnnUpdatedat(Timestamp annUpdatedat) { this.annUpdatedat = annUpdatedat; }
    public Boolean getAnnIspinned() { return annIspinned; }
    public void setAnnIspinned(Boolean annIspinned) { this.annIspinned = annIspinned; }
    public Boolean getAnnIspublished() { return annIspublished; }
    public void setAnnIspublished(Boolean annIspublished) { this.annIspublished = annIspublished; }
    public String getAnnType() { return annType; }
    public void setAnnType(String annType) { this.annType = annType; }
}
