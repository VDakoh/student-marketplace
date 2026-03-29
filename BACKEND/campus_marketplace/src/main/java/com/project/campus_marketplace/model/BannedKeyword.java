package com.project.campus_marketplace.model;

import jakarta.persistence.*;

@Entity
@Table(name = "banned_keywords")
public class BannedKeyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String word;

    public BannedKeyword() {}

    public BannedKeyword(String word) {
        this.word = word;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }
}