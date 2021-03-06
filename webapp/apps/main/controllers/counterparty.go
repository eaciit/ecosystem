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
	GroupName        string
	EntityName       string
	CounterpartyName string
	Relations        [][]string
	Role             string
	ProductCategory  string
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

func (c *CounterPartyController) GetTopEntities(key string, payload *CounterPartyPayload) ([]string, error) {
	sql := `SELECT ` + key + `,
  SUM(amount * rate) AS total
  FROM ` + c.tableName() + `
	WHERE ` + c.commonWhereClause()

	// Check the entity name
	if strings.ToUpper(payload.EntityName) != "ALL" {
		sql += ` AND cust_long_name = "` + payload.EntityName + `"`
	} else {
		sql += ` AND cust_group_name = "` + payload.GroupName + `"`
	}

	// Filters for YearMonth
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			sql += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			sql += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	}

	// Filters for Role
	if strings.ToUpper(payload.Role) == "BUYER" {
		sql += " AND " + c.customerRoleClause() + " = 'BUYER'"
	} else if strings.ToUpper(payload.Role) == "PAYEE" {
		sql += " AND " + c.customerRoleClause() + " = 'PAYEE'"
	} else {
		sql += " AND " + c.eitherBuyerSupplierClause()
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	} else if strings.ToUpper(payload.Group) == "INTRA-GROUP" {
		sql += " AND cust_group_name = cpty_group_name"
	}

	// Filters for Cast/Trade
	if strings.ToUpper(payload.ProductCategory) == "CASH" {
		sql += " AND product_category = 'Cash'"
	} else if strings.ToUpper(payload.ProductCategory) == "TRADE" {
		sql += " AND product_category = 'Trade'"
	}

	sql += " GROUP BY " + key

	// Filters for Flows
	if payload.FlowAbove > 0 {
		sql += " HAVING total > " + strconv.Itoa(payload.FlowAbove)
	}

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
	err := qr.Fetch(&results, 0)
	if err != nil {
		return []string{}, err
	}

	returnData := []string{}
	for _, v := range results {
		returnData = append(returnData, v.GetString(key))
	}

	return returnData, nil
}

