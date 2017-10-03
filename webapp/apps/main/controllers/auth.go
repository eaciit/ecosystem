package controllers

import (
	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
)

type AuthController struct {
	*BaseController
}

func (c *AuthController) Login(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	k.Config.LayoutTemplate = ""

	return c.SetViewData(nil)
}

func (c *AuthController) Logout(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)

	return c.SetViewData(nil)
}

func (c *AuthController) DoLogin(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)

	payload := struct {
		Username string
		Password string
	}{}

	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(tk.M{}.
		Set("redirect", GetConfig().GetString("landingpage")))
}

func (c *AuthController) DoLogout(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)

	k.SetSession(SESSION_KEY, "")
	k.SetSession(SESSION_USERNAME, "")
	c.Redirect(k, "auth", "login")

	return nil
}
