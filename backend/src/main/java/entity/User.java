// Lớp ánh xạ bảng `user` trong MySQL
// Mỗi instance = 1 dòng trong bảng user
package entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_firebaseuid")
    private String userFirebaseuid;

    @Column(name = "user_isadmin")
    private Boolean userIsadmin = false;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    public User() {}

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserFirebaseuid() { return userFirebaseuid; }
    public void setUserFirebaseuid(String userFirebaseuid) { this.userFirebaseuid = userFirebaseuid; }
    public Boolean getUserIsadmin() { return userIsadmin; }
    public void setUserIsadmin(Boolean userIsadmin) { this.userIsadmin = userIsadmin; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
}