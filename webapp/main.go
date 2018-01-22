package main

import (
	_ "eaciit/scb-eco/webapp/apps/main"
	"eaciit/scb-eco/webapp/apps/main/controllers"
	"net/http"

	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
)

func main() {
	tk.Println("===========> Starting application")

	config := controllers.GetConfig()

	otherRoutes := make(map[string]knot.FnContent)
	otherRoutes["/"] = func(k *knot.WebContext) interface{} {
		urlLoginPage := "/main/auth/login"
		urlLandingPage := config.GetString("landingpage")

		if k.Session(controllers.SESSION_KEY, "") == "" {
			if k.Request.URL.String() != `/` {
				unauthorizedErrorMessage := controllers.GetUnauthorizedMessageAsQueryString(k)
				urlLoginPage = urlLoginPage + unauthorizedErrorMessage
			}

			http.Redirect(k.Writer, k.Request, urlLoginPage, http.StatusTemporaryRedirect)
		} else {
			if k.Request.URL.String() == `/` {
				http.Redirect(k.Writer, k.Request, urlLandingPage, http.StatusTemporaryRedirect)
			}
		}

		return true
	}

	container := new(knot.AppContainerConfig)
	container.Address = tk.Sprintf(":%d", config.GetInt("port"))

	knot.DefaultOutputType = knot.OutputTemplate
	knot.StartContainerWithFn(container, otherRoutes)
}
