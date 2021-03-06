package controllers

import (
	"strconv"
	"strings"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
	tk "github.com/eaciit/toolkit"
)

type DashboardPayload struct {
	FromYearMonth    int
	ToYearMonth      int
	BookingCountries []string
	GroupName        string
	EntityName       string
	CounterpartyName string
	Role             string
	Limit            int
	Group            string
	ProductCategory  string
	FlowAbove        int
	DateType         string // Either MONTH or YEAR
	YearMonth        int
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

func (c *DashboardController) FilterClause(payload DashboardPayload, excludeDate bool) string {
	// Filters for Group Name
	sql := ` AND cust_group_name = "` + payload.GroupName + `"`

	// Filters for Entity Name
	if strings.ToUpper(payload.EntityName) != "ALL" {
		sql += " AND cust_long_name = '" + payload.EntityName + "'"
	}

	// Filters for Booking Country
	if len(payload.BookingCountries) > 0 {
		quotedBookingCountries := []string{}
		for _, v := range payload.BookingCountries {
			quotedBookingCountries = append(quotedBookingCountries, "'"+v+"'")
		}

		sql += " AND booking_country IN (" + strings.Join(quotedBookingCountries, ",") + ")"
	}

	// Filters for YearMonth
	if !excludeDate && payload.YearMonth > 0 {
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

	return sql
}

func (c *DashboardController) FilterClauseDefault(payload DashboardPayload) string {
	return c.FilterClause(payload, false)
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

	sql := `SELECT cust_coi AS country, cust_long_name AS entity, SUM(amount * rate) as total
  FROM ` + c.tableName() + ` 
	WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

	sql += ` GROUP BY cust_coi, cust_long_name ORDER BY cust_long_name`

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

func (c *DashboardController) GetDomicileData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := `SELECT DISTINCT cust_group_domicile AS country
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

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

	returnData := []string{}
	for _, v := range results {
		returnData = append(returnData, v.GetString("country"))
	}

	return c.SetResultOK(returnData)
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

	// Save original productCategory
	originalProductCategory := payload.ProductCategory

	// Get in out flow based on banks
	sql := `SELECT LEFT(counterparty_bank, 4) AS bank, IFNULL(SUM(amount * rate),0) AS value,
  product_category, ` + c.customerRoleClause() + ` AS flow 
  FROM ` + c.tableName() + `
  WHERE ` + c.isNTBClause() + ` <> "NA" 
	AND ` + c.commonWhereClause()

	sql += c.FilterClauseDefault(payload)

	sql += ` GROUP BY product_category, flow, bank`
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

	resultInward := []tk.M{}
	resultOutward := []tk.M{}

	// Get inward and outward product (CASH)
	if strings.ToUpper(originalProductCategory) != "TRADE" {
		// Explicitly set the productCategory as CASH
		payload.ProductCategory = "CASH"

		sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
		FROM ` + c.tableName() + `
		WHERE product_desc IN (` + strings.Join(c.InCash(), ", ") + `)
		AND ` + c.isNTBClause() + ` <> "NA" 
		AND ` + c.commonWhereClause()

		sql += c.FilterClauseDefault(payload)

		sql += ` GROUP BY product ORDER BY value DESC LIMIT 3`

		qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}

		err = qr.Fetch(&resultInward, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}

		sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
		FROM ` + c.tableName() + `
		WHERE product_desc IN (` + strings.Join(c.OutCash(), ", ") + `)
		AND ` + c.isNTBClause() + ` <> "NA" 
		AND ` + c.commonWhereClause()

		sql += c.FilterClauseDefault(payload)

		sql += ` GROUP BY product ORDER BY value DESC LIMIT 3`

		qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}

		err = qr.Fetch(&resultOutward, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}
	}

	resultExport := []tk.M{}
	resultImport := []tk.M{}
	resultOther := []tk.M{}

	if strings.ToUpper(originalProductCategory) != "CASH" {
		// Explicitly set the productCategory as TRADE
		payload.ProductCategory = "TRADE"

		sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
		FROM ` + c.tableName() + `
		WHERE product_desc IN (` + strings.Join(c.ExportTrade(), ", ") + `)
		AND ` + c.isNTBClause() + ` <> "NA" 
		AND ` + c.commonWhereClause()

		sql += c.FilterClauseDefault(payload)

		sql += ` GROUP BY product ORDER BY value DESC LIMIT 3`

		qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}

		err = qr.Fetch(&resultExport, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}

		sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
		FROM ` + c.tableName() + ` 
		WHERE product_desc IN (` + strings.Join(c.ImportTrade(), ", ") + `)
		AND ` + c.isNTBClause() + ` <> "NA" 
		AND ` + c.commonWhereClause()

		sql += c.FilterClauseDefault(payload)

		sql += ` GROUP BY product ORDER BY value DESC LIMIT 3`

		qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}

		err = qr.Fetch(&resultImport, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}

		sql = `SELECT product_desc AS product, IFNULL(SUM(amount * rate),0) AS value
		FROM ` + c.tableName() + `
		WHERE product_desc IN (` + strings.Join(c.OtherTrade(), ", ") + `)
		AND ` + c.isNTBClause() + ` <> "NA" 
		AND ` + c.commonWhereClause()

		sql += c.FilterClauseDefault(payload)

		sql += ` GROUP BY product ORDER BY value`

		qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}

		err = qr.Fetch(&resultOther, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}
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
	WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

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

	if strings.ToUpper(payload.Role) == "PAYEE" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "BUYER" {
		payload.Role = "BUYER"
	}

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

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

	if strings.ToUpper(payload.Role) == "BUYER" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "PAYEE" {
		payload.Role = "PAYEE"
	}

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

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

	if strings.ToUpper(payload.Role) == "BUYER" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "PAYEE" {
		payload.Role = "PAYEE"
	}

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

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

	if strings.ToUpper(payload.Role) == "PAYEE" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "BUYER" {
		payload.Role = "BUYER"
	}

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value
	FROM ` + c.tableName() + ` 
	WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

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

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetPeriodChangeETB(k *knot.WebContext) interface{} {
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
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.ToYearMonth)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT COUNT(DISTINCT cust_sci_leid) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.FromYearMonth)

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

