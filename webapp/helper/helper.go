package helper

import (
	"bufio"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"time"

	"github.com/eaciit/acl/v2.0"
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

func PrepareDefaultData(acli *acl.ACLInstance) error {
	username := "eaciit"

	user := new(acl.User)
	err := acli.FindUserByLoginID(user, username)
	if err == nil || user.LoginID == username {
		return err
	}

	// ========= access menu

	access1 := new(acl.Access)
	access1.ID = "dashboard"
	access1.Title = "Dashboard"
	access1.Category = 1
	access1.Icon = "bar-chart"
	access1.Url = "/main/dashboard/index"
	access1.Index = 1
	access1.Enable = true
	err = acli.Save(access1)
	if err != nil {
		return err
	}

	access2 := new(acl.Access)
	access2.ID = "master_data"
	access2.Title = "Master Data"
	access2.Category = 1
	access2.Icon = "database"
	access2.Url = "/main/access/master"
	access2.Index = 2
	access2.Enable = true
	err = acli.Save(access2)
	if err != nil {
		return err
	}

	access3 := new(acl.Access)
	access3.ID = "logout"
	access3.Title = "Logout"
	access3.Category = 1
	access3.Icon = "sign-out"
	access3.Url = "/main/auth/dologout"
	access3.Index = 3
	access3.Enable = true
	err = acli.Save(access3)
	if err != nil {
		return err
	}

	// ======= groups

	group1 := new(acl.Group)
	group1.ID = "admin"
	group1.Title = "admin"
	group1.Enable = true
	group1.Grants = []acl.AccessGrant{
		{AccessID: access1.ID, AccessValue: 1}, // dashboard
		{AccessID: access2.ID, AccessValue: 1}, // master
		{AccessID: access3.ID, AccessValue: 1}, // logout
	}
	group1.GroupConf = tk.M{}
	group1.MemberConf = tk.M{}
	err = acli.Save(group1)
	if err != nil {
		return err
	}

	group2 := new(acl.Group)
	group2.ID = "user"
	group2.Title = "user"
	group2.Enable = true
	group2.Grants = []acl.AccessGrant{
		{AccessID: access1.ID, AccessValue: 1}, // dashboard
		{AccessID: access3.ID, AccessValue: 1}, // logout
	}
	group2.GroupConf = tk.M{}
	group2.MemberConf = tk.M{}
	err = acli.Save(group2)
	if err != nil {
		return err
	}

	// ====== user

	password := "Password.1"

	user1 := new(acl.User)
	user1.ID = tk.RandomString(32)
	user1.LoginID = "eaciit"
	user1.FullName = "EACIIT"
	user1.Email = "admin@eaciit.com"
	user1.Enable = true
	user1.Groups = []string{group1.ID} // [admin]
	err = acli.Save(user1)
	if err != nil {
		return err
	}
	err = acli.ChangePassword(user1.ID, password)
	if err != nil {
		return err
	}

	user2 := new(acl.User)
	user2.ID = tk.RandomString(32)
	user2.LoginID = "user"
	user2.FullName = "Standard User"
	user2.Email = "user@eaciit.com"
	user2.Enable = true
	user2.Groups = []string{group2.ID} // [user]
	err = acli.Save(user2)
	if err != nil {
		return err
	}
	err = acli.ChangePassword(user2.ID, password)
	if err != nil {
		return err
	}

	return nil
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
