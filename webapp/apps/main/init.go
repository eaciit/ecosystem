package app_main

import (
	"eaciit/scb-eco/consoleapp"
	"eaciit/scb-eco/webapp/apps/main/controllers"
	"eaciit/scb-eco/webapp/helper"
	"os"
	"path/filepath"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
)

func init() {
	type ForgetMe struct{}

	appFolderPath := helper.GetCurrentFolderPath(ForgetMe{})
	appName := helper.GetCurrentFolderName(ForgetMe{})

	// ==== start
	helper.Println("Registering", appName, "@", appFolderPath)

	// ==== prepare database connection
	db, err := helper.PrepareConnection(ForgetMe{})
	if err != nil {
		helper.Println(err.Error())
		os.Exit(0)
	}

	// Generate Default user
	helper.PrepareDefaultUser(db)

	baseCtrl := new(controllers.BaseController)
	// baseCtrl.NoLogin = true
	baseCtrl.Db = db
	baseCtrl.AppName = appName

	// create the application
	app := knot.NewApp(appName)
	app.LayoutTemplate = "_layout.html"
	app.ViewsPath = filepath.Join(appFolderPath, "views") + toolkit.PathSeparator
	helper.Println("Configure view location", app.ViewsPath)

	// register routes
	app.Register(&(controllers.AuthController{BaseController: baseCtrl}))
	app.Register(&(controllers.MasterController{BaseController: baseCtrl}))
	app.Register(&(controllers.DashboardController{BaseController: baseCtrl}))
	app.Register(&(controllers.CounterPartyController{BaseController: baseCtrl}))
	app.Register(&(controllers.MissedFlowController{BaseController: baseCtrl}))
	app.Register(&(controllers.FilterEngineController{BaseController: baseCtrl}))
	app.Register(&(controllers.RecommendEngineController{BaseController: baseCtrl}))
	app.Static("static", filepath.Join(appFolderPath, "assets"))

	// Scheduler for Recomended Engine
	sc := consoleapp.ScheduleRun(appFolderPath+"/files/filterEngine.sql", db)
	baseCtrl.Scheduler = sc

	knot.RegisterApp(app)
}
