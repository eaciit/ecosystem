package acl

import (
	"crypto/md5"
	"errors"
	"fmt"

	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/mongo"
	// "github.com/eaciit/ldap"
	"io"
	"strings"
	"time"

	"github.com/eaciit/orm/v1"
	"github.com/eaciit/toolkit"
)

type IDTypeEnum int

const (
	IDTypeUser IDTypeEnum = iota
	IDTypeGroup
	IDTypeSession
)

// ===== everything started here

type ACLInstance struct {
	_aclconn         dbox.IConnection
	_aclctx          *orm.DataContext
	_aclctxErr       error
	_expiredduration time.Duration
}

func New() *ACLInstance {
	acli := new(ACLInstance)
	acli._expiredduration = time.Minute * 30
	return acli
}

func (acli *ACLInstance) ctx() *orm.DataContext {
	if acli._aclctx == nil {
		if acli._aclconn == nil {
			e := acli._aclconn.Connect()
			if e != nil {
				acli._aclctxErr = errors.New("Acl.SetCtx: Test Connect: " + e.Error())
				return nil
			}
		}
		acli._aclctx = orm.New(acli._aclconn)
	}

	return acli._aclctx
}

func (acli *ACLInstance) SetDb(conn dbox.IConnection) error {
	acli._aclctxErr = nil

	e := conn.Connect()
	if e != nil {
		acli._aclctxErr = errors.New("Acl.SetDB: Test Connect: " + e.Error())
		return acli._aclctxErr
	}

	acli._aclconn = conn
	return acli._aclctxErr
}

func (acli *ACLInstance) SetExpiredDuration(td time.Duration) {
	acli._expiredduration = td
}

func (acli *ACLInstance) Save(o orm.IModel) error {

	if toolkit.TypeName(o) == "*acl.User" && o.(*User).Password == "" {
		o.(*User).Password = acli.getlastpassword(o.(*User).ID)
	}

	e := acli.ctx().Save(o)
	if e != nil {
		return errors.New("Acl.Save: " + e.Error())
	}
	return e
}

func (acli *ACLInstance) Find(o orm.IModel, filter *dbox.Filter, config toolkit.M) (dbox.ICursor, error) {
	var filters []*dbox.Filter
	if filter != nil {
		filters = append(filters, filter)
	}

	dconf := toolkit.M{}.Set("where", filters)
	if config != nil {
		if config.Has("take") {
			dconf.Set("limit", config["take"])
		}
		if config.Has("skip") {
			dconf.Set("skip", config["skip"])
		}
		if config.Has("order") {
			dconf.Set("order", config["order"])
		}
	}

	c, e := acli.ctx().Find(o, dconf)
	if e != nil {
		return nil, errors.New("Acl.Find: " + e.Error())
	}
	return c, nil
}

func (acli *ACLInstance) FindByID(o orm.IModel, id interface{}) error {
	e := acli.ctx().GetById(o, id)
	if e != nil {
		return errors.New("Acl.Get: " + e.Error())
	}
	return nil
}

// func FindByID(o orm.IModel, id interface{}) error {
// 	filter := dbox.Eq("_id", id)
// 	e := ctx().Get(o, toolkit.M{}.Set(orm.ConfigWhere, filter))
// 	if e != nil {
// 		return errors.New("Acl.GetById : " + e.Error())
// 	}
// 	return nil
// }

func (acli *ACLInstance) Delete(o orm.IModel) error {
	e := acli.ctx().Delete(o)
	if e != nil {
		return errors.New("Acl.Delete : " + e.Error())
	}
	return e
}

