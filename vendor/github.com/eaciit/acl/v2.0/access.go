package acl

import (
	"github.com/eaciit/orm/v1"
	"github.com/eaciit/toolkit"
)

type AccessCategoryEnum int

const (
	AccessData AccessCategoryEnum = 1
	AccessMenu                    = 2
	AccessAjax                    = 3
	AccessList                    = 4
	AccessTab                     = 5
	//Just sample,
)

type Access struct {
	orm.ModelBase  `bson:"-",json:"-"`
	ID             string `json:"_id",bson:"_id"`
	Title          string // `json:"Title",bson:"Title"`
	Category       AccessCategoryEnum
	Icon           string
	ParentId       string
	Url            string
	Index          int
	Group1         string // `json:"Group1",bson:"Group1"`
	Group2         string // `json:"Group2",bson:"Group2"`
	Group3         string // `json:"Group3",bson:"Group3"`
	Enable         bool   // `json:"Enable",bson:"Enable"`
	SpecialAccess1 string // `json:"SpecialAccess1",bson:"SpecialAccess1"`
	SpecialAccess2 string // `json:"SpecialAccess2",bson:"SpecialAccess2"`
	SpecialAccess3 string // `json:"SpecialAccess3",bson:"SpecialAccess3"`
	SpecialAccess4 string // `json:"SpecialAccess4",bson:"SpecialAccess4"`
}

//title: 'Home', icon: 'home', href: viewModel.appName + 'page/home', submenu: []

func (a *Access) TableName() string {
	return "acl_access"
}

func (a *Access) RecordID() interface{} {
	return a.ID
}

func (a *Access) PreSave() error {
	if a.ID == "" {
		a.ID = toolkit.RandomString(32)
	}
	return nil
}
