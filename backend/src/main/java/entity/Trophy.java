// Lớp ánh xạ bảng `trophy` trong MySQL
package entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "trophy")
public class Trophy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trop_id")
    private Integer tropId;

    @Column(name = "trop_image")
    private String tropImage;

    @Column(name = "trop_name")
    private String tropName;

    @Column(name = "trop_content")
    private String tropContent;

    @OneToMany(mappedBy = "trophy")
    private List<Contest> contests;

    public Trophy() {}

    public Integer getTropId() { return tropId; }
    public void setTropId(Integer tropId) { this.tropId = tropId; }
    public String getTropImage() { return tropImage; }
    public void setTropImage(String tropImage) { this.tropImage = tropImage; }
    public String getTropName() { return tropName; }
    public void setTropName(String tropName) { this.tropName = tropName; }
    public String getTropContent() { return tropContent; }
    public void setTropContent(String tropContent) { this.tropContent = tropContent; }
    public List<Contest> getContests() { return contests; }
    public void setContests(List<Contest> contests) { this.contests = contests; }
}
