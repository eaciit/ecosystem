package controllers

import (
	"github.com/eaciit/acl/v2.0"
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

	sessionId, err := c.Acli.Login(payload.Username, payload.Password)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	activeUser := new(acl.User)
	err = c.Acli.FindUserByLoginID(activeUser, payload.Username)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	k.SetSession(SESSION_KEY, sessionId)
	k.SetSession(SESSION_USERNAME, payload.Username)

	c.PrepareCurrentUserData(k)

	return c.SetResultOK(tk.M{}.
		Set(SESSION_KEY, sessionId).
		Set(SESSION_USERNAME, payload.Username).
		Set("redirect", GetConfig().GetString("landingpage")))
}

func (c *AuthController) DoLogout(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)

	sessionId := tk.ToString(k.Session(SESSION_KEY, ""))
	c.Acli.Logout(sessionId)

	k.SetSession(SESSION_KEY, "")
	k.SetSession(SESSION_USERNAME, "")
	c.Redirect(k, "auth", "login")

	return nil
}
