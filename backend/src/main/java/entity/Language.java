// Lớp ánh xạ bảng `language` trong MySQL
// Mỗi instance = 1 dòng trong bảng language
package entity;

import jakarta.persistence.*;

@Entity
@Table(name = "language")
public class Language {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lang_id")
    private Integer langId;

    @Column(name = "lang_judge0")
    private Integer langJudge0;

    @Column(name = "lang_name")
    private String langName;

    public Language() {}

    public Integer getLangId() { return langId; }
    public void setLangId(Integer langId) { this.langId = langId; }
    public Integer getLangJudge0() { return langJudge0; }
    public void setLangJudge0(Integer langJudge0) { this.langJudge0 = langJudge0; }
    public String getLangName() { return langName; }
    public void setLangName(String langName) { this.langName = langName; }
}