// ID for IDTypeUser
func (acli *ACLInstance) HasAccess(ID interface{}, IDType IDTypeEnum, AccessID string, AccessFind AccessTypeEnum) (found bool) {
	found = false

	tGrants := make([]AccessGrant, 0, 0)
	switch IDType {
	case IDTypeUser:
		tUser := new(User)
		err := acli.FindUserByLoginID(tUser, ID)
		if err != nil {
			return
		}

		for _, val := range tUser.Groups {
			tGroup := new(Group)
			err = acli.FindByID(tGroup, val)
			if err != nil {
				err = errors.New(fmt.Sprintf("Has Access found error : %v", err.Error()))
				return
			}

			for _, dval := range tGroup.Grants {
				inenum := Splitinttogrant(dval.AccessValue)
				tUser.Grant(dval.AccessID, inenum...)
			}

		}
		tGrants = tUser.Grants
	case IDTypeGroup:
		tGroup := new(Group)
		err := acli.FindByID(tGroup, ID)
		if err != nil {
			return
		}
		tGrants = tGroup.Grants
	case IDTypeSession:
		tSession := new(Session)
		err := acli.FindByID(tSession, ID)
		if tSession.Expired.Before(time.Now().UTC()) {
			return
		}

		tSession.Expired = time.Now().UTC().Add(acli._expiredduration)
		err = acli.Save(tSession)
		if err != nil {
			err = errors.New(fmt.Sprintf("Update session error found : %v", err.Error()))
		}

		tUser := new(User)
		err = acli.FindByID(tUser, tSession.UserID)
		if err != nil {
			return
		}

		for _, val := range tUser.Groups {
			tGroup := new(Group)
			_ = acli.FindByID(tGroup, val)

			for _, dval := range tGroup.Grants {
				inenum := Splitinttogrant(dval.AccessValue)
				tUser.Grant(dval.AccessID, inenum...)
			}

		}

		tGrants = tUser.Grants
	}

	if len(tGrants) == 0 {
		return
	}

	fn, in := getgrantindex(tGrants, AccessID)
	if fn {
		found = Matchaccess(int(AccessFind), tGrants[in].AccessValue)
	}

	return
}

// List Access By Field
// func ListAccessByField(ID interface{}, IDType IDTypeEnum, accfield, accvalue string) (listaccess []toolkit.M) {
// 	// found = false
// 	listaccess = make([]toolkit.M, 0, 0)

// 	tGrants := make([]AccessGrant, 0, 0)
// 	switch IDType {
// 	case IDTypeUser:
// 		tUser := new(User)
// 		err := FindUserByLoginID(tUser, ID)
// 		if err != nil {
// 			return
// 		}
// 		tGrants = tUser.Grants
// 	case IDTypeGroup:
// 		tGroup := new(Group)
// 		err := FindByID(tGroup, ID)
// 		if err != nil {
// 			return
// 		}
// 		tGrants = tGroup.Grants
// 	case IDTypeSession:
// 		tSession := new(Session)
// 		err := FindByID(tSession, ID)
// 		if tSession.Expired.Before(time.Now().UTC()) {
// 			return
// 		}

// 		tUser := new(User)
// 		err = FindByID(tUser, tSession.UserID)
// 		if err != nil {
// 			return
// 		}

// 		tGrants = tUser.Grants
// 	}

// 	if len(tGrants) == 0 {
// 		return
// 	}

// 	for _, v := range tGrants {
// 		tkm := toolkit.M{}

// 		tAccess := new(Access)
// 		err := FindByID(tAccess, v.AccessID)
// 		if err != nil {
// 			return
// 		}

// 		err = toolkit.Serde(tAccess, tkm, "json")
// 		if err != nil {
// 			return
// 		}

// 		if tkm.Has(accfield) && toolkit.ToString(tkm[accfield]) == accvalue {
// 			tkm.Set("AccessValue", v.AccessValue)
// 			listaccess = append(listaccess, tkm)
// 		}
// 	}

// 	return
// }

func (acli *ACLInstance) ChangePasswordFromOld(userId string, passwd string, old string) (err error) {

	tUser := new(User)
	err = acli.FindByID(tUser, userId)
	if err != nil {
		err = errors.New(fmt.Sprintf("Found Error : ", err.Error()))
		return
	}

	if tUser.ID == "" {
		err = errors.New("User not found")
		return
	}

	checkpasswd := acli.checkloginbasic(old, tUser.Password)
	if !checkpasswd {
		err = errors.New("Acl.ChangePassword: Password not matched")
		return
	}

	tPass := md5.New()
	io.WriteString(tPass, passwd)

	tUser.Password = fmt.Sprintf("%x", tPass.Sum(nil))

	err = acli.ctx().Save(tUser)
	if err != nil {
		err = errors.New("Acl.ChangePassword: " + err.Error())
	}

	return
}

