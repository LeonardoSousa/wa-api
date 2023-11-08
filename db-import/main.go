package main

import (
	"encoding/json"
	"fmt"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Store struct {
	Messages map[string][]*MessageWA `json:"messages"`
}
type MessageWA struct {
	Key              MessageKey  `json:"key,omitempty"`
	Status           string      `json:"status,omitempty"`
	Message          MessageBody `json:"message,omitempty"`
	MessageTimestamp string      `json:"messageTimestamp,omitempty"`
}

type MessageBody struct {
	Conversation string
	Text         string
}

type MessageDB struct {
	gorm.Model
	Id        string `gorm:"id"`
	RemoteJid string `gorm:"remoteJid"`
	FromMe    bool   `gorm:"fromMe"`
	Status    string `gorm:"status"`
	Timestamp int    `gorm:"timestamp"`
	Text      string `gorm:"text"`
}

func (MessageDB) TableName() string {
	return "messages"
}

type MessageKey struct {
	RemoteJid string `json:"remoteJid"`
	FromMe    bool   `json:"fromMe"`
	Id        string `json:"id"`
}

func main() {
	db, er := gorm.Open(mysql.Open("wargas:wrgs2703@tcp(localhost:3306)/wa?charset=utf8mb4&parseTime=True&loc=Local"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if er != nil {
		panic(er)
	}
	er = db.AutoMigrate(&MessageDB{})
	if er != nil {
		panic(er)
	}

	b, er := os.ReadFile("D:\\projetos\\baileys-wpp\\storage\\store-deltex.json")
	if er != nil {
		panic(er)
	}

	store := Store{}

	er = json.Unmarshal(b, &store)
	if er != nil {
		panic(er)
	}

	if er != nil {
		panic(er)
	}
	for key, m := range store.Messages {
		for i, msg := range m {
			// ts, _ := strconv.Atoi(msg.MessageTimestamp)
			db.Create(&MessageDB{
				Id:        msg.Key.Id,
				RemoteJid: msg.Key.RemoteJid,
				FromMe:    msg.Key.FromMe,
				Status:    msg.Status,
				// Timestamp: msg.MessageTimestamp,
			})
			fmt.Printf("\r%s [%d-%d]", key, i, len(m))
		}
	}
	println("")

}
