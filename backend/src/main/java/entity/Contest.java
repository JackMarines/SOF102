// Lớp ánh xạ bảng `contest` trong MySQL
package entity;

import jakarta.persistence.*;
import java.sql.Timestamp;
import java.util.List;

@Entity
@Table(name = "contest")
public class Contest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "con_id")
    private Integer conId;

    @Column(name = "con_title")
    private String conTitle;

    @Column(name = "con_content")
    private String conContent;

    @Column(name = "con_start")
    private Timestamp conStart;

    @Column(name = "con_end")
    private Timestamp conEnd;

    @Column(name = "con_avatar")
    private String conAvatar;

    @Column(name = "con_authorid")
    private Integer conAuthorId;

    @ManyToOne
    @JoinColumn(name = "trop_id")
    private Trophy trophy;

    @OneToMany(mappedBy = "contest")
    private List<Puzzle> puzzles;

    public Contest() {}

    public Integer getConId() { return conId; }
    public void setConId(Integer conId) { this.conId = conId; }
    public String getConTitle() { return conTitle; }
    public void setConTitle(String conTitle) { this.conTitle = conTitle; }
    public String getConContent() { return conContent; }
    public void setConContent(String conContent) { this.conContent = conContent; }
    public Timestamp getConStart() { return conStart; }
    public void setConStart(Timestamp conStart) { this.conStart = conStart; }
    public Timestamp getConEnd() { return conEnd; }
    public void setConEnd(Timestamp conEnd) { this.conEnd = conEnd; }
    public String getConAvatar() { return conAvatar; }
    public void setConAvatar(String conAvatar) { this.conAvatar = conAvatar; }
    public Integer getConAuthorId() { return conAuthorId; }
    public void setConAuthorId(Integer conAuthorId) { this.conAuthorId = conAuthorId; }
    public Trophy getTrophy() { return trophy; }
    public void setTrophy(Trophy trophy) { this.trophy = trophy; }
    public List<Puzzle> getPuzzles() { return puzzles; }
    public void setPuzzles(List<Puzzle> puzzles) { this.puzzles = puzzles; }
}