func (acli *ACLInstance) ChangePassword(userId string, passwd string) (err error) {

	tUser := new(User)
	err = acli.FindByID(tUser, userId)
	if err != nil {
		err = errors.New(fmt.Sprintf("Found Error : ", err.Error()))
		return
	}

	if tUser.ID == "" {
		err = errors.New("User not found")
		return
	}

	tPass := md5.New()
	io.WriteString(tPass, passwd)

	tUser.Password = fmt.Sprintf("%x", tPass.Sum(nil))

	err = acli.ctx().Save(tUser)
	if err != nil {
		err = errors.New("Acl.ChangePassword: " + err.Error())
	}

	return
}

func (acli *ACLInstance) ChangePasswordToken(userId, passwd, tokenid string) (err error) {

	gToken, err := acli.GetToken(userId, "ChangePassword")
	if err != nil {
		err = errors.New(fmt.Sprintf("Get token found : %v", err.Error()))
		return
	}

	if gToken.ID != tokenid {
		err = errors.New("Token is not match")
		return
	}

	err = acli.ChangePassword(userId, passwd)
	if err == nil {
		gToken.Claim()
	}

	return
}

func (acli *ACLInstance) ResetPassword(email string) (userid, tokenid string, err error) {
	userid, tokenid, err = acli.ResetPasswordByParam(email, "email")
	return
}

func (acli *ACLInstance) ResetPasswordByLoginID(loginid string) (userid, tokenid string, err error) {
	userid, tokenid, err = acli.ResetPasswordByParam(loginid, "loginid")
	return
}

func (acli *ACLInstance) ResetPasswordByParam(param, itype string) (userid, tokenid string, err error) {
	tUser := new(User)
	if itype == "loginid" {
		err = acli.FindUserByLoginID(tUser, param)
	} else {
		err = acli.FindUserByEmail(tUser, param)
	}

	if err != nil {
		if strings.Contains(err.Error(), "Not found") {
			err = errors.New("Username not found")
			return
		}
		err = errors.New(fmt.Sprintf("Found error : %v", err.Error()))
		return
	}

	if tUser.ID == "" {
		err = errors.New("Username not found")
		return
	}

	userid = tUser.ID
	// fmt.Printf("DEBUG 228 : %#v \n\n", tUser)
	if tUser.LoginType != LogTypeBasic && tUser.LoginType != 0 {
		err = errors.New("Only login type basic permited to change")
		return
	}

	tToken, err := acli.GetToken(tUser.ID, "ChangePassword")
	tokenid = tToken.ID
	if tokenid != "" && err == nil {
		return
	}
	//token expired
	err = acli.CreateToken(tUser.ID, "ChangePassword", acli._expiredduration)
	if err != nil {
		err = errors.New("Reset password failed to create token")
	}

	tToken, err = acli.GetToken(tUser.ID, "ChangePassword")
	tokenid = tToken.ID
	if err != nil {
		err = errors.New("Reset password failed to get token")
	}

	return
}

func (acli *ACLInstance) FindUserByLoginID(o orm.IModel, id interface{}) error {
	filter := dbox.Eq("loginid", id)

	c, e := acli.Find(o, filter, nil)
	if e != nil {
		return errors.New("Acl.FindUserByLoginId: " + e.Error())
	}

	defer c.Close()
	e = c.Fetch(o, 1, false)

	return e
}

func (acli *ACLInstance) IsUserExist(id interface{}) bool {
	filter := dbox.Eq("loginid", id)

	o := new(User)
	c, e := acli.Find(o, filter, nil)
	if e != nil {
		return true
	}

	defer c.Close()
	_ = c.Fetch(o, 1, false)

	if o.ID != "" {
		return true
	}

	return false
}

