package controllers

import (
	"strconv"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
	tk "github.com/eaciit/toolkit"
)

type DashboardPayload struct {
	FromYearMonth int
	ToYearMonth   int
	EntityName    string
	GroupName     string
}

type DashboardController struct {
	*BaseController
}

func (c *DashboardController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

func (c *DashboardController) GetMapData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	groupName := "Rollin"
	sql := `SELECT cust_coi AS country, cust_long_name AS entity 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY cust_coi, cust_long_name`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results)
}

func (c *DashboardController) GetEntityDetail(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT LEFT(customer_bank, 4) AS bank, IFNULL(SUM(amount),0) AS value,
  product_category, ` + c.customerRoleClause() + ` AS flow 
  FROM ` + c.tableName() + `
  WHERE cust_long_name = "` + payload.EntityName + `"
  AND ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY product_category, flow, bank`
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results1 := []tk.M{}
	err = qr.Fetch(&results1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT product_category, product_desc AS product, IFNULL(SUM(amount),0) AS value
  FROM ` + c.tableName() + `
  WHERE cust_long_name = "` + payload.EntityName + `"
  AND ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY product_category, product`
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results2 := []tk.M{}
	err = qr.Fetch(&results2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	returnData := tk.M{
		"bank":    results1,
		"product": results2,
	}

	return c.SetResultOK(returnData)
}

func (c *DashboardController) GetETB(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	groupName := "Rollin"
	sql := `SELECT COUNT(DISTINCT cust_sci_leid) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetBuyer(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	groupName := "Rollin"
	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetSeller(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	groupName := "Rollin"
	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetInFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	groupName := "Rollin"
	sql := `SELECT IFNULL(SUM(amount),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetOutFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	groupName := "Rollin"
	sql := `SELECT IFNULL(SUM(amount),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetYearChangeETB(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	transactionYear := 2016
	groupName := "Rollin"
	sql := `SELECT COUNT(cust_sci_leid) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT COUNT(cust_sci_leid) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear-1)

	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetYearChangeBuyer(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	transactionYear := 2016
	groupName := "Rollin"
	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear-1)

	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetYearChangeSeller(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	transactionYear := 2016
	groupName := "Rollin"
	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear-1)

	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetYearChangeInFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	transactionYear := 2016
	groupName := "Rollin"
	sql := `SELECT IFNULL(SUM(amount),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT IFNULL(SUM(amount),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear-1)

	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetYearChangeOutFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	transactionYear := 2016
	groupName := "Rollin"
	sql := `SELECT IFNULL(SUM(amount),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT IFNULL(SUM(amount),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = ` + strconv.Itoa(transactionYear-1)

	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetChartETB(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	groupName := "Rollin"
	sql := `SELECT COUNT(cust_sci_leid) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016 
  GROUP BY transaction_month ORDER BY transaction_month`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results)
}

func (c *DashboardController) GetChartBuyer(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	groupName := "Rollin"
	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016 
  GROUP BY transaction_month ORDER BY transaction_month`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results)
}

func (c *DashboardController) GetChartSeller(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	groupName := "Rollin"
	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016 
  GROUP BY transaction_month ORDER BY transaction_month`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results)
}

func (c *DashboardController) GetChartInFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	groupName := "Rollin"
	sql := `SELECT IFNULL(SUM(amount),0) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016
  GROUP BY transaction_month ORDER BY transaction_month`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results)
}

func (c *DashboardController) GetChartOutFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	groupName := "Rollin"
	sql := `SELECT IFNULL(SUM(amount),0) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + groupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016
  GROUP BY transaction_month ORDER BY transaction_month`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results)
}
