package controllers

import (
	"eaciit/scb-eco/webapp/helper"
	"errors"
	"net/http"

	"strings"

	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/orm"
	tk "github.com/eaciit/toolkit"
)

type IBaseController interface{}

type BaseController struct {
	base    IBaseController
	Ctx     *orm.DataContext
	Conn    dbox.IConnection
	AppName string
	NoLogin bool
}

const (
	SESSION_KEY      string = "sessionId"
	SESSION_USERNAME string = "username"
)

func (b *BaseController) IsLoggedIn(k *knot.WebContext) bool {
	return k.Session(SESSION_KEY, "") != ""
}

func (b *BaseController) GetCurrentUsername(k *knot.WebContext) string {
	if !b.IsLoggedIn(k) {
		return ""
	}

	return k.Session(SESSION_USERNAME).(string)
}

func (b *BaseController) SetResponseTypeHTML(k *knot.WebContext) {
	k.Config.NoLog = true
	k.Config.OutputType = knot.OutputTemplate
}

func (b *BaseController) SetResponseTypeAJAX(k *knot.WebContext) {
	k.Config.NoLog = true
	k.Config.OutputType = knot.OutputJson
}

func (b *BaseController) ValidateAccessOfRequestedURL(k *knot.WebContext) bool {
	return true
}

func (b *BaseController) Redirect(k *knot.WebContext, controller string, action string) {
	urlString := "/" + b.AppName + "/" + controller + "/" + action
	http.Redirect(k.Writer, k.Request, urlString, http.StatusTemporaryRedirect)
}

func (b *BaseController) SetResultOK(data interface{}) *tk.Result {
	r := tk.NewResult()
	r.Data = data

	return r
}

func (b *BaseController) SetResultError(msg string, data interface{}) *tk.Result {
	tk.Println(msg)

	r := tk.NewResult()
	r.SetError(errors.New(msg))
	r.Data = data

	return r
}

func (b *BaseController) SetViewData(viewData tk.M) tk.M {
	if viewData == nil {
		viewData = tk.M{}
	}

	viewData.Set("AppName", b.AppName)
	return viewData
}

func GetConfig() tk.M {
	type ForgetMe struct{}
	config := helper.ReadConfig(ForgetMe{})
	return config
}

func GetUnauthorizedMessageAsQueryString(k *knot.WebContext) string {
	return "?NotAllowed=You don't have permission to access requested page " + strings.Split(k.Request.URL.String(), "?")[0]
}