func (acli *ACLInstance) FindUserByEmail(o orm.IModel, email string) error {
	filter := dbox.Eq("email", email)
	c, e := acli.Find(o, filter, nil)

	if e != nil {
		return errors.New("Acl.FindUserByEmail: " + e.Error())
	}

	defer c.Close()
	e = c.Fetch(o, 1, false)

	return e
}

//username using user loginid
func (acli *ACLInstance) Login(username, password string) (sessionid string, err error) {

	tUser := new(User)
	err = acli.FindUserByLoginID(tUser, username)
	if err != nil {
		if strings.Contains(err.Error(), "Not found") {
			err = errors.New("Username not found")
			return
		}
		err = errors.New(fmt.Sprintf("Found error : %v", err.Error()))
		return
	}

	if tUser.ID == "" {
		err = errors.New("Username not found")
		return
	}

	LoginSuccess := false

	switch tUser.LoginType {
	case LogTypeLdap:
		LoginSuccess = checkloginldap(username, password, tUser.LoginConf)
	default:
		LoginSuccess = acli.checkloginbasic(password, tUser.Password)
	}

	if !LoginSuccess {
		err = errors.New("Username and password is incorrect")
		return
	}

	if !tUser.Enable {
		err = errors.New("Username is not active")
		return
	}

	tSession := new(Session)
	// err = FindActiveSessionByUser(tSession, tUser.ID)
	// if err != nil {
	// 	err = errors.New(fmt.Sprintf("Get previous session, found : %v", err.Error()))
	// 	return
	// }

	// if tSession.ID == "" {
	tSession.ID = toolkit.RandomString(32)
	tSession.UserID = tUser.ID
	tSession.LoginID = tUser.LoginID
	tSession.Created = time.Now().UTC()
	// }

	tSession.Expired = time.Now().UTC().Add(acli._expiredduration)

	err = acli.Save(tSession)
	if err == nil {
		sessionid = tSession.ID
	}
	return
}

//Using sessionid
func (acli *ACLInstance) Logout(sessionid string) (err error) {
	tSession := new(Session)
	err = acli.FindByID(tSession, sessionid)
	if err != nil {
		err = errors.New(fmt.Sprintf("Get session, Found error : %s", err.Error()))
		return
	}

	if tSession.ID == "" {
		err = errors.New("Session id not found")
		return
	}

	if time.Now().UTC().After(tSession.Expired) {
		err = errors.New("Session id is expired")
		return
	}

	tSession.Expired = time.Now().UTC()
	err = acli.Save(tSession)
	if err != nil {
		err = errors.New(fmt.Sprintf("Save session, Found error : %s", err.Error()))
	}

	return
}

func (acli *ACLInstance) CreateToken(UserID, TokenPupose string, Validity time.Duration) (err error) {
	tToken := new(Token)
	tToken.ID = toolkit.RandomString(32)
	tToken.UserID = UserID
	tToken.Created = time.Now().UTC()
	tToken.Expired = time.Now().UTC().Add(Validity)
	tToken.Purpose = TokenPupose

	err = acli.Save(tToken)

	return
}

func (acli *ACLInstance) GetToken(UserID, TokenPurpose string) (tToken *Token, err error) {
	tToken = new(Token)

	var filters []*dbox.Filter
	filter := dbox.And(dbox.Eq("userid", UserID), dbox.Eq("purpose", TokenPurpose))
	if filter != nil {
		filters = append(filters, filter)
	}

	c, err := acli.ctx().Find(tToken, toolkit.M{}.Set("where", filters).Set("order", []string{"-expired"}))
	if err != nil {
		err = errors.New("Acl.GetToken: " + err.Error())
		return
	}

	defer c.Close()

	for {
		errx := c.Fetch(tToken, 1, false)
		if errx == nil {
			if time.Now().UTC().After(tToken.Expired) {
				err = errors.New("Token has been expired")
				tToken = new(Token)
			} else if !tToken.Claimed.IsZero() {
				err = errors.New("Token has been claimed")
				tToken = new(Token)
			} else {
				break
			}
		} else if tToken.ID != "" {
			err = nil
			break
		} else {
			break
		}
	}

	return
}

