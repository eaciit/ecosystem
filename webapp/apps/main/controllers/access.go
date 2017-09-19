package controllers

import (
	"crypto/md5"
	"eaciit/scb-eco/webapp/helper"
	"io"
	"sort"
	"strings"

	"github.com/eaciit/acl/v2.0"
	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
	"gopkg.in/mgo.v2/bson"
)

type AccessController struct {
	*BaseController
}

func (c *AccessController) Master(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

// ======== user

func (c *AccessController) GetUser(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	csr, err := c.Acli.Find(new(acl.User), nil, nil)
	defer csr.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	data := make([]acl.User, 0)
	err = csr.Fetch(&data, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(data)
}

func (c *AccessController) SelectUser(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := new(acl.User)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	err = c.Acli.FindByID(payload, payload.ID)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}

func (c *AccessController) DeleteUser(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := new(acl.User)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	err = c.Acli.Delete(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}

func (c *AccessController) SaveUser(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := new(acl.User)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	payload.Password = strings.TrimSpace(payload.Password)
	if payload.ID == "" {
		payload.ID = bson.NewObjectId().Hex()
	}

	// get old user info
	oldUserInfo := new(acl.User)
	err = c.Acli.FindByID(oldUserInfo, payload.ID)

	// generate hashed password
	hasher := md5.New()
	io.WriteString(hasher, payload.Password)
	hashedPassword := tk.Sprintf("%x", hasher.Sum(nil))

	// The user is found
	if err == nil {
		// update password if not match with previous password
		if (payload.Password != "") && (payload.Password != oldUserInfo.Password) && (hashedPassword != oldUserInfo.Password) {
			err = c.Acli.ChangePassword(payload.ID, payload.Password)
			if err != nil {
				return c.SetResultError(err.Error(), nil)
			}
		}
	}

	payload.Acli = c.Acli
	payload.Password = hashedPassword
	err = c.Acli.Save(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}

// ======== group

func (c *AccessController) GetGroup(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	csr, err := c.Acli.Find(new(acl.Group), nil, nil)
	defer csr.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	data := make([]acl.Group, 0)
	err = csr.Fetch(&data, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(data)
}

func (c *AccessController) SelectGroup(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)

	payload := new(acl.Group)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	err = c.Acli.FindByID(payload, payload.ID)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}

func (c *AccessController) DeleteGroup(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := new(acl.Group)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	err = c.Acli.Delete(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}

func (c *AccessController) SaveGroup(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := new(acl.Group)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	if payload.ID == "" {
		payload.ID = bson.NewObjectId().Hex()
	}

	err = c.Acli.Save(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}

// ======== sessions

type Sessions []acl.Session

func (a Sessions) Len() int           { return len(a) }
func (a Sessions) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a Sessions) Less(i, j int) bool { return helper.IsTimeAfter(a[i].Created, a[j].Created) }

func (c *AccessController) GetSession(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	csr, err := c.Acli.Find(new(acl.Session), nil, nil)
	defer csr.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	data := make([]acl.Session, 0)
	err = csr.Fetch(&data, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	max := 100
	if len(data) < max {
		max = len(data)
	}

	sort.Sort(Sessions(data))
	return c.SetResultOK(data[0:max])
}

// ======== access menu

func (c *AccessController) GetAccessMenu(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	csr, err := c.Acli.Find(new(acl.Access), nil, nil)
	defer csr.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	data := make([]acl.Access, 0)
	err = csr.Fetch(&data, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(data)
}

func (c *AccessController) GetAccessMenuForCurrentUser(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)

	// if NoLogin mode, then return all available access for dev purpose
	// if c.GetCurrentUsername(k) == "" && c.NoLogin {
	// if c.GetCurrentUsername(k) == "" {
	// 	return c.GetAccessMenu(k)
	// }

	return c.SetResultOK(LoginDataAccessMenu)
}

func (c *AccessController) SelectAccessMenu(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := new(acl.Access)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	err = c.Acli.FindByID(payload, payload.ID)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}

func (c *AccessController) DeleteAccessMenu(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := new(acl.Access)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	err = c.Acli.Delete(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}

func (c *AccessController) SaveAccessMenu(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := new(acl.Access)
	err := k.GetPayload(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	if payload.ID == "" {
		payload.ID = bson.NewObjectId().Hex()
	}

	err = c.Acli.Save(payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(payload)
}
