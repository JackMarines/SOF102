// Lớp ánh xạ bảng `maintenance` trong MySQL
// Bảng chỉ có 1 dòng, lưu trạng thái bảo trì hệ thống
package entity;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "maintenance")
public class Maintenance {
    @Id
    @Column(name = "maint_id")
    private Integer maintId = 1;

    @Column(name = "maint_enabled")
    private Boolean maintEnabled = false;

    @Column(name = "maint_enabledby")
    private Integer maintEnabledby;

    @Column(name = "maint_enabledat")
    private Timestamp maintEnabledat;

    public Maintenance() {}

    public Integer getMaintId() { return maintId; }
    public void setMaintId(Integer maintId) { this.maintId = maintId; }
    public Boolean getMaintEnabled() { return maintEnabled; }
    public void setMaintEnabled(Boolean maintEnabled) { this.maintEnabled = maintEnabled; }
    public Integer getMaintEnabledby() { return maintEnabledby; }
    public void setMaintEnabledby(Integer maintEnabledby) { this.maintEnabledby = maintEnabledby; }
    public Timestamp getMaintEnabledat() { return maintEnabledat; }
    public void setMaintEnabledat(Timestamp maintEnabledat) { this.maintEnabledat = maintEnabledat; }
}
