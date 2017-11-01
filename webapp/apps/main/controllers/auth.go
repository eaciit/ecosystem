package controllers

import (
	"eaciit/scb-eco/webapp/helper"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
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

	sql := "SELECT * FROM eaciit_user WHERE username = '" + payload.Username + "'"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	if len(results) != 1 {
		return c.SetResultError("Username and password combination not found!", nil)
	}

	hashedPassword := results[0].GetString("password")
	decryptedPassword, err := helper.Decrypt(hashedPassword)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	if decryptedPassword != payload.Password {
		return c.SetResultError("Username and password combination not found!", nil)
	}

	k.SetSession(SESSION_KEY, helper.GenerateSessionId())
	k.SetSession(SESSION_USERNAME, payload.Username)

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