func (acli *ACLInstance) FindUserBySessionID(sessionid string) (userid string, err error) {
	tSession := new(Session)
	err = acli.FindByID(tSession, sessionid)
	if err != nil {
		return
	}

	if tSession.Expired.Before(time.Now().UTC()) {
		err = errors.New(fmt.Sprintf("Session has been expired"))
		return
	}

	tSession.Expired = time.Now().UTC().Add(acli._expiredduration)
	err = acli.Save(tSession)
	if err != nil {
		err = errors.New(fmt.Sprintf("Update session error found : %v", err.Error()))
	}

	tUser := new(User)
	err = acli.FindByID(tUser, tSession.UserID)
	if err != nil {
		err = errors.New(fmt.Sprintf("Find user by id found : %v", err.Error()))
	}
	userid = tUser.ID

	return
}

func (acli *ACLInstance) FindActiveSessionByUser(o orm.IModel, userid string) (err error) {
	filter := dbox.And(dbox.Eq("userid", userid), dbox.Gte("expired", time.Now().UTC()))

	c, err := acli.Find(o, filter, nil)
	if err != nil {
		return errors.New("Acl.FindActiveSessionByUser: " + err.Error())
	}
	defer c.Close()

	err = c.Fetch(o, 1, false)
	if err != nil && strings.Contains(err.Error(), "Not found") {
		err = nil
		return
	}

	o.(*Session).Expired = time.Now().UTC().Add(acli._expiredduration)
	err = acli.Save(o)
	if err != nil {
		err = errors.New(fmt.Sprintf("Update session error found : %v", err.Error()))
	}

	return
}

func (acli *ACLInstance) IsSessionIDActive(sessionid string) (stat bool) {
	stat = false

	tSession := new(Session)
	err := acli.FindByID(tSession, sessionid)
	if err != nil {
		return
	}

	if tSession.Expired.Before(time.Now().UTC()) {
		return
	}

	stat = true

	tSession.Expired = time.Now().UTC().Add(acli._expiredduration)
	err = acli.Save(tSession)
	if err != nil {
		err = errors.New(fmt.Sprintf("Update session error found : %v", err.Error()))
	}

	return
}

func (acli *ACLInstance) checkloginbasic(spassword, upassword string) (cond bool) {
	cond = false

	tPass := md5.New()
	io.WriteString(tPass, spassword)

	ePassword := fmt.Sprintf("%x", tPass.Sum(nil))

	if ePassword == upassword {
		cond = true
	}

	return
}

func (acli *ACLInstance) GetListMenuBySessionId(sessionId interface{}) (artkm []toolkit.M, err error) {
	artkm = make([]toolkit.M, 0)

	isession := new(Session)
	err = acli.FindByID(isession, sessionId)
	if err != nil {
		err = errors.New(toolkit.Sprintf("Get list menu found : %s", err.Error()))
		return
	}

	artkm, err = acli.GetListAccessByLoginId(isession.LoginID, AccessMenu, nil)
	return
}

func (acli *ACLInstance) GetListMenuByLoginId(loginId interface{}) (artkm []toolkit.M, err error) {
	artkm, err = acli.GetListAccessByLoginId(loginId, AccessMenu, nil)
	return
}

func (acli *ACLInstance) GetListTabBySessionId(sessionId interface{}, igroup string) (artkm []toolkit.M, err error) {
	artkm = make([]toolkit.M, 0)

	isession := new(Session)
	err = acli.FindByID(isession, sessionId)
	if err != nil {
		err = errors.New(toolkit.Sprintf("Get list tab found : %s", err.Error()))
		return
	}

	artkm, err = acli.GetListAccessByLoginId(isession.LoginID, AccessTab, toolkit.M{}.Set("group1", igroup))
	return
}

func (acli *ACLInstance) GetListAccessBySessionId(sessionId interface{}, cat AccessCategoryEnum, config toolkit.M) (artkm []toolkit.M, err error) {
	artkm = make([]toolkit.M, 0)

	isession := new(Session)
	err = acli.FindByID(isession, sessionId)
	if err != nil {
		err = errors.New(toolkit.Sprintf("Get list access found : %s", err.Error()))
		return
	}

	artkm, err = acli.GetListAccessByLoginId(isession.LoginID, cat, config)
	return
}