func (c *CounterPartyController) NetworkDiagramSQL(payload *CounterPartyPayload) (string, int) {
	entities, err := c.GetTopEntities("cpty_long_name", payload)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	entitiesEscaped := []string{}
	for _, v := range entities {
		entitiesEscaped = append(entitiesEscaped, "'"+v+"'")
	}

	entitiesClause := "(" + strings.Join(entitiesEscaped, ", ") + ")"

	sql := `SELECT cpty_group_name, cpty_long_name, cpty_coi,
  LEFT(counterparty_bank, 4) AS cpty_bank, 
  LEFT(customer_bank, 4) AS cust_bank, 
  ` + c.customerRoleClause() + `AS cust_role, 
  SUM(amount * rate) AS total,
  ` + c.isNTBClause() + ` AS is_ntb
  FROM ` + c.tableName() + `
	WHERE ` + c.commonWhereClause() + `
	AND cpty_long_name IN ` + entitiesClause

	// Check the entity name
	if strings.ToUpper(payload.EntityName) != "ALL" {
		sql += ` AND cust_long_name = "` + payload.EntityName + `"`
	} else {
		sql += ` AND cust_group_name = "` + payload.GroupName + `"`
	}

	// Filters for YearMonth
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			sql += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			sql += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	}

	// Filters for Role
	if strings.ToUpper(payload.Role) == "BUYER" {
		sql += " AND " + c.customerRoleClause() + " = 'BUYER'"
	} else if strings.ToUpper(payload.Role) == "PAYEE" {
		sql += " AND " + c.customerRoleClause() + " = 'PAYEE'"
	} else {
		sql += " AND " + c.eitherBuyerSupplierClause()
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	}

	// Filters for Cast/Trade
	if strings.ToUpper(payload.ProductCategory) == "CASH" {
		sql += " AND product_category = 'Cash'"
	} else if strings.ToUpper(payload.ProductCategory) == "TRADE" {
		sql += " AND product_category = 'Trade'"
	}

	sql += " GROUP BY cpty_group_name, cpty_coi, cpty_long_name, cpty_bank, customer_role, cust_bank, is_ntb "

	// Filters for Flows
	if payload.FlowAbove > 0 {
		sql += " HAVING total > " + strconv.Itoa(payload.FlowAbove)
	}

	sql += " ORDER BY total DESC"

	return sql, len(entities)
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

	if strings.ToUpper(payload.Role) == "BUYER" || strings.ToUpper(payload.Role) == "PAYEE" {
		sql, numEntities := c.NetworkDiagramSQL(&payload)

		results := []tk.M{}
		if numEntities > 0 {
			qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
			if qr.Error() != nil {
				c.SetResultError(qr.Error().Error(), nil)
			}
			defer qr.Close()

			err = qr.Fetch(&results, 0)
			if err != nil {
				c.SetResultError(err.Error(), nil)
			}
		}

		return c.SetResultOK(tk.M{
			payload.EntityName: results,
		})
	}

	payload.Role = "BUYER"
	sql, numEntities := c.NetworkDiagramSQL(&payload)
	resultsB := []tk.M{}

	if numEntities > 0 {
		qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}
		defer qr.Close()

		err = qr.Fetch(&resultsB, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}
	}

	payload.Role = "PAYEE"
	sql, numEntities = c.NetworkDiagramSQL(&payload)
	resultsP := []tk.M{}

	if numEntities > 0 {
		qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}
		defer qr.Close()

		err = qr.Fetch(&resultsP, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}
	}

	return c.SetResultOK(tk.M{
		payload.EntityName: append(resultsB, resultsP...),
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

	relations := []string{}
	for _, v := range payload.Relations {
		relations = append(relations, "(cust_long_name='"+v[0]+"' AND cpty_long_name='"+v[1]+"')")
	}

	sql := `SELECT cpty_long_name, LEFT(customer_bank, 4) AS cust_bank, LEFT(counterparty_bank, 4) AS cpty_bank, 
  product_category, SUM(amount * rate) AS total, COUNT(1) AS number_transaction
  FROM ` + c.tableName() + ` 
	WHERE ` + c.commonWhereClause() + ` 
	AND (` + strings.Join(relations, " OR ") + `)`

	// Filters for YearMonth
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			sql += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			sql += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	}

	// Filters for Role
	if strings.ToUpper(payload.Role) == "BUYER" {
		sql += " AND " + c.customerRoleClause() + " = 'BUYER'"
	} else if strings.ToUpper(payload.Role) == "PAYEE" {
		sql += " AND " + c.customerRoleClause() + " = 'PAYEE'"
	} else {
		sql += " AND " + c.eitherBuyerSupplierClause()
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	}

	// Filters for Cast/Trade
	if strings.ToUpper(payload.ProductCategory) == "CASH" {
		sql += " AND product_category = 'Cash'"
	} else if strings.ToUpper(payload.ProductCategory) == "TRADE" {
		sql += " AND product_category = 'Trade'"
	}

	sql += ` GROUP BY cpty_long_name, cust_bank, cpty_bank, product_category 
	ORDER BY total DESC`

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

	keys := []string{"cust_long_name", "cpty_long_name", "cust_role", "customer_bank", "counterparty_bank", "product_code", "product_desc", "amount"}
	selectKeys := []string{"cust_long_name", "cpty_long_name", c.customerRoleClause() + " AS cust_role", "customer_bank", "counterparty_bank", "product_code", "product_desc", "amount * rate AS amount"}

	relations := []string{}
	for _, v := range payload.Relations {
		relations = append(relations, "(cust_long_name='"+v[0]+"' AND cpty_long_name='"+v[1]+"')")
	}

	sql := `SELECT ` + strings.Join(selectKeys, ", ") + `
  FROM ` + c.tableName() + ` 
	WHERE ` + c.commonWhereClause() + `
	AND (` + strings.Join(relations, " OR ") + `)`

	// Filters for YearMonth
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			sql += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			sql += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	}

	// Filters for Role
	if strings.ToUpper(payload.Role) == "BUYER" {
		sql += " AND " + c.customerRoleClause() + " = 'BUYER'"
	} else if strings.ToUpper(payload.Role) == "PAYEE" {
		sql += " AND " + c.customerRoleClause() + " = 'PAYEE'"
	} else {
		sql += " AND " + c.eitherBuyerSupplierClause()
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	}

	// Filters for Cast/Trade
	if strings.ToUpper(payload.ProductCategory) == "CASH" {
		sql += " AND product_category = 'Cash'"
	} else if strings.ToUpper(payload.ProductCategory) == "TRADE" {
		sql += " AND product_category = 'Trade'"
	}

	sql += ` ORDER BY amount DESC`
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

	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	if len(results) > 0 {
		writer.Write(keys)

		for _, v := range results {
			values := []string{}
			for _, k := range keys {
				sv := fmt.Sprintf("%v", v.Get(k))
				switch v.Get(k).(type) {
				case string:
					sv = fmt.Sprintf("%s", v.Get(k))
				}

				values = append(values, sv)
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

// ================ Old Code / Probably never use it again
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
  SUM(amount * rate) AS total 
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
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	} else {
		sql += " AND " + c.isNTBClause() + " <> 'NA' "
	}

	// Filters for Cast/Trade
	if strings.ToUpper(payload.ProductCategory) == "CASH" {
		sql += " AND product_category = 'Cash'"
	} else if strings.ToUpper(payload.ProductCategory) == "TRADE" {
		sql += " AND product_category = 'Trade'"
	}

	sql += " GROUP BY cpty_coi, cpty_long_name, cust_role, is_ntb "

	// Filters for Flows
	if payload.FlowAbove > 0 {
		sql += " HAVING total > " + strconv.Itoa(payload.FlowAbove)
	}

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
	defer qr.Close()

	resultsProduct := []tk.M{}
	err = qr.Fetch(&resultsProduct, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT transaction_month, SUM(amount * rate) AS total
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
  SUM(amount * rate) AS total, COUNT(1) AS number_transaction
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
	defer qr.Close()

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results)
}
