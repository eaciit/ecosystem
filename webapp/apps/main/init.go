package app_main

import (
	"eaciit/scb-eco/webapp/apps/main/controllers"
	"eaciit/scb-eco/webapp/helper"
	"os"
	"path/filepath"
	"time"

	"github.com/eaciit/acl/v2.0"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/orm"
	tk "github.com/eaciit/toolkit"
)

func init() {
	type ForgetMe struct{}

	appFolderPath := helper.GetCurrentFolderPath(ForgetMe{})
	appName := helper.GetCurrentFolderName(ForgetMe{})

	// ==== start
	helper.Println("Registering", appName, "@", appFolderPath)

	// ==== get config
	config := helper.ReadConfig(ForgetMe{})

	// ==== prepare database connection
	conn, err := helper.PrepareConnection(ForgetMe{})
	if err != nil {
		helper.Println(err.Error())
		os.Exit(0)
	}

	// ==== configure acl
	acli := acl.New()
	acli.SetExpiredDuration(time.Second * time.Duration(config.GetFloat64("loginexpired")))
	err = acli.SetDb(conn)
	if err != nil {
		helper.Println(err.Error())
		os.Exit(0)
	}

	// ==== save connection to controller context
	ctx := orm.New(conn)
	baseCtrl := new(controllers.BaseController)
	// baseCtrl.NoLogin = true
	baseCtrl.Conn = conn
	baseCtrl.AppName = appName
	baseCtrl.Ctx = ctx
	baseCtrl.Acli = acli

	// create default access data for the first time
	err = helper.PrepareDefaultData(acli)
	if err != nil {
		helper.Println(err.Error())
	}

	// create the application
	app := knot.NewApp(appName)
	app.LayoutTemplate = "_layout.html"
	app.ViewsPath = filepath.Join(appFolderPath, "views") + tk.PathSeparator
	helper.Println("Configure view location", app.ViewsPath)

	// register routes
	app.Register(&(controllers.AuthController{BaseController: baseCtrl}))
	app.Register(&(controllers.AccessController{BaseController: baseCtrl}))
	app.Register(&(controllers.DashboardController{BaseController: baseCtrl}))
	app.Register(&(controllers.CounterPartyController{BaseController: baseCtrl}))
	app.Register(&(controllers.CounterPartyMainController{BaseController: baseCtrl}))
	app.Static("static", filepath.Join(appFolderPath, "assets"))

	knot.RegisterApp(app)
}
