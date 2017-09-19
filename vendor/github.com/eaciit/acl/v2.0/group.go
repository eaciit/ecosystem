package acl

import (
	"github.com/eaciit/orm/v1"
	"github.com/eaciit/toolkit"
)

type GroupTypeEnum int

const (
	GroupTypeBasic GroupTypeEnum = iota
	GroupTypeLdap
)

type Group struct {
	orm.ModelBase `bson:"-",json:"-"`
	ID            string        `json:"_id",bson:"_id"`
	Title         string        // `json:"Title",bson:"Title"`
	Enable        bool          // `json:"Enable",bson:"Enable"`
	Grants        []AccessGrant // `json:"Grants",bson:"Grants"`
	Owner         string        // `json:"Owner",bson:"Owner"`
	GroupType     GroupTypeEnum
	GroupConf     toolkit.M
	MemberConf    toolkit.M
}

func (g *Group) TableName() string {
	return "acl_groups"
}

func (g *Group) RecordID() interface{} {
	return g.ID
}

func (g *Group) PreSave() error {
	if g.ID == "" {
		g.ID = toolkit.RandomString(32)
	}
	return nil
}

func (g *Group) Grant(tAccessID string, tAccessEnum ...AccessTypeEnum) {
	f, i := getgrantindex(g.Grants, tAccessID)
	if f {
		for _, tAE := range tAccessEnum {
			splittAE := splitgrantvalue(tAE)
			for _, iSplittAE := range splittAE {
				if !Matchaccess(iSplittAE, g.Grants[i].AccessValue) {
					g.Grants[i].AccessValue += iSplittAE
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

		g.Grants = append(g.Grants, tag)
	}
	return
}

func (g *Group) Revoke(tAccessID string, tAccessEnum ...AccessTypeEnum) {
	f, i := getgrantindex(g.Grants, tAccessID)
	if f {
		for _, tAE := range tAccessEnum {
			splittAE := splitgrantvalue(tAE)
			for _, iSplittAE := range splittAE {
				if Matchaccess(iSplittAE, g.Grants[i].AccessValue) {
					g.Grants[i].AccessValue -= iSplittAE
				}
			}
		}
	}

	if g.Grants[i].AccessValue == 0 {
		g.Grants = append(g.Grants[:i], g.Grants[i+1:]...)
	}

	return
}

func (g *Group) GetAccessList() (arrgrant []AccessGrant) {
	arrgrant = make([]AccessGrant, 0, 0)
	arrgrant = append(arrgrant, g.Grants...)
	return
}
