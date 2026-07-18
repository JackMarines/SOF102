// Lớp ánh xạ bảng `appeal` trong MySQL
// Lưu đơn kháng cáo của user/team khi bị cảnh cáo
package entity;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "appeal")
public class Appeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "app_id")
    private Integer appId;

    @Column(name = "app_byid")
    private Integer appByid;

    @Column(name = "app_content", columnDefinition = "TEXT")
    private String appContent;

    @Column(name = "app_date")
    private Timestamp appDate;

    @Column(name = "app_status", columnDefinition = "ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING'")
    private String appStatus = "PENDING";

    @Column(name = "app_reviewedby")
    private Integer appReviewedby;

    @Column(name = "app_reviewedat")
    private Timestamp appReviewdate;

    public Appeal() {}

    public Integer getAppId() { return appId; }
    public void setAppId(Integer appId) { this.appId = appId; }
    public Integer getAppByid() { return appByid; }
    public void setAppByid(Integer appByid) { this.appByid = appByid; }
    public String getAppContent() { return appContent; }
    public void setAppContent(String appContent) { this.appContent = appContent; }
    public Timestamp getAppDate() { return appDate; }
    public void setAppDate(Timestamp appDate) { this.appDate = appDate; }
    public String getAppStatus() { return appStatus; }
    public void setAppStatus(String appStatus) { this.appStatus = appStatus; }
    public Integer getAppReviewedby() { return appReviewedby; }
    public void setAppReviewedby(Integer appReviewedby) { this.appReviewedby = appReviewedby; }
    public Timestamp getAppReviewdate() { return appReviewdate; }
    public void setAppReviewdate(Timestamp appReviewdate) { this.appReviewdate = appReviewdate; }
}