func (c *DashboardController) GetPeriodChangeBuyer(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	if strings.ToUpper(payload.Role) == "PAYEE" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "BUYER" {
		payload.Role = "BUYER"
	}

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.ToYearMonth)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.FromYearMonth)

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

func (c *DashboardController) GetPeriodChangeSeller(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	if strings.ToUpper(payload.Role) == "BUYER" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "PAYEE" {
		payload.Role = "PAYEE"
	}

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.ToYearMonth)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT COUNT(DISTINCT cpty_long_name) AS value 
  FROM ` + c.tableName() + ` 
	WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.FromYearMonth)

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

func (c *DashboardController) GetPeriodChangeInFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	if strings.ToUpper(payload.Role) == "BUYER" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "PAYEE" {
		payload.Role = "PAYEE"
	}

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.ToYearMonth)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.FromYearMonth)

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

func (c *DashboardController) GetPeriodChangeOutFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	if strings.ToUpper(payload.Role) == "PAYEE" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "BUYER" {
		payload.Role = "BUYER"
	}

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.ToYearMonth)

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = `SELECT IFNULL(SUM(amount * rate),0) AS value
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClause(payload, true)

	sql += ` AND transaction_month <= ` + strconv.Itoa(payload.FromYearMonth)

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

	sql := `SELECT COUNT(DISTINCT cust_sci_leid) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

	sql += ` GROUP BY transaction_month ORDER BY transaction_month`

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

	if strings.ToUpper(payload.Role) == "PAYEE" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "BUYER" {
		payload.Role = "BUYER"
	}

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

	sql += ` GROUP BY transaction_month ORDER BY transaction_month`

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

	if strings.ToUpper(payload.Role) == "BUYER" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "PAYEE" {
		payload.Role = "PAYEE"
	}

	sql := `SELECT COUNT(DISTINCT cpty_long_name) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

	sql += ` GROUP BY transaction_month ORDER BY transaction_month`

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

	if strings.ToUpper(payload.Role) == "BUYER" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "PAYEE" {
		payload.Role = "PAYEE"
	}

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

	sql += ` GROUP BY transaction_month ORDER BY transaction_month`

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

	if strings.ToUpper(payload.Role) == "PAYEE" {
		return c.SetResultOK(0)
	} else if strings.ToUpper(payload.Role) != "BUYER" {
		payload.Role = "BUYER"
	}

	sql := `SELECT IFNULL(SUM(amount * rate),0) AS value, transaction_month AS category
  FROM ` + c.tableName() + ` 
  WHERE ` + c.commonWhereClause() + `
	AND ` + c.isNTBClause() + ` <> "NA"`

	sql += c.FilterClauseDefault(payload)

	sql += ` GROUP BY transaction_month ORDER BY transaction_month`

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
