package controllers

import (
	"eaciit/scb-eco/webapp/helper"
	"encoding/gob"
	"io/ioutil"
	"os"
	"strconv"
	"strings"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
	tk "github.com/eaciit/toolkit"
	"github.com/joho/sqltocsv"
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
	Offset            int
	DateType          string
	YearMonth         int
	ExecuteNow        bool
}

func (c *FilterEngineController) reTableName() string {
	return "re_ecosys_ready"
}

func (c *FilterEngineController) SaveParameter(param *FilterEnginePayload) error {
	type ForgetMe struct{}
	filePath := helper.GetAppBasePath(ForgetMe{}) + "/files/filterEngine.param"

	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := gob.NewEncoder(file)
	err = encoder.Encode(param)
	if err != nil {
		return err
	}

	return nil
}

func (c *FilterEngineController) LoadSavedParameter() (*FilterEnginePayload, error) {
	type ForgetMe struct{}
	filePath := helper.GetAppBasePath(ForgetMe{}) + "/files/filterEngine.param"

	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	param := FilterEnginePayload{}
	decoder := gob.NewDecoder(file)
	err = decoder.Decode(&param)
	if err != nil {
		return nil, err
	}

	return &param, nil
}

func (c *FilterEngineController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

func (c *FilterEngineController) GetSavedParameter(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	param, err := c.LoadSavedParameter()
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(param)
}

func (c *FilterEngineController) GenerateTable(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := FilterEnginePayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	// Save parameter
	err = c.SaveParameter(&payload)
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

	groupClause := ""
	if strings.ToUpper(payload.Group) == "INTRA-GROUP" {
		groupClause = " AND cust_group_name = cpty_group_name"
	} else if strings.ToUpper(payload.Group) == "" {
		groupClause = " AND cust_group_name <> cpty_group_name"
	}

	nestedClause := `
		SELECT
		cust_group_name, 
		cust_long_name, 
		cust_coi,
		cust_sci_leid,
		product_code,
		cpty_group_name,
		cpty_long_name,
		cpty_coi,
		cpty_sci_leid,
		COUNT(1) AS transaction_number,
		SUM(amount * rate) AS total_amount
		FROM
		` + c.tableName() + `
		WHERE 
		customer_role IN ('BUYER', 'DRAWEE')
		AND product_code IN ('VPrP', 'TPM')
		AND SUBSTRING(cpty_credit_grade, 1, CHAR_LENGTH(cpty_credit_grade)-1) ` + payload.CreditRating + `
		` + yearMonthClause + `
		` + groupClause + `
		GROUP BY 
		cust_group_name, 
		cust_long_name, 
		cust_coi,
		cust_sci_leid,
		product_code,
		cpty_group_name,
		cpty_long_name,
		cpty_coi,
		cpty_sci_leid
		HAVING
		transaction_number ` + payload.TransactionNumber + `
	`

	groupKey := "cust_long_name"
	sql := `
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
	`

	tk.Println("filterengine.go->GenerateTable-> ", sql)
	type ForgetMe struct{}
	filePath := helper.GetAppBasePath(ForgetMe{}) + "/files/filterEngine.sql"

	bytesSQL := []byte(sql)
	err = ioutil.WriteFile(filePath, bytesSQL, 0644)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	if payload.ExecuteNow {
		c.Scheduler.Run()
	}

	return c.SetResultOK(tk.M{})
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

	sqlMax := `
		SELECT
		COUNT(DISTINCT cust_group_name) AS max_row
		FROM ` + c.reTableName()

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sqlMax)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	resultsMax := []tk.M{}
	err = qr.Fetch(&resultsMax, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql := `
		SELECT
		cust_group_name,
		COUNT(DISTINCT cust_sci_leid) AS cust_number,
		COUNT(DISTINCT cust_coi) AS cust_coi_number,
		COUNT(DISTINCT cpty_sci_leid) AS cpty_number,
		SUM(transaction_number) AS total_transaction_number,
		SUM(total_amount) AS total_transaction_amount
		FROM ` + c.reTableName() + `
		GROUP BY cust_group_name
		ORDER BY total_transaction_amount DESC
	`

	if payload.Limit > 0 {
		sql += " LIMIT " + strconv.Itoa(payload.Limit)
	}

	if payload.Offset > 0 {
		sql += " OFFSET " + strconv.Itoa(payload.Offset)
	}
	tk.Println("filterengine.go->GetResult-> ", sql)
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
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
		"max":  resultsMax[0].Get("max_row"),
		"rows": results,
	})
}

func (c *FilterEngineController) DownloadResult(k *knot.WebContext) interface{} {
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	k.Config.NoLog = true
	k.Config.OutputType = knot.OutputNone

	sql := `
		SELECT
		cust_group_name,
		COUNT(DISTINCT cust_sci_leid) AS cust_number,
		COUNT(DISTINCT cust_coi) AS cust_coi_number,
		COUNT(DISTINCT cpty_sci_leid) AS cpty_number,
		SUM(transaction_number) AS total_transaction_number,
		SUM(total_amount) AS total_transaction_amount
		FROM ` + c.reTableName() + `
		GROUP BY cust_group_name
		ORDER BY total_transaction_amount DESC
	`
	tk.Println("filterengine.go->DownloadResult-> ", sql)

	rows, _ := c.Db.Query(sql)

	k.Writer.Header().Set("Content-type", "text/csv")
	k.Writer.Header().Set("Content-Disposition", "attachment; filename=\"download.csv\"")

	sqltocsv.Write(k.Writer, rows)
	// println(k.Request.URL.Query().Get("group_name"))

	return nil
}

func (c *FilterEngineController) GetResultDetail(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := struct {
		GroupName string
		Limit     int
		Offset    int
	}{}

	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sqlMax := `
		SELECT
		COUNT(1) AS max_row
		FROM ` + c.reTableName() + `
		WHERE cust_group_name = "` + payload.GroupName + `"`

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sqlMax)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}
	defer qr.Close()

	resultsMax := []tk.M{}
	err = qr.Fetch(&resultsMax, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql := `
		SELECT *
		FROM ` + c.reTableName() + `
		WHERE cust_group_name = "` + payload.GroupName + `"
		ORDER BY total_amount DESC
	`

	if payload.Limit > 0 {
		sql += " LIMIT " + strconv.Itoa(payload.Limit)
	}

	if payload.Offset > 0 {
		sql += " OFFSET " + strconv.Itoa(payload.Offset)
	}

	tk.Println("filterengine.go->GetResultDetail-> ", sql)
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
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
		"max":  resultsMax[0].Get("max_row"),
		"rows": results,
	})
}

func (c *FilterEngineController) DownloadResultDetail(k *knot.WebContext) interface{} {
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	k.Config.NoLog = true
	k.Config.OutputType = knot.OutputNone

	groupName := k.Request.URL.Query().Get("group_name")

	sql := `
		SELECT *
		FROM ` + c.reTableName() + `
		WHERE cust_group_name = "` + groupName + `"
		ORDER BY total_amount DESC
	`
	tk.Println("filterengine.go->DownloadResultDetail-> ", sql)
	rows, _ := c.Db.Query(sql)

	k.Writer.Header().Set("Content-type", "text/csv")
	k.Writer.Header().Set("Content-Disposition", "attachment; filename=\"download.csv\"")

	sqltocsv.Write(k.Writer, rows)

	return nil
}

func (c *FilterEngineController) GetSchedulerNextRun(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	_, t := c.Scheduler.GcScheduler.NextRun()

	return c.SetResultOK(tk.M{"nexTime": t})
}
