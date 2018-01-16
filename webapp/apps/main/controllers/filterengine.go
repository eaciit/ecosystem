package controllers

import (
	"strconv"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
	tk "github.com/eaciit/toolkit"
)

type FilterEngineController struct {
	*BaseController
}

type FilterEnginePayload struct {
	TradeProduct      string
	Group             string
	SupplierNumber    string
	TransactionNumber string
	TotalFlow         string
	CreditRating      string
	Limit             int
}

func (c *FilterEngineController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

func (c *FilterEngineController) GetResult(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := FilterEnginePayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT 
	cust_group_name, 
	COUNT(DISTINCT cust_sci_leid) AS cust_number, 
	COUNT(DISTINCT cust_coi) AS cust_coi_number,
	COUNT(DISTINCT cpty_sci_leid) AS cpty_number,
	COUNT(1) AS transaction_number,
	SUM(amount * rate) AS total
  FROM ` + c.tableName() + `
	WHERE ` + c.commonWhereClause()

	sql += ` 
	AND customer_role IN ('BUYER', 'DRAWEE')
	AND cust_credit_grade ` + payload.CreditRating

	sql += " GROUP BY cust_group_name "

	sql += ` 
	HAVING total ` + payload.TotalFlow + `
	AND cpty_number ` + payload.SupplierNumber + `
	AND transaction_number ` + payload.TransactionNumber

	sql += " ORDER BY total DESC"

	if payload.Limit > 0 {
		sql += " LIMIT " + strconv.Itoa(payload.Limit)
	}

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

	return c.SetResultOK(results)
}
