package controllers

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"

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
	Role             string
	Limit            int
	Group            string
	FlowAbove        int
	DateType         string // Either MONTH or YEAR
	YearMonth        int
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

	sql := `SELECT cpty_long_name, cpty_coi,
  LEFT(counterparty_bank, 4) AS cpty_bank, 
  LEFT(customer_bank, 4) AS cust_bank, 
  ` + c.customerRoleClause() + `AS cust_role, 
  SUM(amount) AS total,
  ` + c.isNTBClause() + ` AS is_ntb
  FROM ` + c.tableName() + `
  WHERE cust_long_name=  "` + payload.EntityName + `"
  AND ` + c.commonWhereClause()

	// Filters for YearMonth
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			sql += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			sql += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	} else {
		sql += " AND transaction_year = 2016 "
	}

	// Filters for Role
	if strings.ToUpper(payload.Role) == "BUYER" {
		sql += " AND " + c.customerRoleClause() + " = 'BUYER'"
	} else if strings.ToUpper(payload.Role) == "PAYEE" {
		sql += " AND " + c.customerRoleClause() + " = 'PAYEE'"
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	}

	sql += " GROUP BY cpty_coi, cpty_long_name, cpty_bank, customer_role, cust_bank, is_ntb "

	// Filters for Flows
	if payload.FlowAbove > 0 {
		sql += " HAVING total > " + strconv.Itoa(payload.FlowAbove)
	}

	sql += " ORDER BY total DESC LIMIT " + strconv.Itoa(payload.Limit)

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

	sql := `SELECT cpty_long_name, LEFT(counterparty_bank, 4) AS cpty_bank, 
  product_category, SUM(amount) AS total, COUNT(1) AS number_transaction
  FROM ` + c.tableName() + ` 
	WHERE cust_long_name='` + payload.EntityName + `' AND cpty_long_name='` + payload.CounterpartyName + `' AND transaction_year=2016 
	AND ` + c.commonWhereClause() + `
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

func (c *CounterPartyController) GetDetailNetworkDiagramCSV(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputNone
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := CounterPartyPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT * 
  FROM ` + c.tableName() + ` 
	WHERE cust_long_name='` + payload.EntityName + `' AND cpty_long_name='` + payload.CounterpartyName + `' AND transaction_year=2016 
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

	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	if len(results) > 0 {
		keys := []string{}
		for k, _ := range results[0] {
			keys = append(keys, fmt.Sprintf("%v", k))
		}

		writer.Write(keys)

		for _, v := range results {
			values := []string{}
			for _, v := range v {
				values = append(values, fmt.Sprintf("%v", v))
			}

			writer.Write(values)
		}
	}

	writer.Flush()

	k.Writer.Header().Set("Content-Type", "text/csv")
	k.Writer.Header().Set("Content-Disposition", "attachment;filename=Download.csv")
	k.Writer.Write(buffer.Bytes())

	return nil
}

func (c *CounterPartyController) GetNetworkBuyerSupplier(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := CounterPartyPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	role := `"BUYER","PAYEE"`
	if payload.Role != "" {
		role = "'" + payload.Role + "'"
	}

	sql := `SELECT cpty_long_name, cpty_coi,
  ` + c.isNTBClause() + ` AS is_ntb,
  ` + c.customerRoleClause() + `AS cust_role, 
  SUM(amount) AS total 
  FROM ` + c.tableName() + `
  WHERE cust_long_name="` + payload.EntityName + `"  
  AND ` + c.customerRoleClause() + ` IN (` + role + `) 
  AND ` + c.commonWhereClause()

	// Filters for YearMonth
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			sql += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			sql += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	} else {
		sql += " AND transaction_year = 2016 "
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	} else {
		sql += " AND " + c.isNTBClause() + " <> 'NA' "
	}

	sql += " GROUP BY cpty_coi, cpty_long_name, cust_role, is_ntb "

	// Filters for Flows
	if payload.FlowAbove > 0 {
		sql += " HAVING total > " + strconv.Itoa(payload.FlowAbove)
	}

	sql += " ORDER BY total DESC LIMIT " + strconv.Itoa(payload.Limit)

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

func (c *CounterPartyController) GetNetworkBuyerSupplierProducts(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := CounterPartyPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT product_desc, COUNT(1) AS number_transaction
  FROM ` + c.tableName() + `
  WHERE cust_long_name="` + payload.EntityName + `" 
  AND cpty_long_name="` + payload.CounterpartyName + `" AND transaction_year = 2016  
  AND ` + c.isNTBClause() + ` <> "NA"
  AND ` + c.commonWhereClause() + `
  GROUP BY product_desc`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	resultsProduct := []tk.M{}
	err = qr.Fetch(&resultsProduct, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT transaction_month, SUM(amount) AS total
  FROM ` + c.tableName() + `
  WHERE cust_long_name="` + payload.EntityName + `" 
  AND cpty_long_name="` + payload.CounterpartyName + `" AND transaction_year = 2016  
  AND ` + c.isNTBClause() + ` <> "NA"
  AND ` + c.commonWhereClause() + `
  GROUP BY transaction_month`

	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	resultsTotal := []tk.M{}
	err = qr.Fetch(&resultsTotal, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	products := []string{}
	numberTransaction := 0
	for _, v := range resultsProduct {
		products = append(products, v.GetString("product_desc"))
		numberTransaction += v.GetInt("number_transaction")
	}

	total := 0.0
	for _, v := range resultsTotal {
		total += v.GetFloat64("total")
	}

	return c.SetResultOK(tk.M{
		"numberTransaction": numberTransaction,
		"avgMonthly":        total / float64(len(resultsTotal)),
		"avgYearly":         total / float64(len(resultsTotal)/12+1),
		"products":          products,
	})
}

func (c *CounterPartyController) GetNetworkBuyerSupplierDetail(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := CounterPartyPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT cpty_long_name, cpty_coi, product_category,
  LEFT(counterparty_bank, 4) AS cpty_bank, 
  SUM(amount) AS total, COUNT(1) AS number_transaction
  FROM ` + c.tableName() + `
  WHERE cpty_long_name="` + payload.CounterpartyName + `" AND transaction_year = 2016  
  AND ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY cpty_coi, cpty_long_name, cpty_bank, product_category
  ORDER BY total DESC`

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
