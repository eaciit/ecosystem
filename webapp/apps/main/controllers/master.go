package controllers

import (
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
	tk "github.com/eaciit/toolkit"
)

type MasterController struct {
	*BaseController
}

type MasterPayload struct {
	GroupName string
}

func (c *MasterController) GetGroups(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}
	frm := struct {
		Search string
	}{}
	err := k.GetPayload(&frm)
	if err != nil {
		return nil
	}
	if len(frm.Search) < 3 {
		return c.SetResultOK([]tk.M{})
	}
	sql := `SELECT DISTINCT cust_group_name
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
	AND ` + c.commonWhereClause() + `
	AND lcase(cust_group_name) LIKE '%` + frm.Search + `%' 
  ORDER BY cust_group_name`

	tk.Println("master.go->GetGroups-> ", sql)
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	returnDatas := []tk.M{}
	for _, v := range results {
		returnDatas = append(returnDatas, tk.M{
			"value": v.GetString("cust_group_name"),
			"text":  v.GetString("cust_group_name"),
		})
	}

	return c.SetResultOK(returnDatas)
}

func (c *MasterController) GetEntities(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := MasterPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT DISTINCT cust_long_name
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
	AND cust_group_name = "` + payload.GroupName + `" 
  AND ` + c.commonWhereClause() + ` ORDER BY cust_long_name`

	tk.Println("master.go->GetEntities-> ", sql)
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	returnDatas := []tk.M{}
	for _, v := range results {
		returnDatas = append(returnDatas, tk.M{
			"value": v.GetString("cust_long_name"),
			"text":  v.GetString("cust_long_name"),
		})
	}

	return c.SetResultOK(returnDatas)
}

func (c *MasterController) GetBookingCountries(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	sql := `SELECT DISTINCT booking_country
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `ORDER BY booking_country`

	tk.Println("master.go->GetBookingCountries-> ", sql)
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	returnDatas := []tk.M{}
	for _, v := range results {
		returnDatas = append(returnDatas, tk.M{
			"value": v.GetString("booking_country"),
			"text":  v.GetString("booking_country"),
		})
	}

	return c.SetResultOK(returnDatas)
}
