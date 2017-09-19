package acl

import (
	"errors"

	"fmt"
	"github.com/eaciit/dbox"
	"github.com/eaciit/orm/v1"
	"github.com/eaciit/toolkit"
)

type LoginTypeEnum int

const (
	LogTypeBasic LoginTypeEnum = iota
	LogTypeLdap
	//LogTypeGoogle
	//LogTypeFacebook
)

type User struct {
	orm.ModelBase `bson:"-",json:"-"`
	ID            string        `json:"_id",bson:"_id"`
	LoginID       string        // `json:"LoginID",bson:"LoginID"`
	FullName      string        // `json:"FullName",bson:"FullName"`
	Email         string        // `json:"Email",bson:"Email"`
	Password      string        // `json:"Password",bson:"Password"`
	Enable        bool          // `json:"Enable",bson:"Enable"`
	Groups        []string      // `json:"Groups",bson:"Groups"`
	Grants        []AccessGrant // `json:"Grants",bson:"Grants"`
	LoginType     LoginTypeEnum
	LoginConf     toolkit.M

	Acli *ACLInstance `bson:"-",json:"-"`
}

func (u *User) TableName() string {
	return "acl_users"
}

func (u *User) RecordID() interface{} {
	return u.ID
}

func (u *User) PreSave() error {
	if u.Acli == nil {
		fmt.Println("WARNING! *ACLInstance object should be added to user.PreSave object")
	}

	if u.ID == "" && u.Acli.IsUserExist(u.LoginID) {
		return errors.New("acl user is exist")
	}

	if u.ID == "" {
		u.ID = toolkit.RandomString(32)
	}
	return nil
}

func (u *User) Grant(tAccessID string, tAccessEnum ...AccessTypeEnum) {
	f, i := getgrantindex(u.Grants, tAccessID)
	if f {
		for _, tAE := range tAccessEnum {
			splittAE := splitgrantvalue(tAE)
			for _, iSplittAE := range splittAE {
				if !Matchaccess(iSplittAE, u.Grants[i].AccessValue) {
					u.Grants[i].AccessValue += iSplittAE
				}
			}
		}
	} else {
		sint := 0
		for _, tAE := range tAccessEnum {
			sint += int(tAE)
		}

		if sint == 0 {
			return
		}

		tag := AccessGrant{
			AccessID:    tAccessID,
			AccessValue: sint,
		}

		u.Grants = append(u.Grants, tag)
	}
	return
}

func (u *User) Revoke(tAccessID string, tAccessEnum ...AccessTypeEnum) {
	f, i := getgrantindex(u.Grants, tAccessID)
	if f {
		for _, tAE := range tAccessEnum {
			splittAE := splitgrantvalue(tAE)
			for _, iSplittAE := range splittAE {
				if Matchaccess(iSplittAE, u.Grants[i].AccessValue) {
					u.Grants[i].AccessValue -= iSplittAE
				}
			}
		}
	}

	if u.Grants[i].AccessValue == 0 {
		u.Grants = append(u.Grants[:i], u.Grants[i+1:]...)
	}

	return
}

func (u *User) AddToGroup(tGroupID string) error {
	if u.Acli == nil {
		fmt.Println("WARNING! *ACLInstance object should be added to Token object on user.AddToGroup")
	}

	mod := new(Group)
	e := u.Acli.FindByID(mod, tGroupID)
	if e != nil {
		return errors.New("Acl.UserAddToGroup: " + e.Error())
	}

	if !toolkit.HasMember(u.Groups, mod.ID) {
		u.Groups = append(u.Groups, mod.ID)
	}

	// for _, tg := range mod.Grants {
	// 	arrgrantval := Splitinttogrant(tg.AccessValue)
	// 	u.Grant(tg.AccessID, arrgrantval...)
	// }

	return nil
}

func (u *User) RemoveFromGroup(tGroupID string) error {
	if u.Acli == nil {
		fmt.Println("WARNING! *ACLInstance object should be added to Token object user.RemoveFromGroup")
	}

	mod := new(Group)
	e := u.Acli.FindByID(mod, tGroupID)
	if e != nil {
		return errors.New("Acl.UserAddToGroup: " + e.Error())
	}

	if f, i := toolkit.MemberIndex(u.Groups, mod.ID); f {
		u.Groups = append(u.Groups[:i], u.Groups[i+1:]...)
	}

	// for _, tg := range mod.Grants {
	// 	arrgrantval := Splitinttogrant(tg.AccessValue)
	// 	u.Revoke(tg.AccessID, arrgrantval...)
	// }

	return nil
}

func (u *User) GetAccessList() (arrgrant []AccessGrant) {
	arrgrant = make([]AccessGrant, 0, 0)
	arrgrant = append(arrgrant, u.Grants...)

	return
}

func (acli *ACLInstance) GetUserByGroup(groupid string) (arruser []*User, err error) {
	arruser = make([]*User, 0, 0)

	filter := dbox.Eq("groups", groupid)
	c, err := acli.Find(new(User), filter, nil)
	if err != nil {
		return
	}

	err = c.Fetch(&arruser, 0, false)

	return
}
