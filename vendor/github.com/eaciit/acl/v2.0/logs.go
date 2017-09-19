package acl

import (
	// "errors"
	// "github.com/eaciit/dbox"
	"github.com/eaciit/orm/v1"
	"github.com/eaciit/toolkit"
	"time"
)

type Log struct {
	orm.ModelBase `bson:"-" json:"-"`
	ID            string `bson:"_id" json:"_id"`
	SessionId     string
	LoginId       string
	Action        string
	Reference     string
	RequestAddr   string
	Time          time.Time
	LoadingTimes  string
	Description   string
}

func (l *Log) TableName() string {
	return "acl_logs"
}

func (l *Log) RecordID() interface{} {
	return l.ID
}

func (l *Log) PreSave() error {
	if l.ID == "" {
		l.ID = toolkit.RandomString(32)
	}
	l.Time = time.Now().UTC()
	return nil
}

// func (m *ModelBase) PreSave() error {
// 	return nil
// }

// func (m *ModelBase) PostSave() error {
// 	return nil
// }

// func (l *Log) Save() error {
// 	e := gdrj.Save(l)
// 	if e != nil {
// 		return errors.New(toolkit.Sprintf("[%v-%v] Error found : ", l.TableName(), "save", e.Error()))
// 	}
// 	return e
// }

// func GetLog(payload toolkit.M) (toolkit.M, error) {
// 	var filter *dbox.Filter

// 	log := new(Log)
// 	if find := toolkit.ToString(payload["search"]); find != "" {
// 		filter = new(dbox.Filter)
// 		filter = dbox.Contains("name", find)
// 	}
// 	take := toolkit.ToInt(payload["take"], toolkit.RoundingAuto)
// 	skip := toolkit.ToInt(payload["skip"], toolkit.RoundingAuto)

// 	c, err := gdrj.Find(log, filter, toolkit.M{}.Set("take", take).Set("skip", skip))
// 	if err != nil {
// 		return nil, err
// 	}
// 	count := c.Count()

// 	data := toolkit.M{}
// 	arrm := make([]toolkit.M, 0, 0)
// 	if err := c.Fetch(&arrm, 0, false); err != nil {
// 		return nil, err
// 	}

// 	defer c.Close()

// 	data.Set("Datas", arrm)
// 	data.Set("total", count)

// 	return data, nil

// }

// func WriteLog(sessionId interface{}, access, reference string) error {
// 	userid, err := GetUserName(sessionId)
// 	if err != nil {
// 		return err
// 	}

// 	log := new(Log)
// 	log.ID = toolkit.RandomString(32)
// 	log.Name = userid.FullName
// 	log.Action = access
// 	log.Reference = reference
// 	log.Time = time.Now()

// 	if access == "login" || access == "logout" {
// 		log.Description = log.Name + " " + access + " at " + log.Time.String()
// 	} else {
// 		log.Description = log.Name + " is accessing page " + log.Reference + " at " + log.Time.String()
// 	}

// 	if err := log.Save(); err != nil {
// 		return err
// 	}

// 	return nil
// }
