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

    @OneToMany(mappedBy = "team")
    private List<User> users;

    public Team() {}

    public Integer getTeamId() { return teamId; }
    public void setTeamId(Integer teamId) { this.teamId = teamId; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public List<User> getUsers() { return users; }
    public void setUsers(List<User> users) { this.users = users; }
}