func (acli *ACLInstance) GetListAccessByLoginId(loginId interface{}, cat AccessCategoryEnum, config toolkit.M) (artkm []toolkit.M, err error) {
	if config == nil {
		config = toolkit.M{}
	}

	level := int(5)
	if config.Has("level") {
		level = config.GetInt("level")
	}

	artkm = make([]toolkit.M, 0)

	iuser := new(User)
	err = acli.FindUserByLoginID(iuser, loginId)
	if err != nil {
		err = errors.New(toolkit.Sprintf("Get list found : %s", err.Error()))
		return
	}

	arraccid := toolkit.M{}
	for _, val := range iuser.GetAccessList() {
		arraccid.Set(val.AccessID, 1)
	}

	for _, val := range iuser.Groups {
		to := new(Group)
		_ = acli.FindByID(to, val)
		for _, xval := range to.GetAccessList() {
			arraccid.Set(xval.AccessID, 1)
		}
	}

	listaccid := []interface{}{}
	for key, _ := range arraccid {
		listaccid = append(listaccid, key)
	}

	filter := dbox.And(dbox.In("_id", listaccid...), dbox.Eq("enable", true), dbox.Eq("category", cat))
	cfilter := make([]*dbox.Filter, 0, 0)
	arrconf := []string{"parentid", "group1", "group2", "group3"}
	for _, str := range arrconf {
		if config.Has(str) {
			cfilter = append(cfilter, dbox.Eq(str, config.GetString(str)))
		}
	}

	if len(cfilter) > 0 {
		filter = dbox.And(filter, dbox.And(cfilter...))
	}

	c, err := acli.Find(new(Access), filter, nil)
	if err != nil {
		err = errors.New(toolkit.Sprintf("Get list menu found : %s", err.Error()))
		return
	}

	defer c.Close()

	tarraccess := make([]*Access, 0)
	err = c.Fetch(&tarraccess, 0, false)
	if err != nil {
		err = errors.New(toolkit.Sprintf("Get list menu found : %s", err.Error()))
		return
	}

	artkmchild := toolkit.M{}
	for _, val := range tarraccess {
		tkm := toolkit.M{}.Set("_id", val.ID).
			Set("title", val.Title).
			Set("icon", val.Icon).
			Set("url", val.Url).
			Set("index", val.Index).
			Set("submenu", []toolkit.M{})

		if val.ParentId == "" {
			artkm = append(artkm, tkm)
		} else {
			tval := artkmchild.Get(val.ParentId, []toolkit.M{}).([]toolkit.M)
			tval = append(tval, tkm)
			artkmchild.Set(val.ParentId, tval)
		}
	}

	for key, _ := range artkmchild {
		tval := artkmchild.Get(key, []toolkit.M{}).([]toolkit.M)
		tval = sortarrayaccess(tval)
		artkmchild.Set(key, tval)
	}

	artkm = sortarrayaccess(artkm)

	deeper := int(0)
	for len(artkmchild) > 0 {
		deeper++
		arrkey := []string{}
		for key, val := range artkmchild {
			found := false
			artkm, found = insertchild(key, val, artkm)
			if found {
				arrkey = append(arrkey, key)
			}
		}

		for _, str := range arrkey {
			artkmchild.Unset(str)
		}

		if deeper > level {
			break
		}
	}

	return
}

func (acli *ACLInstance) WriteLog(sessionId interface{}, access, reference string) error {
	ilog := new(Log)

	isession := new(Session)
	err := acli.FindByID(isession, sessionId)
	if err != nil {
		return errors.New(toolkit.Sprintf("Writelog found : %s", err.Error()))
	}

	ilog.SessionId = isession.ID
	ilog.LoginId = isession.LoginID
	ilog.Action = access
	ilog.Reference = reference

	err = acli.Save(ilog)
	if err != nil {
		return errors.New(toolkit.Sprintf("Writelog found : %s", err.Error()))
	}

	return nil
}
