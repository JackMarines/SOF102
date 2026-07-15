// Lớp ánh xạ bảng `team` trong MySQL
// Mỗi instance = 1 dòng trong bảng team
package entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "team")
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "team_id")
    private Integer teamId;

    @Column(name = "team_name")
    private String teamName;

    @Column(name = "team_avatar")
    private String teamAvatar;     // URL ảnh đại diện của team (Firebase Storage)

    @Column(name = "team_ownerid")
    private Integer teamOwnerId;   // ID của user sở hữu team

    @Column(name = "team_shoutout")
    private String teamShoutout;   // Câu giới thiệu ngắn của team (tối đa 500 ký tự)

    @Column(name = "team_ispublic")
    private Boolean teamIsPublic = true; // true = ai cũng có thể join, false = khoá

    @OneToMany(mappedBy = "team")
    private List<User> users;

    public Team() {}

    public Integer getTeamId() { return teamId; }
    public void setTeamId(Integer teamId) { this.teamId = teamId; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getTeamAvatar() { return teamAvatar; }
    public void setTeamAvatar(String teamAvatar) { this.teamAvatar = teamAvatar; }
    public Integer getTeamOwnerId() { return teamOwnerId; }
    public void setTeamOwnerId(Integer teamOwnerId) { this.teamOwnerId = teamOwnerId; }
    public String getTeamShoutout() { return teamShoutout; }
    public void setTeamShoutout(String teamShoutout) { this.teamShoutout = teamShoutout; }
    public Boolean getTeamIsPublic() { return teamIsPublic; }
    public void setTeamIsPublic(Boolean teamIsPublic) { this.teamIsPublic = teamIsPublic; }
    public List<User> getUsers() { return users; }
    public void setUsers(List<User> users) { this.users = users; }
}