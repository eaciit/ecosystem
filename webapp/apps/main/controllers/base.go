package controllers

import (
	"eaciit/scb-eco/webapp/helper"
	"errors"
	"net/http"

	"strings"

	"github.com/eaciit/acl/v2.0"
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
	Acli    *acl.ACLInstance
	AppName string
	NoLogin bool
}

const (
	SESSION_KEY      string = "sessionId"
	SESSION_USERNAME string = "username"
)

var (
	LoginDataUser       acl.User
	LoginDataGroups     []acl.Group
	LoginDataAccessMenu []acl.Access
)

func (b *BaseController) Authenticate(k *knot.WebContext, callback, failback func()) {
	sessionid := tk.ToString(k.Session(SESSION_KEY, ""))
	if b.Acli.IsSessionIDActive(sessionid) {
		if callback != nil {
			callback()
		}
	} else {
		k.SetSession(SESSION_KEY, "")
		if failback != nil {
			failback()
		}
	}
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

func (b *BaseController) PrepareCurrentUserData(k *knot.WebContext) {

	// ==== user

	username := b.GetCurrentUsername(k)
	user := new(acl.User)
	err := b.Acli.FindUserByLoginID(user, username)
	if err != nil {
		return
	}

	// ==== groups

	groups := make([]acl.Group, 0)
	groupAccessMenu := tk.M{}

	for _, each := range user.Groups {
		group := new(acl.Group)
		err = b.Acli.FindByID(group, each)
		if err != nil {
			return
		}
		groups = append(groups, *group)

		for _, each := range group.Grants {
			if !groupAccessMenu.Has(each.AccessID) {
				groupAccessMenu.Set(each.AccessID, 0)
			}
		}
	}

	// ==== access menu

	csr, err := b.Acli.Find(new(acl.Access), nil, tk.M{"order": []string{"index"}})
	defer csr.Close()
	if err != nil {
		return
	}

	accessMenuAll := make([]acl.Access, 0)
	err = csr.Fetch(&accessMenuAll, 0, false)
	if err != nil {
		return
	}

	// ==== get access for current user

	allowed := make([]acl.Access, 0)
	for _, each := range accessMenuAll {
		if groupAccessMenu.Has(each.ID) {
			allowed = append(allowed, each)
		}
	}

	// ==== save it to memory

	LoginDataUser = *user
	LoginDataGroups = groups
	LoginDataAccessMenu = allowed
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
	unauthorizedErrorMessage := GetUnauthorizedMessageAsQueryString(k)
	b.Authenticate(k, nil, func() {
		b.Redirect(k, "auth", "login"+unauthorizedErrorMessage)
	})

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

func (b *BaseController) GetViewBaseData(k *knot.WebContext) tk.M {
	data := tk.M{}

	if b.IsLoggedIn(k) {
		data.Set("UserData", LoginDataUser)
	}

	return data
}

func GetConfig() tk.M {
	type ForgetMe struct{}
	config := helper.ReadConfig(ForgetMe{})
	return config
}

func GetUnauthorizedMessageAsQueryString(k *knot.WebContext) string {
	return "?NotAllowed=You don't have permission to access requested page " + strings.Split(k.Request.URL.String(), "?")[0]
}
