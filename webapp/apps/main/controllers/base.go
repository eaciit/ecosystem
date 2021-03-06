package controllers

import (
	"database/sql"
	"eaciit/scb-eco/consoleapp"
	"eaciit/scb-eco/webapp/helper"
	"errors"
	"net/http"

	"strings"

	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
)

type IBaseController interface{}

type BaseController struct {
	base      IBaseController
	Db        *sql.DB
	AppName   string
	NoLogin   bool
	Scheduler *consoleapp.Scheduler
}

const (
	SESSION_KEY      string = "sessionId"
	SESSION_USERNAME string = "username"
)

func (c *BaseController) tableName() string {
	type ForgetMe struct{}
	config := helper.ReadConfigFromCache(ForgetMe{}, false)
	return config.GetString("tablename")
}

func (c *BaseController) commonWhereClause() string {
	return `NOT ISNULL(product_category)
	AND cpty_long_name <> "SCB NON SCI COUNTERPARTY"
	AND ` + c.eitherBuyerSupplierClause()
}

func (c *BaseController) isOpportunityClause() string {
	return `(CASE WHEN LEFT(counterparty_bank, 4) = "SCBL" THEN "N" 
	WHEN source_system = "DTP" && ISNULL(counterparty_bank) THEN "N" 
	WHEN source_system = "DTP" THEN "Y"
	WHEN source_system = "OTP" && LENGTH(counterparty_bank) > 0 THEN "Y"
	WHEN source_system = "OTP" THEN "NA"
	ELSE "Y" END)`
}

func (c *BaseController) isNTBClause() string {
	return `(CASE WHEN ` + c.isOpportunityClause() + ` = "N" THEN "N"
	WHEN ISNULL(cpty_sci_leid) || cpty_sci_leid = "null" || cpty_sci_leid = "Null" || cpty_sci_leid = "" THEN "Y"
	ELSE "N" END)`
}

func (c *BaseController) customerRoleClause() string {
	return `(CASE customer_role WHEN "DRAWEE" THEN "BUYER" 
	WHEN "SUPPLIER" THEN "PAYEE" 
	ELSE customer_role END)`
}

func (c *BaseController) eitherBuyerSupplierClause() string {
	return c.customerRoleClause() + ` IN ("BUYER","PAYEE")`
}

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
	if k.Session(SESSION_KEY, "") == "" {
		unauthorizedErrorMessage := GetUnauthorizedMessageAsQueryString(k)
		b.Redirect(k, "auth", "login"+unauthorizedErrorMessage)

		return false
	} else {
		return true
	}

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
