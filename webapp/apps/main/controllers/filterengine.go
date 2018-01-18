package controllers

import (
	"strconv"
	"strings"

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
	DateType          string
	YearMonth         int
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

	// Filters for YearMonth
	yearMonthClause := ""
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			yearMonthClause += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			yearMonthClause += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	}

	nestedClause := `
		SELECT
		cust_group_name, 
		cust_long_name, 
		cust_coi,
		cust_sci_leid,
		cpty_group_name,
		cpty_long_name,
		cpty_coi,
		cpty_sci_leid,
		COUNT(1) AS transaction_number,
		SUM(amount * rate) AS total_amount
		FROM
		` + c.tableName() + `
		WHERE cust_group_name <> cpty_group_name
		AND customer_role IN ('BUYER', 'DRAWEE')
		AND product_code IN ('VPrP', 'TPM')
		AND cpty_credit_grade ` + payload.CreditRating + `
		` + yearMonthClause + `
		GROUP BY 
		cust_group_name, 
		cust_long_name, 
		cust_coi,
		cust_sci_leid,
		cpty_group_name,
		cpty_long_name,
		cpty_coi,
		cpty_sci_leid
		HAVING
		transaction_number ` + payload.TransactionNumber + `
	`

	groupKey := "cust_long_name"
	fromClause := `
		SELECT 
		TB.*
		FROM
		(
			SELECT 
			` + groupKey + `,
			COUNT(DISTINCT cpty_sci_leid) AS supplier_count
			FROM 
			(
				` + nestedClause + `
			) TA1
			GROUP BY
			cust_long_name
			HAVING
			supplier_count ` + payload.SupplierNumber + `
		) TA
		LEFT JOIN
		(
			` + nestedClause + `
		) TB
		ON TA.` + groupKey + ` = TB.` + groupKey + `
		ORDER BY total_amount DESC
	`

	sql := `
		SELECT
		cust_group_name,
		COUNT(DISTINCT cust_sci_leid) AS cust_number,
		COUNT(DISTINCT cust_coi) AS cust_coi_number,
		COUNT(DISTINCT cpty_sci_leid) AS cpty_number,
		SUM(transaction_number) AS total_transaction_number,
		SUM(total_amount) AS total_transaction_amount
		FROM
		(
			` + fromClause + `
		) TF
		GROUP BY cust_group_name
		ORDER BY total_transaction_amount DESC
	`

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
