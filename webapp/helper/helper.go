package helper

import (
	"bufio"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"time"

	db "github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/mongo"
	tk "github.com/eaciit/toolkit"
)

var (
	cacheConfig tk.M
)

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

func PrepareConnection(anything interface{}) (db.IConnection, error) {
	config := ReadConfig(anything)
	connInfo := &db.ConnectionInfo{
		Host:     config.GetString("host"),
		Database: config.GetString("database"),
		UserName: config.GetString("username"),
		Password: config.GetString("password"),
		Settings: tk.M{}.Set("timeout", config.GetFloat64("dbtimeout")),
	}

	Println("Connecting to database server", connInfo.Host, connInfo.Database)

	conn, err := db.NewConnection("mongo", connInfo)
	if err != nil {
		return nil, err
	}

	err = conn.Connect()
	if err != nil {
		return nil, err
	}

	return conn, nil
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
