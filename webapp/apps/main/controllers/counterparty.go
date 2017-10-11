package controllers

import (
	"strconv"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
	tk "github.com/eaciit/toolkit"
)

type CounterPartyController struct {
	*BaseController
}

type CounterPartyPayload struct {
	EntityName       string
	CounterpartyName string
	Limit            int
}

func (c *CounterPartyController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

func (c *CounterPartyController) NetworkDiagram(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

func (c *CounterPartyController) GetNetworkDiagramData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := CounterPartyPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT cpty_long_name, LEFT(counterparty_bank, 4) AS cpty_bank, cpty_coi, 
  LEFT(customer_bank, 4) AS cust_bank, 
  (CASE customer_role WHEN "DRAWEE" THEN "BUYER" WHEN "SUPPLIER" THEN "PAYEE" ELSE customer_role END) AS cust_role, 
  SUM(amount) AS total 
  FROM vw_sc_model_for_tblau_20170830 
  WHERE cust_long_name="` + payload.EntityName + `" AND transaction_year = 2016   
  GROUP BY cpty_coi, cpty_long_name, cpty_bank, customer_role, cust_bank 
  ORDER BY total DESC LIMIT ` + strconv.Itoa(payload.Limit)
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(tk.M{
		payload.EntityName: results,
	})
}

func (c *CounterPartyController) GetDetailNetworkDiagramData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := CounterPartyPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT cpty_long_name, LEFT(counterparty_bank, 4) AS cpty_bank, product_category, SUM(amount) AS total, COUNT(1) AS number_transaction
  FROM vw_sc_model_for_tblau_20170830 
  WHERE cust_long_name='` + payload.EntityName + `' AND cpty_long_name='` + payload.CounterpartyName + `' AND transaction_year=2016 
  GROUP BY cpty_long_name, cpty_bank, product_category`
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
