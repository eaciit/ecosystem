package controllers

import (
	"strconv"
	"strings"

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

func (c *DashboardController) InCash() []string {
	texts := []string{
		"Book Transfer Incoming",
		"Inward CNAPS",
		"Inward Demand Draft",
		"Inward Direct Debit",
		"Inward ACH",
		"Foreign Bank Cheques",
		"Inward Local Transfer",
		"Inward Telegraphic Transfer",
		"Local Bank Cheques (Incoming)",
	}

	quotedTexts := []string{}
	for _, v := range texts {
		quotedTexts = append(quotedTexts, `"`+v+`"`)
	}

	return quotedTexts
}

func (c *DashboardController) OutCash() []string {
	texts := []string{
		"Outward CNAPS",
		"Book Transfer",
		"Corporate Cheques (Outgoing)",
		"Direct Debit",
		"Local Bank Cheques (Outgoing)",
		"Outward ACH",
		"Outward Demand Draft",
		"Outward Local Transfer",
		"Outward Telegraphic Transfer",
		"Salary Payment",
	}

	quotedTexts := []string{}
	for _, v := range texts {
		quotedTexts = append(quotedTexts, `"`+v+`"`)
	}

	return quotedTexts
}

func (c *DashboardController) ExportTrade() []string {
	texts := []string{
		"Export Bills under collection",
		"Export Bills under LC",
		"Export LC",
		"Export Standalone Finance",
		"Brazil Trade Advance",
		"ECR Postshipment - LC",
		"ECR Postshipment- Open Acct",
		"ECR Preshipment",
		"Input Finance",
		"Invoice Financing SUpplier",
		"Limited Resource Recv Purchase",
		"Local Bill Discounting Supplier",
		"Portofolio Receivable Services",
		"Post Acceptance Discounting",
		"Preshipment Finance Export Orders",
		"Receiveable Services",
		"Trade Receiveables Discounting",
	}

	quotedTexts := []string{}
	for _, v := range texts {
		quotedTexts = append(quotedTexts, `"`+v+`"`)
	}

	return quotedTexts
}

func (c *DashboardController) ImportTrade() []string {
	texts := []string{
		"Import Bills under collection",
		"Import LC and Import Bills Under LC",
		"Import Standalone Finance",
		"Bankers Acceptance Trade Buyers",
		"Bill Discounting Against Buyer Risk",
		"Finance Againts Inventory Receipts",
		"Finance Againts WareHouse Receipt",
		"Invoice Financing Buyer",
		"Receivable Guarantee",
		"Vendor Prepay",
	}

	quotedTexts := []string{}
	for _, v := range texts {
		quotedTexts = append(quotedTexts, `"`+v+`"`)
	}

	return quotedTexts
}

func (c *DashboardController) OtherTrade() []string {
	texts := []string{
		"Guarantee",
		"Borrowing Base Trade Loan",
	}

	quotedTexts := []string{}
	for _, v := range texts {
		quotedTexts = append(quotedTexts, `"`+v+`"`)
	}

	return quotedTexts
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

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT cust_coi AS country, cust_long_name AS entity 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + payload.GroupName + `" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY cust_coi, cust_long_name`

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

	sql := `SELECT LEFT(customer_bank, 4) AS bank, IFNULL(SUM(amount * rate),0) AS value,
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

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + `
	WHERE cust_long_name = "` + payload.EntityName + `"
	AND product_category = "Cash"
	AND product_desc IN (` + strings.Join(c.InCash(), ", ") + `)
  AND ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY product ORDER BY value DESC LIMIT 3`
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	resultInward := []tk.M{}
	err = qr.Fetch(&resultInward, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + `
	WHERE cust_long_name = "` + payload.EntityName + `"
	AND product_category = "Cash"
	AND product_desc IN (` + strings.Join(c.OutCash(), ", ") + `)
  AND ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY product ORDER BY value DESC LIMIT 3`
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	resultOutward := []tk.M{}
	err = qr.Fetch(&resultOutward, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + `
	WHERE cust_long_name = "` + payload.EntityName + `"
	AND product_category = "Trade"
	AND product_desc IN (` + strings.Join(c.ExportTrade(), ", ") + `)
  AND ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY product ORDER BY value DESC LIMIT 3`
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	resultExport := []tk.M{}
	err = qr.Fetch(&resultExport, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + `
	WHERE cust_long_name = "` + payload.EntityName + `"
	AND product_category = "Trade"
	AND product_desc IN (` + strings.Join(c.ImportTrade(), ", ") + `)
  AND ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY product ORDER BY value DESC LIMIT 3`
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	resultImport := []tk.M{}
	err = qr.Fetch(&resultImport, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + `
	WHERE cust_long_name = "` + payload.EntityName + `"
	AND product_category = "Trade"
	AND product_desc IN (` + strings.Join(c.OtherTrade(), ", ") + `)
  AND ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.commonWhereClause() + ` 
  GROUP BY product`
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	resultOther := []tk.M{}
	err = qr.Fetch(&resultOther, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	returnData := tk.M{
		"bank": results,
		"product": tk.M{
			"Cash": tk.M{
				"inward":  resultInward,
				"outward": resultOutward,
			},
			"Trade": tk.M{
				"export": resultExport,
				"import": resultImport,
				"other":  resultOther,
			},
		},
	}

	return c.SetResultOK(returnData)
}

func (c *DashboardController) GetETB(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT COUNT(DISTINCT cust_sci_leid) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + payload.GroupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
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

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + payload.GroupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
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

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
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

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
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

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + payload.GroupName + `" 
  AND ` + c.commonWhereClause() + ` 
  AND transaction_year = 2016`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
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
	sql := `SELECT COUNT(DISTINCT cust_sci_leid) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + payload.GroupName + `" 
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

	sql = `SELECT COUNT(DISTINCT cust_sci_leid) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + payload.GroupName + `" 
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
	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + payload.GroupName + `" 
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
  AND cust_group_name = "` + payload.GroupName + `" 
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
	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
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
  AND cust_group_name = "` + payload.GroupName + `" 
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
	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
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

	sql = `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
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
	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
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

	sql = `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
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

	sql := `SELECT COUNT(cust_sci_leid) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND cust_group_name = "` + payload.GroupName + `" 
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

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + payload.GroupName + `" 
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

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
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

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "PAYEE" 
  AND cust_group_name = "` + payload.GroupName + `" 
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

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.isNTBClause() + ` <> "NA" 
  AND ` + c.customerRoleClause() + ` = "BUYER" 
  AND cust_group_name = "` + payload.GroupName + `" 
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
