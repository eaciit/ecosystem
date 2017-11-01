package helper

import (
	"bufio"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"time"

	"github.com/eaciit/sqlh"

	db "github.com/eaciit/dbox"
	tk "github.com/eaciit/toolkit"
	_ "github.com/go-sql-driver/mysql"
)

var (
	cacheConfig tk.M
)

// Generate unique session ID
// source https://github.com/astaxie/build-web-application-with-golang/blob/master/en/06.2.md
func GenerateSessionId() string {
	b := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return ""
	}
	return base64.URLEncoding.EncodeToString(b)
}

// exac path location of file where this function is called
// example /Users/novalagung/Documents/go/src/eaciit/scb-eco/webapp/apps/main/controllers
func GetCurrentFolderPath(anything interface{}) string {
	dir, _ := os.Getwd()
	packagePath := reflect.TypeOf(anything).PkgPath()
	// Prevsiously using os.PathSeparator but failed on windows, so we harcode it
	topPackageFolderName := strings.Split(packagePath, "/")[0]
	finalPath := filepath.Join(strings.Split(dir, topPackageFolderName)[0], packagePath)

	return finalPath
}

// get config location of app where this function is called
// example /Users/novalagung/Documents/go/src/eaciit/scb-eco/webapp/apps/main/conf/app.conf
func GetConfigPath(anything interface{}) string {
	configFilePath := filepath.Join(GetAppBasePath(anything), "conf", "app.conf")
	return configFilePath
}

// get base location of app where this function is called
// example /Users/novalagung/Documents/go/src/eaciit/scb-eco/webapp/apps/main
func GetAppBasePath(anything interface{}) string {
	dir, _ := os.Getwd()
	packagePath := reflect.TypeOf(anything).PkgPath()

	appFolder := strings.Split(strings.Split(packagePath, "/apps/")[1], "/")[0]
	configFilePath := filepath.Join(dir, "apps", appFolder)

	return configFilePath
}

func GetCurrentFolderName(anything interface{}) string {
	parts := strings.Split(GetAppBasePath(anything), string(os.PathSeparator))
	folderName := parts[len(parts)-1]

	return folderName
}

func PrepareConnection(anything interface{}) (*sql.DB, error) {
	config := ReadConfig(anything)
	connInfo := &db.ConnectionInfo{
		Host:     config.GetString("host"),
		Database: config.GetString("database"),
		UserName: config.GetString("username"),
		Password: config.GetString("password"),
		Settings: tk.M{}.Set("timeout", config.GetFloat64("dbtimeout")),
	}

	Println("Connecting to database server", connInfo.Host, connInfo.Database)

	sqlconn := connInfo.UserName + ":" + connInfo.Password + "@tcp(" + connInfo.Host + ")/" + connInfo.Database
	conn, err := sqlh.Connect("mysql", sqlconn)
	if err != nil {
		return nil, err
	}

	return conn, nil
}

func PrepareDefaultUser(db *sql.DB) error {
	Println("Generating Default user into database...")

	sql := `CREATE TABLE eaciit_user (
		id int(11) NOT NULL AUTO_INCREMENT,
		username varchar(100) NOT NULL,
		password varchar(100) NOT NULL,
		role varchar(100) NOT NULL,
		PRIMARY KEY (id,username)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8`

	qr := sqlh.Exec(db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		return qr.Error()
	}

	sql = `SELECT * FROM eaciit_user`
	qr = sqlh.Exec(db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		return qr.Error()
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		return err
	}

	if len(results) == 0 {
		hashedPassword, err := Encrypt("Password.1")
		if err != nil {
			return err
		}

		sql = `INSERT INTO eaciit_user VALUES (1, "eaciit", "` + hashedPassword + `", "admin")`
		qr = sqlh.Exec(db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			return qr.Error()
		}

		Println("Generating Default user into database [SUCCESS]")
	}

	return nil
}

func ReadConfig(anything interface{}) tk.M {
	if len(cacheConfig) > 0 {
		Println("Reading configuration file from cache")
		return cacheConfig
	}

	configLocation := GetConfigPath(anything)
	res := make(tk.M)

	Println("Reading configuration file @", configLocation)

	file, err := os.Open(configLocation)
	if file != nil {
		defer file.Close()
	}
	if err != nil {
		tk.Println(err.Error())
		return res
	}

	reader := bufio.NewReader(file)
	for {
		line, _, e := reader.ReadLine()
		if e != nil {
			break
		}

		sval := strings.Split(string(line), "=")
		if len(sval) > 1 {
			res.Set(sval[0], sval[1])
		}
	}

	if !res.Has("dbtimeout") {
		res.Set("dbtimeout", 10)
	}

	for key := range res {
		if strings.HasPrefix(res.GetString(key), "./") {
			newPath := filepath.Join(configLocation, "..", strings.Replace(res.GetString(key), "./", "", 1))
			res.Set(key, newPath)
		}
	}

	cacheConfig = res
	return res
}

func Println(a ...interface{}) {
	tk.Println(append([]interface{}{"           >"}, a...)...)
}

func InTimeSpan(start, finish, check time.Time) bool {
	return check.After(start) && check.Before(finish)
}

func IsTimeBefore(start, finish time.Time) bool {
	return start.Before(finish)
}

func IsTimeAfter(start, finish time.Time) bool {
	return finish.Before(start)
}

// AES Encryption
func Encrypt(text string) (string, error) {
	plaintext := []byte(text)
	key := []byte("*eaciit-standard-chartered-apps*")
	c, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(c)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	result := fmt.Sprintf("%x", ciphertext)
	return result, nil
}

func Decrypt(text string) (string, error) {
	ciphertext, err := hex.DecodeString(text)
	if err != nil {
		return "", err
	}
	key := []byte("*eaciit-standard-chartered-apps*")
	c, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(c)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", err
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	res, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	result := fmt.Sprintf("%s", res)
	return result, nil
}
