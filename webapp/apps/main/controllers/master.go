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

	sql := `SELECT DISTINCT cust_group_name
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
	AND ` + c.commonWhereClause() + ` ORDER BY cust_group_name`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
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

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

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

func (c *MasterController) GetCountries(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := MasterPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT DISTINCT cust_coi
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + payload.GroupName + `" 
  AND ` + c.commonWhereClause()

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	returnDatas := []tk.M{}
	for _, v := range results {
		returnDatas = append(returnDatas, tk.M{
			"value": v.GetString("cust_coi"),
			"text":  v.GetString("cust_coi"),
		})
	}

	return c.SetResultOK(returnDatas)
}
