package entity;

import jakarta.persistence.*;

@Entity
@Table(name = "testcase")
public class Testcase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tc_id")
    private Integer tcId;

    @Column(name = "tc_input", columnDefinition = "TEXT")
    private String tcInput;

    @Column(name = "tc_output", columnDefinition = "TEXT")
    private String tcOutput;

    @Column(name = "puz_id")
    private Integer puzId;

    public Testcase() {}

    public Integer getTcId() { return tcId; }
    public void setTcId(Integer tcId) { this.tcId = tcId; }
    public String getTcInput() { return tcInput; }
    public void setTcInput(String tcInput) { this.tcInput = tcInput; }
    public String getTcOutput() { return tcOutput; }
    public void setTcOutput(String tcOutput) { this.tcOutput = tcOutput; }
    public Integer getPuzId() { return puzId; }
    public void setPuzId(Integer puzId) { this.puzId = puzId; }
}
