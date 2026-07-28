// Lớp ánh xạ bảng `puzzle` trong MySQL
// Mỗi instance = 1 dòng trong bảng puzzle
package entity;

import jakarta.persistence.*;

@Entity
@Table(name = "puzzle")
public class Puzzle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "puz_id")
    private Integer puzId;

    @Column(name = "puz_function")
    private String puzFunction;

    @Column(name = "puz_title")
    private String puzTitle;

    @Column(name = "puz_content")
    private String puzContent;

    @ManyToOne
    @JoinColumn(name = "lang_id")
    private Language language;

    @ManyToOne
    @JoinColumn(name = "con_id")
    private Contest contest;

    @Column(name = "puz_difficulty")
    private String puzDifficulty;

    @Column(name = "puz_score")
    private Integer puzScore;

    public Puzzle() {}

    public Integer getPuzId() { return puzId; }
    public void setPuzId(Integer puzId) { this.puzId = puzId; }
    public String getPuzFunction() { return puzFunction; }
    public void setPuzFunction(String puzFunction) { this.puzFunction = puzFunction; }
    public String getPuzTitle() { return puzTitle; }
    public void setPuzTitle(String puzTitle) { this.puzTitle = puzTitle; }
    public String getPuzContent() { return puzContent; }
    public void setPuzContent(String puzContent) { this.puzContent = puzContent; }
    public Language getLanguage() { return language; }
    public void setLanguage(Language language) { this.language = language; }
    public String getPuzDifficulty() { return puzDifficulty; }
    public void setPuzDifficulty(String puzDifficulty) { this.puzDifficulty = puzDifficulty; }
    public Integer getPuzScore() { return puzScore; }
    public void setPuzScore(Integer puzScore) { this.puzScore = puzScore; }
    public Contest getContest() { return contest; }
    public void setContest(Contest contest) { this.contest = contest; }
}
